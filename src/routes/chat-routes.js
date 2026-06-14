const express = require('express');
const chatService = require('../services/chat-service');
const { authenticate, requireProfile } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();
router.use('/chats', authenticate);

router.post('/chats', requireProfile('cliente'), asyncHandler(async (req, res) => {
    const id = await chatService.startConversation(req.user.id, Number(req.body.produtor_id));
    res.status(201).json({ success: true, id });
}));
router.get('/chats', asyncHandler(async (req, res) => res.json(await chatService.listConversations(req.user))));
router.get('/chats/:id/mensagens', asyncHandler(async (req, res) => {
    res.json(await chatService.listMessages(Number(req.params.id), req.user.id));
}));
router.post('/chats/:id/mensagens', asyncHandler(async (req, res) => {
    const id = await chatService.sendMessage(Number(req.params.id), req.user.id, req.body.texto);
    res.status(201).json({ success: true, id });
}));

module.exports = router;
