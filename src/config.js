const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const config = {
    port: Number(process.env.PORT) || 3001,
    rootDir,
    databaseUrl: process.env.DATABASE_URL,
    databasePath: process.env.DATABASE_PATH || path.join(rootDir, 'organolife.db'),
    publicDir: path.join(rootDir, 'public'),
    uploadDir: path.join(rootDir, 'public', 'uploads'),
    sessionDays: 7
};

module.exports = { config };
