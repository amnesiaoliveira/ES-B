const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { config } = require('../config');

let cloudinary = null;
if (process.env.CLOUDINARY_URL) {
    ({ v2: cloudinary } = require('cloudinary'));
}

fs.mkdirSync(config.uploadDir, { recursive: true });

const diskStorage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, config.uploadDir),
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        callback(null, uniqueName);
    }
});

const storage = cloudinary ? multer.memoryStorage() : diskStorage;

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        callback(null, allowed.includes(file.mimetype));
    }
});

const receiptUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowed.includes(file.mimetype)) {
            const error = new Error('Envie um comprovante em JPG, PNG, WEBP ou PDF.');
            error.status = 400;
            return callback(error);
        }
        callback(null, true);
    }
});

function uploadBuffer(file, folder, resourceType) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => error ? reject(error) : resolve(result.secure_url)
        );
        stream.end(file.buffer);
    });
}

async function getUploadedFileUrl(file, folder, resourceType = 'image') {
    if (!file) return null;
    if (cloudinary) return uploadBuffer(file, folder, resourceType);
    return `/uploads/${file.filename}`;
}

module.exports = { upload, receiptUpload, getUploadedFileUrl };
