const database = require('../database');

async function producerDashboard(producerId) {
    const summary = await database.get(
        `SELECT COUNT(DISTINCT p.id) AS total_pedidos,
                COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) AS faturamento,
                COALESCE(SUM(ip.quantidade), 0) AS itens_vendidos,
                COUNT(DISTINCT CASE WHEN p.status <> 'Aceito' THEN p.id END) AS pedidos_pendentes
         FROM pedidos p
         LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
         WHERE p.produtor_id = ?`,
        [producerId]
    );
    const products = await database.all(
        `SELECT pr.id, pr.nome, pr.quantidade,
                COALESCE(SUM(ip.quantidade), 0) AS total_vendido,
                COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) AS receita
         FROM produtos pr
         LEFT JOIN itens_pedido ip ON ip.produto_id = pr.id
         WHERE pr.produtor_id = ?
         GROUP BY pr.id
         ORDER BY total_vendido DESC, pr.nome`,
        [producerId]
    );
    return { summary, products, lowStock: products.filter((product) => product.quantidade <= 5) };
}

async function clientNotifications(clientId) {
    return database.all(
        `SELECT p.id, p.status, p.data_pedido, u.nome AS produtor_nome
         FROM pedidos p JOIN usuarios u ON u.id = p.produtor_id
         WHERE p.cliente_id = ?
         ORDER BY p.data_pedido DESC LIMIT 8`,
        [clientId]
    );
}

module.exports = { producerDashboard, clientNotifications };
