const crypto = require('crypto');
const { config } = require('../config');
const database = require('../database');
const { HttpError } = require('../utils/http-error');
const { hashPassword, verifyPassword } = require('../utils/password');

function publicUser(user) {
    return { id: user.id, nome: user.nome, perfil: user.tipo_perfil };
}

function parseAddress(data) {
    return {
        cep: String(data.cep || '').replace(/\D/g, ''),
        rua: String(data.rua || '').trim(),
        numero: String(data.numero || '').trim(),
        complemento: String(data.complemento || '').trim(),
        bairro: String(data.bairro || '').trim(),
        cidade: String(data.cidade || '').trim(),
        estado: String(data.estado || '').trim().toUpperCase()
    };
}

function validateAddress(address) {
    if (address.cep.length !== 8 || !address.rua || !address.numero || !address.bairro || !address.cidade || address.estado.length !== 2) {
        throw new HttpError(400, 'Informe CEP, rua, numero, bairro, cidade e estado para o endereco de entrega.');
    }
    return address;
}

async function register(data) {
    const nome = String(data.nome || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const telefone = String(data.telefone || '').trim();
    const senha = String(data.senha || '');
    const perfil = data.tipo_perfil;
    const address = parseAddress(data);

    if (nome.length < 6 || !email || !email.includes('@') || senha.length < 6) {
        throw new HttpError(400, 'Nome e senha devem ter pelo menos 6 caracteres, e o e-mail deve ser valido.');
    }
    if (!['cliente', 'produtor'].includes(perfil)) {
        throw new HttpError(400, 'Perfil de usuario invalido.');
    }
    try {
        const result = await database.run(
            `INSERT INTO usuarios (nome, email, telefone, senha, tipo_perfil,
                endereco_cep, endereco_rua, endereco_numero, endereco_complemento,
                endereco_bairro, endereco_cidade, endereco_estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [nome, email, telefone, hashPassword(senha), perfil,
                address.cep || null, address.rua || null, address.numero || null, address.complemento || null,
                address.bairro || null, address.cidade || null, address.estado || null]
        );
        return result.lastID;
    } catch (error) {
        if (error.code === '23505') {
            throw new HttpError(409, 'Este e-mail ja esta cadastrado.');
        }
        throw error;
    }
}

async function login(emailInput, passwordInput) {
    const email = String(emailInput || '').trim().toLowerCase();
    const password = String(passwordInput || '');
    const user = await database.get('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!user || !verifyPassword(password, user.senha)) {
        throw new HttpError(401, 'Credenciais invalidas.');
    }

    if (!user.senha.startsWith('scrypt$')) {
        await database.run('UPDATE usuarios SET senha = ? WHERE id = ?', [hashPassword(password), user.id]);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.sessionDays * 86400000).toISOString();
    await database.run(
        'INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (?, ?, ?)',
        [token, user.id, expiresAt]
    );

    return { token, user: publicUser(user) };
}

async function findUserByToken(token) {
    return database.get(
        `SELECT u.id, u.nome, u.email, u.tipo_perfil
         FROM sessoes s
         JOIN usuarios u ON u.id = s.usuario_id
         WHERE s.token = ? AND s.expira_em > CURRENT_TIMESTAMP`,
        [token]
    );
}

async function logout(token) {
    await database.run('DELETE FROM sessoes WHERE token = ?', [token]);
}

async function getAddress(userId) {
    const row = await database.get(
        `SELECT endereco_cep AS cep, endereco_rua AS rua, endereco_numero AS numero,
                endereco_complemento AS complemento, endereco_bairro AS bairro,
                endereco_cidade AS cidade, endereco_estado AS estado
         FROM usuarios WHERE id = ?`,
        [userId]
    );
    return row || {};
}

async function updateAddress(userId, data) {
    const address = validateAddress(parseAddress(data));
    await database.run(
        `UPDATE usuarios SET endereco_cep = ?, endereco_rua = ?, endereco_numero = ?,
            endereco_complemento = ?, endereco_bairro = ?, endereco_cidade = ?, endereco_estado = ?
         WHERE id = ?`,
        [address.cep, address.rua, address.numero, address.complemento || null,
            address.bairro, address.cidade, address.estado, userId]
    );
    return address;
}

module.exports = { register, login, findUserByToken, logout, getAddress, updateAddress, validateAddress };
