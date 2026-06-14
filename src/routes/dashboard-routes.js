const express = require('express');
const dashboardService = require('../services/dashboard-service');
const { authenticate, requireProfile } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();
router.get('/produtor/dashboard', authenticate, requireProfile('produtor'), asyncHandler(async (req, res) => {
    res.json(await dashboardService.producerDashboard(req.user.id));
}));
router.get('/cliente/notificacoes', authenticate, requireProfile('cliente'), asyncHandler(async (req, res) => {
    res.json(await dashboardService.clientNotifications(req.user.id));
}));
module.exports = router;
