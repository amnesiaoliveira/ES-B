const express = require('express');
const reviewService = require('../services/review-service');
const { authenticate, requireProfile, requireOwnId } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.post('/avaliacoes', authenticate, requireProfile('cliente'), asyncHandler(async (req, res) => {
    const id = await reviewService.createReview(req.user.id, req.body);
    res.status(201).json({ success: true, id });
}));

router.get('/produtor/:id/avaliacoes', authenticate, requireProfile('produtor'), requireOwnId, asyncHandler(async (req, res) => {
    res.json(await reviewService.listProducerReviews(req.user.id));
}));

module.exports = router;
