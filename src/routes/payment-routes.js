const express = require('express');
const paymentService = require('../services/payment-service');
const { authenticate, requireProfile } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.get('/produtor/pagamento', authenticate, requireProfile('produtor'), asyncHandler(async (req, res) => {
    res.json(await paymentService.getProducerPayment(req.user.id));
}));

router.put('/produtor/pagamento', authenticate, requireProfile('produtor'), asyncHandler(async (req, res) => {
    const settings = await paymentService.updateProducerPayment(req.user.id, req.body);
    res.json({ success: true, settings });
}));

module.exports = router;
