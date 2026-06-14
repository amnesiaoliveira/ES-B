const database = require('../database');
const { HttpError } = require('../utils/http-error');

async function createReview(clientId, data) {
    const productId = Number(data.produto_id);
    const rating = Number(data.nota);
    const comment = String(data.comentario || '').trim();

    if (!Number.isInteger(productId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new HttpError(400, 'Produto e nota entre 1 e 5 sao obrigatorios.');
    }

    const purchase = await database.get(
        `SELECT 1 FROM pedidos p
         JOIN itens_pedido ip ON ip.pedido_id = p.id
         WHERE p.cliente_id = ? AND ip.produto_id = ? LIMIT 1`,
        [clientId, productId]
    );
    if (!purchase) throw new HttpError(403, 'Somente compradores podem avaliar este produto.');

    const result = await database.run(
        `INSERT INTO avaliacoes (produto_id, cliente_id, nota, comentario)
         VALUES (?, ?, ?, ?) RETURNING id`,
        [productId, clientId, rating, comment]
    );
    return result.lastID;
}

async function listProducerReviews(producerId) {
    return database.all(
        `SELECT a.nota, a.comentario, a.data_avaliacao, u.nome AS cliente_nome,
                pr.nome AS produto_nome, pr.imagem AS produto_imagem
         FROM avaliacoes a
         JOIN produtos pr ON a.produto_id = pr.id
         JOIN usuarios u ON a.cliente_id = u.id
         WHERE pr.produtor_id = ?
         ORDER BY a.data_avaliacao DESC`,
        [producerId]
    );
}

module.exports = { createReview, listProducerReviews };
