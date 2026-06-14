const test = require('node:test');
const assert = require('node:assert/strict');

if (!process.env.TEST_DATABASE_URL) {
    test('servicos com PostgreSQL', { skip: 'Defina TEST_DATABASE_URL para executar os testes de integracao.' }, () => {});
} else {
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const database = require('../src/database');
const authService = require('../src/services/auth-service');
const productService = require('../src/services/product-service');
const orderService = require('../src/services/order-service');
const paymentService = require('../src/services/payment-service');

let producer;
let secondProducer;
let client;
let productId;

test.before(async () => {
    await database.initializeDatabase();
    await database.run(
        `TRUNCATE TABLE itens_pedido, avaliacoes, pedidos, compras, produtos,
            pagamentos_produtor, sessoes, usuarios RESTART IDENTITY CASCADE`
    );
    const producerId = await authService.register({
        nome: 'Produtor Teste',
        email: 'produtor@teste.local',
        senha: 'senha123',
        tipo_perfil: 'produtor'
    });
    const clientId = await authService.register({
        nome: 'Cliente Teste',
        email: 'cliente@teste.local',
        senha: 'senha123',
        tipo_perfil: 'cliente',
        cep: '01001000',
        rua: 'Praca da Se',
        numero: '1',
        bairro: 'Se',
        cidade: 'Sao Paulo',
        estado: 'SP'
    });
    const secondProducerId = await authService.register({
        nome: 'Segundo Produtor',
        email: 'produtor2@teste.local',
        senha: 'senha123',
        tipo_perfil: 'produtor'
    });
    producer = { id: producerId };
    secondProducer = { id: secondProducerId };
    client = { id: clientId };
    await paymentService.updateProducerPayment(producer.id, {
        aceita_pix: true,
        chave_pix: 'pix@produtor.test',
        aceita_dinheiro: true
    });
    await paymentService.updateProducerPayment(secondProducer.id, {
        aceita_pix: false,
        aceita_dinheiro: true
    });
});

test.after(async () => {
    await database.close();
});

test('login cria uma sessao valida', async () => {
    const result = await authService.login('cliente@teste.local', 'senha123');
    assert.equal(result.user.id, client.id);
    assert.equal(result.user.perfil, 'cliente');
    assert.ok(await authService.findUserByToken(result.token));
});

test('pedido usa o preco do banco e baixa o estoque', async () => {
    productId = await productService.createProduct({
        nome: 'Cesta Organica',
        descricao: 'Teste',
        preco: 25.5,
        quantidade: 3
    }, producer.id, '/uploads/teste.png');

    const orderId = await orderService.createOrder(client.id, [
        { produto_id: productId, quantidade: 2, preco_unitario: 0.01 }
    ], { forma_pagamento: 'pix' });

    const item = await database.get(
        'SELECT preco_unitario, quantidade FROM itens_pedido WHERE pedido_id = ?',
        [orderId]
    );
    const product = await database.get('SELECT quantidade FROM produtos WHERE id = ?', [productId]);
    assert.equal(item.preco_unitario, 25.5);
    assert.equal(item.quantidade, 2);
    assert.equal(product.quantidade, 1);

    await assert.rejects(orderService.acceptOrder(producer.id, orderId), /comprovante PIX/);
    await orderService.attachReceipt(client.id, orderId, '/uploads/comprovante.png');
    await orderService.acceptOrder(producer.id, orderId);
    const accepted = await database.get('SELECT status, comprovante FROM pedidos WHERE id = ?', [orderId]);
    assert.equal(accepted.status, 'Aceito');
    assert.equal(accepted.comprovante, '/uploads/comprovante.png');
});

test('pedido sem estoque faz rollback completo', async () => {
    const ordersBefore = await database.get('SELECT COUNT(*) AS total FROM pedidos');

    await assert.rejects(
        orderService.createOrder(client.id, [{ produto_id: productId, quantidade: 2 }], { forma_pagamento: 'dinheiro' }),
        /Estoque insuficiente/
    );

    const ordersAfter = await database.get('SELECT COUNT(*) AS total FROM pedidos');
    const product = await database.get('SELECT quantidade FROM produtos WHERE id = ?', [productId]);
    assert.equal(ordersAfter.total, ordersBefore.total);
    assert.equal(product.quantidade, 1);
});

test('troco menor que o total e recusado', async () => {
    await assert.rejects(
        orderService.createOrder(client.id, [{ produto_id: productId, quantidade: 1 }], {
            forma_pagamento: 'dinheiro',
            precisa_troco: true,
            troco_para: 10
        }),
        /valor para troco/
    );
});

test('compra com dois produtores cria pedidos separados', async () => {
    const firstProduct = await productService.createProduct({
        nome: 'Produto PIX', preco: 12, quantidade: 2
    }, producer.id, '/uploads/pix.png');
    const secondProduct = await productService.createProduct({
        nome: 'Produto Dinheiro', preco: 8, quantidade: 2
    }, secondProducer.id, '/uploads/dinheiro.png');

    const purchase = await orderService.createPurchase(client.id, [
        { produto_id: firstProduct, quantidade: 1 },
        { produto_id: secondProduct, quantidade: 1 }
    ], [
        { produtor_id: producer.id, forma_pagamento: 'pix' },
        { produtor_id: secondProducer.id, forma_pagamento: 'dinheiro', precisa_troco: true, troco_para: 20 }
    ]);

    assert.equal(purchase.pedidos.length, 2);
    const orders = await database.all(
        'SELECT compra_id, produtor_id, forma_pagamento, troco_para FROM pedidos WHERE compra_id = ? ORDER BY produtor_id',
        [purchase.compraId]
    );
    assert.equal(orders.length, 2);
    assert.ok(orders.every((order) => order.compra_id === purchase.compraId));
    assert.deepEqual(orders.map((order) => order.forma_pagamento).sort(), ['dinheiro', 'pix']);
    assert.equal(orders.find((order) => order.forma_pagamento === 'dinheiro').troco_para, 20);
});
}
