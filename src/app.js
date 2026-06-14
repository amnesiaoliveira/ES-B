const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const authRoutes = require('./routes/auth-routes');
const productRoutes = require('./routes/product-routes');
const orderRoutes = require('./routes/order-routes');
const reviewRoutes = require('./routes/review-routes');
const paymentRoutes = require('./routes/payment-routes');
const recipeRoutes = require('./routes/recipe-routes');
const favoriteRoutes = require('./routes/favorite-routes');
const dashboardRoutes = require('./routes/dashboard-routes');
const chatRoutes = require('./routes/chat-routes');
const { notFound, errorHandler } = require('./middlewares/errors');

function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use(express.static(config.publicDir, {
        setHeaders: (res) => res.setHeader('Cache-Control', 'no-store')
    }));

    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
    app.use('/api', authRoutes);
    app.use('/api/produtos', productRoutes);
    app.use('/api', orderRoutes);
    app.use('/api', reviewRoutes);
    app.use('/api', paymentRoutes);
    app.use('/api', recipeRoutes);
    app.use('/api', favoriteRoutes);
    app.use('/api', dashboardRoutes);
    app.use('/api', chatRoutes);

    app.use('/api', notFound);
    app.use(errorHandler);
    return app;
}

module.exports = { createApp };
