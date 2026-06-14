const express = require('express');
const productService = require('../services/product-service');
const { authenticate, requireProfile } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const { asyncHandler } = require('../utils/async-handler');

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
    res.json(await productService.listProducts());
}));

router.post('/', authenticate, requireProfile('produtor'), upload.single('imagem'), asyncHandler(async (req, res) => {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : 'https://via.placeholder.com/150';
    const id = await productService.createProduct(req.body, req.user.id, imagePath);
    res.status(201).json({ success: true, id, message: 'Produto cadastrado.' });
}));

router.put('/:id', authenticate, requireProfile('produtor'), upload.single('imagem'), asyncHandler(async (req, res) => {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    await productService.updateProduct(Number(req.params.id), req.user.id, req.body, imagePath);
    res.json({ success: true, message: 'Produto atualizado.' });
}));

router.delete('/:id', authenticate, requireProfile('produtor'), asyncHandler(async (req, res) => {
    await productService.deleteProduct(Number(req.params.id), req.user.id);
    res.json({ success: true, message: 'Produto excluido.' });
}));

module.exports = router;
