const express = require('express');
const recipeService = require('../services/recipe-service');
const { authenticate, requireProfile } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.get('/receitas', asyncHandler(async (_req, res) => {
    res.json(await recipeService.listRecipes());
}));

router.post('/receitas', authenticate, requireProfile('cliente'), asyncHandler(async (req, res) => {
    const id = await recipeService.createRecipe(req.user.id, req.body);
    res.status(201).json({ success: true, id, message: 'Receita compartilhada.' });
}));

module.exports = router;
