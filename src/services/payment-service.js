const database = require('../database');
const { HttpError } = require('../utils/http-error');

async function getProducerPayment(producerId) {
    const settings = await database.get(
        `SELECT produtor_id, aceita_pix, chave_pix, aceita_dinheiro
         FROM pagamentos_produtor WHERE produtor_id = ?`,
        [producerId]
    );
    return settings || {
        produtor_id: producerId,
        aceita_pix: 0,
        chave_pix: '',
        aceita_dinheiro: 0
    };
}

async function updateProducerPayment(producerId, data) {
    const acceptsPix = data.aceita_pix === true || data.aceita_pix === 1 || data.aceita_pix === '1';
    const acceptsCash = data.aceita_dinheiro === true || data.aceita_dinheiro === 1 || data.aceita_dinheiro === '1';
    const pixKey = String(data.chave_pix || '').trim();

    if (!acceptsPix && !acceptsCash) {
        throw new HttpError(400, 'Ative pelo menos uma forma de pagamento.');
    }
    if (acceptsPix && !pixKey) {
        throw new HttpError(400, 'Informe a chave PIX.');
    }

    await database.run(
        `INSERT INTO pagamentos_produtor
            (produtor_id, aceita_pix, chave_pix, aceita_dinheiro, atualizado_em)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(produtor_id) DO UPDATE SET
            aceita_pix = excluded.aceita_pix,
            chave_pix = excluded.chave_pix,
            aceita_dinheiro = excluded.aceita_dinheiro,
            atualizado_em = CURRENT_TIMESTAMP`,
        [producerId, acceptsPix ? 1 : 0, acceptsPix ? pixKey : null, acceptsCash ? 1 : 0]
    );
    return getProducerPayment(producerId);
}

module.exports = { getProducerPayment, updateProducerPayment };
