const { createApp } = require('./src/app');
const { config } = require('./src/config');
const { initializeDatabase } = require('./src/database');

async function start() {
    await initializeDatabase();
    const app = createApp();

    app.listen(config.port, () => {
        console.log(`Servidor rodando em http://localhost:${config.port}`);
    });
}

start().catch((error) => {
    console.error('Falha ao iniciar a aplicacao:', error);
    process.exit(1);
});
