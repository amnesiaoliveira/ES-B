const database = require('../database');
const { HttpError } = require('../utils/http-error');

async function listFavorites(clientId) {
    return database.all('SELECT produto_id FROM favoritos WHERE cliente_id = ? ORDER BY criado_em DESC', [clientId]);
}

async function addFavorite(clientId, productId) {
    if (!Number.isInteger(productId)) throw new HttpError(400, 'Produto invalido.');
    const product = await database.get('SELECT id FROM produtos WHERE id = ?', [productId]);
    if (!product) throw new HttpError(404, 'Produto nao encontrado.');
    await database.run(
        `INSERT INTO favoritos (cliente_id, produto_id) VALUES (?, ?)
         ON CONFLICT(cliente_id, produto_id) DO NOTHING`,
        [clientId, productId]
    );
    return { produto_id: productId, favorito: true };
}

async function removeFavorite(clientId, productId) {
    await database.run('DELETE FROM favoritos WHERE cliente_id = ? AND produto_id = ?', [clientId, productId]);
    return { produto_id: productId, favorito: false };
}

module.exports = { listFavorites, addFavorite, removeFavorite };
