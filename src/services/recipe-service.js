const database = require('../database');
const { HttpError } = require('../utils/http-error');

async function listRecipes() {
    return database.all(
        `SELECT r.id, r.titulo, r.descricao, r.ingredientes, r.modo_preparo,
                r.criado_em, u.nome AS autor_nome,
                COALESCE(json_agg(json_build_object('id', p.id, 'nome', p.nome, 'imagem', p.imagem))
                    FILTER (WHERE p.id IS NOT NULL), '[]') AS produtos
         FROM receitas r
         JOIN usuarios u ON u.id = r.cliente_id
         LEFT JOIN receita_produtos rp ON rp.receita_id = r.id
         LEFT JOIN produtos p ON p.id = rp.produto_id
         GROUP BY r.id, u.nome
         ORDER BY r.criado_em DESC, r.id DESC`
    );
}

async function createRecipe(clientId, data) {
    const titulo = String(data.titulo || '').trim();
    const descricao = String(data.descricao || '').trim();
    const ingredientes = String(data.ingredientes || '').trim();
    const modoPreparo = String(data.modo_preparo || '').trim();
    const productIds = [...new Set((Array.isArray(data.produto_ids) ? data.produto_ids : [])
        .map(Number).filter(Number.isInteger))];

    if (!titulo || !descricao || !ingredientes || !modoPreparo) {
        throw new HttpError(400, 'Preencha titulo, descricao, ingredientes e modo de preparo.');
    }
    if (titulo.length > 120) throw new HttpError(400, 'O titulo deve ter no maximo 120 caracteres.');

    return database.executeTransaction(async (tx) => {
        const result = await tx.run(
            `INSERT INTO receitas (cliente_id, titulo, descricao, ingredientes, modo_preparo)
             VALUES (?, ?, ?, ?, ?) RETURNING id`,
            [clientId, titulo, descricao, ingredientes, modoPreparo]
        );
        for (const productId of productIds) {
            await tx.run('INSERT INTO receita_produtos (receita_id, produto_id) VALUES (?, ?)', [result.lastID, productId]);
        }
        return result.lastID;
    });
}

module.exports = { listRecipes, createRecipe };
