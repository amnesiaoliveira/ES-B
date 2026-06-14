const database = require('../database');
const { HttpError } = require('../utils/http-error');

async function ensureParticipant(conversationId, userId) {
    const conversation = await database.get(
        'SELECT * FROM conversas WHERE id = ? AND (cliente_id = ? OR produtor_id = ?)',
        [conversationId, userId, userId]
    );
    if (!conversation) throw new HttpError(404, 'Conversa nao encontrada.');
    return conversation;
}

async function startConversation(clientId, producerId) {
    if (!Number.isInteger(producerId)) throw new HttpError(400, 'Produtor invalido.');
    const producer = await database.get(
        "SELECT id FROM usuarios WHERE id = ? AND tipo_perfil = 'produtor'",
        [producerId]
    );
    if (!producer) throw new HttpError(404, 'Produtor nao encontrado.');
    const result = await database.get(
        `INSERT INTO conversas (cliente_id, produtor_id) VALUES (?, ?)
         ON CONFLICT(cliente_id, produtor_id) DO UPDATE SET produtor_id = EXCLUDED.produtor_id
         RETURNING id`,
        [clientId, producerId]
    );
    return result.id;
}

async function listConversations(user) {
    const counterpart = user.tipo_perfil === 'cliente' ? 'c.produtor_id' : 'c.cliente_id';
    const ownerColumn = user.tipo_perfil === 'cliente' ? 'c.cliente_id' : 'c.produtor_id';
    return database.all(
        `SELECT c.id, u.nome AS contato_nome,
                (SELECT texto FROM mensagens WHERE conversa_id = c.id ORDER BY criado_em DESC, id DESC LIMIT 1) AS ultima_mensagem,
                (SELECT criado_em FROM mensagens WHERE conversa_id = c.id ORDER BY criado_em DESC, id DESC LIMIT 1) AS ultima_data
         FROM conversas c JOIN usuarios u ON u.id = ${counterpart}
         WHERE ${ownerColumn} = ?
         ORDER BY ultima_data DESC NULLS LAST, c.id DESC`,
        [user.id]
    );
}

async function listMessages(conversationId, userId) {
    await ensureParticipant(conversationId, userId);
    return database.all(
        `SELECT m.id, m.remetente_id, m.texto, m.criado_em, u.nome AS remetente_nome
         FROM mensagens m JOIN usuarios u ON u.id = m.remetente_id
         WHERE m.conversa_id = ? ORDER BY m.criado_em, m.id`,
        [conversationId]
    );
}

async function sendMessage(conversationId, userId, textInput) {
    await ensureParticipant(conversationId, userId);
    const texto = String(textInput || '').trim();
    if (!texto) throw new HttpError(400, 'Digite uma mensagem.');
    if (texto.length > 1000) throw new HttpError(400, 'A mensagem deve ter no maximo 1000 caracteres.');
    const result = await database.run(
        'INSERT INTO mensagens (conversa_id, remetente_id, texto) VALUES (?, ?, ?) RETURNING id',
        [conversationId, userId, texto]
    );
    return result.lastID;
}

module.exports = { startConversation, listConversations, listMessages, sendMessage };
