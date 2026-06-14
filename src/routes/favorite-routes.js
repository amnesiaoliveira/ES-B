const express = require('express');
const favoriteService = require('../services/favorite-service');
const { authenticate, requireProfile } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();
router.use('/favoritos', authenticate, requireProfile('cliente'));

router.get('/favoritos', asyncHandler(async (req, res) => {
    res.json(await favoriteService.listFavorites(req.user.id));
}));
router.post('/favoritos/:produtoId', asyncHandler(async (req, res) => {
    const favorite = await favoriteService.addFavorite(req.user.id, Number(req.params.produtoId));
    res.status(201).json({ success: true, ...favorite });
}));
router.delete('/favoritos/:produtoId', asyncHandler(async (req, res) => {
    const favorite = await favoriteService.removeFavorite(req.user.id, Number(req.params.produtoId));
    res.json({ success: true, ...favorite });
}));

module.exports = router;
