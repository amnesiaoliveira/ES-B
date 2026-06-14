const multer = require('multer');

function notFound(_req, res) {
    res.status(404).json({ success: false, message: 'Rota nao encontrada.' });
}

function errorHandler(error, _req, res, _next) {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: 'Arquivo invalido ou maior que 5 MB.' });
    }

    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({
        success: false,
        message: status >= 500 ? 'Erro interno do servidor.' : error.message
    });
}

module.exports = { notFound, errorHandler };
