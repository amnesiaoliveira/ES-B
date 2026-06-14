const express = require('express');
const orderService = require('../services/order-service');
const { authenticate, requireProfile, requireOwnId } = require('../middlewares/auth');
const { receiptUpload, getUploadedFileUrl } = require('../middlewares/upload');
const { asyncHandler } = require('../utils/async-handler');
const { HttpError } = require('../utils/http-error');

const router = express.Router();

router.post('/pedidos', authenticate, requireProfile('cliente'), asyncHandler(async (req, res) => {
    const pedidoId = await orderService.createOrder(req.user.id, req.body.itens, req.body);
    res.status(201).json({ success: true, pedidoId });
}));

router.post('/compras', authenticate, requireProfile('cliente'), asyncHandler(async (req, res) => {
    const result = await orderService.createPurchase(req.user.id, req.body.itens, req.body.pagamentos);
    res.status(201).json({ success: true, ...result });
}));

router.get('/consumidor/:id/pedidos', authenticate, requireProfile('cliente'), requireOwnId, asyncHandler(async (req, res) => {
    res.json(await orderService.listClientOrders(req.user.id));
}));

router.get('/produtor/:id/pedidos', authenticate, requireProfile('produtor'), requireOwnId, asyncHandler(async (req, res) => {
    res.json(await orderService.listProducerOrders(req.user.id));
}));

router.post('/pedidos/:id/comprovante', authenticate, requireProfile('cliente'), receiptUpload.single('comprovante'), asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Selecione o arquivo do comprovante.');
    const receiptUrl = await getUploadedFileUrl(req.file, 'organolife/comprovantes', 'auto');
    await orderService.attachReceipt(req.user.id, req.params.id, receiptUrl);
    res.json({ success: true, message: 'Comprovante enviado.' });
}));

router.patch('/produtor/pedidos/:id/aceitar', authenticate, requireProfile('produtor'), asyncHandler(async (req, res) => {
    await orderService.acceptOrder(req.user.id, req.params.id);
    res.json({ success: true, message: 'Pedido aceito.' });
}));

module.exports = router;
