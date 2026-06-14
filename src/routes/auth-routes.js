const express = require('express');
const authService = require('../services/auth-service');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
    const id = await authService.register(req.body);
    res.status(201).json({ success: true, id });
}));

router.post('/login', asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.senha);
    res.json({ success: true, ...result });
}));

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    await authService.logout(req.token);
    res.json({ success: true });
}));

router.get('/me/endereco', authenticate, asyncHandler(async (req, res) => {
    res.json(await authService.getAddress(req.user.id));
}));

router.put('/me/endereco', authenticate, asyncHandler(async (req, res) => {
    const address = await authService.updateAddress(req.user.id, req.body);
    res.json({ success: true, address });
}));

module.exports = router;
