const database = require('../database');
const { HttpError } = require('../utils/http-error');

async function listProducts() {
    return database.all(
        `SELECT p.*, u.nome AS produtor_nome,
                ROUND(AVG(a.nota), 1) AS media_avaliacao,
                COUNT(a.id) AS total_avaliacoes,
                COALESCE((
                    SELECT SUM(ip.quantidade)
                    FROM itens_pedido ip
                    WHERE ip.produto_id = p.id
                ), 0) AS total_vendido,
                COALESCE(pg.aceita_pix, 0) AS aceita_pix,
                pg.chave_pix,
                COALESCE(pg.aceita_dinheiro, 0) AS aceita_dinheiro
         FROM produtos p
         JOIN usuarios u ON u.id = p.produtor_id
         LEFT JOIN avaliacoes a ON a.produto_id = p.id
         LEFT JOIN pagamentos_produtor pg ON pg.produtor_id = p.produtor_id
         GROUP BY p.id, u.nome, pg.aceita_pix, pg.chave_pix, pg.aceita_dinheiro
         ORDER BY p.id DESC`
    );
}

async function createProduct(data, producerId, imagePath) {
    const product = validateProduct(data);
    const result = await database.run(
        `INSERT INTO produtos (nome, descricao, preco, quantidade, imagem, produtor_id)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
        [product.nome, product.descricao, product.preco, product.quantidade, imagePath, producerId]
    );
    return result.lastID;
}

function validateProduct(data) {
    const nome = String(data.nome || '').trim();
    const descricao = String(data.descricao || '').trim();
    const preco = Number(data.preco);
    const quantidade = Number(data.quantidade);

    if (!nome || !Number.isFinite(preco) || preco < 0 || !Number.isInteger(quantidade) || quantidade < 0) {
        throw new HttpError(400, 'Nome, preco e quantidade validos sao obrigatorios.');
    }
    return { nome, descricao, preco, quantidade };
}

async function updateProduct(productId, producerId, data, imagePath) {
    const product = validateProduct(data);
    const existing = await database.get('SELECT id FROM produtos WHERE id = ? AND produtor_id = ?', [productId, producerId]);
    if (!existing) throw new HttpError(404, 'Produto nao encontrado.');

    const result = await database.run(
        `UPDATE produtos SET nome = ?, descricao = ?, preco = ?, quantidade = ?,
            imagem = COALESCE(?, imagem)
         WHERE id = ? AND produtor_id = ?`,
        [product.nome, product.descricao, product.preco, product.quantidade, imagePath, productId, producerId]
    );
    return result.changes;
}

async function deleteProduct(productId, producerId) {
    const existing = await database.get('SELECT id FROM produtos WHERE id = ? AND produtor_id = ?', [productId, producerId]);
    if (!existing) throw new HttpError(404, 'Produto nao encontrado.');
    const sold = await database.get('SELECT 1 FROM itens_pedido WHERE produto_id = ? LIMIT 1', [productId]);
    if (sold) {
        throw new HttpError(409, 'Este produto possui vendas e nao pode ser excluido para preservar o historico. Zere o estoque para tira-lo da feira.');
    }
    await database.run('DELETE FROM produtos WHERE id = ? AND produtor_id = ?', [productId, producerId]);
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct };
