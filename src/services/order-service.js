const database = require('../database');
const { HttpError } = require('../utils/http-error');

function parseItems(itemsInput) {
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
        throw new HttpError(400, 'Carrinho vazio.');
    }

    const quantities = new Map();
    for (const item of itemsInput) {
        const productId = Number(item.produto_id);
        const quantity = Number(item.quantidade);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
            throw new HttpError(400, 'Item de pedido invalido.');
        }
        quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }
    return quantities;
}

function getPaymentForProducer(payments, producerId) {
    const payment = payments.find((item) => Number(item.produtor_id) === producerId);
    if (!payment) throw new HttpError(400, `Escolha o pagamento do produtor ${producerId}.`);
    return payment;
}

function validatePayment(payment, settings, total) {
    const method = String(payment.forma_pagamento || '').toLowerCase();
    if (!['pix', 'dinheiro'].includes(method)) {
        throw new HttpError(400, 'Escolha PIX ou dinheiro para cada produtor.');
    }

    if (method === 'pix') {
        if (!settings.aceita_pix || !settings.chave_pix) {
            throw new HttpError(409, 'Um dos produtores nao aceita PIX.');
        }
        return { method, status: 'Aguardando comprovante', changeFor: null, pixKey: settings.chave_pix };
    }

    if (!settings.aceita_dinheiro) {
        throw new HttpError(409, 'Um dos produtores nao aceita pagamento em dinheiro.');
    }
    let changeFor = null;
    if (payment.precisa_troco) {
        changeFor = Number(payment.troco_para);
        if (!Number.isFinite(changeFor) || changeFor < total) {
            throw new HttpError(400, 'O valor para troco deve ser igual ou maior que o total do produtor.');
        }
    }
    return { method, status: 'Aguardando confirmacao', changeFor, pixKey: null };
}

async function createPurchase(clientId, itemsInput, paymentsInput = []) {
    const quantities = parseItems(itemsInput);
    if (!Array.isArray(paymentsInput)) throw new HttpError(400, 'Pagamentos invalidos.');

    return database.executeTransaction(async (tx) => {
        const address = await tx.get(
            `SELECT endereco_cep AS cep, endereco_rua AS rua, endereco_numero AS numero,
                    endereco_complemento AS complemento, endereco_bairro AS bairro,
                    endereco_cidade AS cidade, endereco_estado AS estado
             FROM usuarios WHERE id = ?`,
            [clientId]
        );
        if (!address || String(address.cep || '').length !== 8 || !address.rua || !address.numero || !address.bairro || !address.cidade || String(address.estado || '').length !== 2) {
            throw new HttpError(400, 'Cadastre um endereco de entrega completo antes de fazer o pedido.');
        }
        const groups = new Map();

        for (const [productId, quantity] of quantities) {
            const product = await tx.get(
                'SELECT id, nome, preco, quantidade, produtor_id FROM produtos WHERE id = ?',
                [productId]
            );
            if (!product) throw new HttpError(404, `Produto ${productId} nao encontrado.`);
            if (product.quantidade < quantity) {
                throw new HttpError(409, `Estoque insuficiente para ${product.nome}.`);
            }
            if (!groups.has(product.produtor_id)) groups.set(product.produtor_id, { products: [], total: 0 });
            const group = groups.get(product.produtor_id);
            group.total += product.preco * quantity;
            group.products.push({ ...product, requestedQuantity: quantity });
        }

        const preparedGroups = [];
        for (const [producerId, group] of groups) {
            const settings = await tx.get(
                'SELECT aceita_pix, chave_pix, aceita_dinheiro FROM pagamentos_produtor WHERE produtor_id = ?',
                [producerId]
            );
            if (!settings) throw new HttpError(409, 'Um dos produtores ainda nao configurou formas de pagamento.');
            const payment = getPaymentForProducer(paymentsInput, producerId);
            preparedGroups.push({ producerId, ...group, payment: validatePayment(payment, settings, group.total) });
        }

        const purchase = await tx.run(
            `INSERT INTO compras (cliente_id, entrega_cep, entrega_rua, entrega_numero,
                entrega_complemento, entrega_bairro, entrega_cidade, entrega_estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [clientId, address.cep, address.rua, address.numero, address.complemento,
                address.bairro, address.cidade, address.estado]
        );
        const orders = [];
        for (const group of preparedGroups) {
            const order = await tx.run(
                `INSERT INTO pedidos
                    (compra_id, cliente_id, produtor_id, status, forma_pagamento, troco_para, chave_pix)
                 VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                [purchase.lastID, clientId, group.producerId, group.payment.status,
                    group.payment.method, group.payment.changeFor, group.payment.pixKey]
            );

            for (const product of group.products) {
                const stock = await tx.run(
                    'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ? AND quantidade >= ?',
                    [product.requestedQuantity, product.id, product.requestedQuantity]
                );
                if (stock.changes !== 1) throw new HttpError(409, `Estoque insuficiente para ${product.nome}.`);
                await tx.run(
                    `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
                     VALUES (?, ?, ?, ?)`,
                    [order.lastID, product.id, product.requestedQuantity, product.preco]
                );
            }
            orders.push({ pedidoId: order.lastID, produtorId: group.producerId, formaPagamento: group.payment.method });
        }
        return { compraId: purchase.lastID, pedidos: orders };
    });
}

async function createOrder(clientId, itemsInput, paymentInput = {}) {
    const product = await database.get('SELECT produtor_id FROM produtos WHERE id = ?', [Number(itemsInput?.[0]?.produto_id)]);
    if (!product) throw new HttpError(404, 'Produto nao encontrado.');
    const result = await createPurchase(clientId, itemsInput, [{ ...paymentInput, produtor_id: product.produtor_id }]);
    return result.pedidos[0].pedidoId;
}

async function attachReceipt(clientId, orderIdInput, receiptPath) {
    const orderId = Number(orderIdInput);
    const order = await database.get(
        'SELECT id, forma_pagamento, status FROM pedidos WHERE id = ? AND cliente_id = ?',
        [orderId, clientId]
    );
    if (!order) throw new HttpError(404, 'Pedido nao encontrado.');
    if (order.forma_pagamento !== 'pix') throw new HttpError(400, 'Este pedido nao foi pago via PIX.');
    if (order.status === 'Aceito') throw new HttpError(409, 'O pedido ja foi aceito.');

    await database.run(
        "UPDATE pedidos SET comprovante = ?, status = 'Comprovante enviado' WHERE id = ?",
        [receiptPath, orderId]
    );
}

async function acceptOrder(producerId, orderIdInput) {
    const orderId = Number(orderIdInput);
    const order = await database.get(
        `SELECT id, forma_pagamento, comprovante, status
         FROM pedidos WHERE id = ? AND produtor_id = ?`,
        [orderId, producerId]
    );
    if (!order) throw new HttpError(404, 'Pedido nao encontrado.');
    if (order.status === 'Aceito') return;
    if (order.forma_pagamento === 'pix' && !order.comprovante) {
        throw new HttpError(409, 'Aguarde o envio do comprovante PIX.');
    }
    await database.run("UPDATE pedidos SET status = 'Aceito' WHERE id = ?", [orderId]);
}

async function listClientOrders(clientId) {
    return database.all(
        `SELECT p.id AS pedido_id, p.compra_id, p.data_pedido, p.status, p.forma_pagamento,
                p.troco_para, p.chave_pix, p.comprovante,
                pr.id AS produto_id, pr.nome AS produto_nome, pr.imagem,
                ip.quantidade, ip.preco_unitario, u.nome AS produtor_nome,
                c.entrega_cep, c.entrega_rua, c.entrega_numero, c.entrega_complemento,
                c.entrega_bairro, c.entrega_cidade, c.entrega_estado
         FROM pedidos p
         LEFT JOIN compras c ON c.id = p.compra_id
         JOIN itens_pedido ip ON p.id = ip.pedido_id
         JOIN produtos pr ON ip.produto_id = pr.id
         JOIN usuarios u ON p.produtor_id = u.id
         WHERE p.cliente_id = ?
         ORDER BY p.data_pedido DESC, p.id DESC`,
        [clientId]
    );
}

async function listProducerOrders(producerId) {
    return database.all(
        `SELECT p.id AS pedido_id, p.data_pedido, p.status, p.forma_pagamento,
                p.troco_para, p.chave_pix, p.comprovante,
                u.nome AS cliente_nome, pr.nome AS produto_nome,
                ip.quantidade, ip.preco_unitario,
                c.entrega_cep, c.entrega_rua, c.entrega_numero, c.entrega_complemento,
                c.entrega_bairro, c.entrega_cidade, c.entrega_estado
         FROM pedidos p
         LEFT JOIN compras c ON c.id = p.compra_id
         JOIN itens_pedido ip ON ip.pedido_id = p.id
         JOIN produtos pr ON ip.produto_id = pr.id
         JOIN usuarios u ON p.cliente_id = u.id
         WHERE p.produtor_id = ?
         ORDER BY p.data_pedido DESC, p.id DESC`,
        [producerId]
    );
}

module.exports = {
    createOrder,
    createPurchase,
    attachReceipt,
    acceptOrder,
    listClientOrders,
    listProducerOrders
};
