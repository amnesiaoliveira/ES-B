const sqlite3 = require('sqlite3').verbose();
const { config } = require('../src/config');
const database = require('../src/database');

function openSqlite(filename) {
    return new sqlite3.Database(filename, sqlite3.OPEN_READONLY);
}

function sqliteAll(db, sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => error ? reject(error) : resolve(rows));
    });
}

function closeSqlite(db) {
    return new Promise((resolve, reject) => {
        db.close((error) => error ? reject(error) : resolve());
    });
}

const tables = [
    { name: 'usuarios', columns: ['id', 'nome', 'email', 'telefone', 'senha', 'tipo_perfil'], identity: true },
    { name: 'produtos', columns: ['id', 'nome', 'descricao', 'preco', 'quantidade', 'imagem', 'produtor_id'], identity: true },
    { name: 'compras', columns: ['id', 'cliente_id', 'data_compra'], identity: true },
    {
        name: 'pedidos',
        columns: ['id', 'compra_id', 'cliente_id', 'produtor_id', 'data_pedido', 'status',
            'forma_pagamento', 'troco_para', 'chave_pix', 'comprovante'],
        identity: true
    },
    {
        name: 'itens_pedido',
        columns: ['id', 'pedido_id', 'produto_id', 'quantidade', 'preco_unitario'],
        identity: true
    },
    {
        name: 'avaliacoes',
        columns: ['id', 'produto_id', 'cliente_id', 'nota', 'comentario', 'data_avaliacao'],
        identity: true
    },
    { name: 'sessoes', columns: ['token', 'usuario_id', 'expira_em', 'criado_em'] },
    {
        name: 'pagamentos_produtor',
        columns: ['produtor_id', 'aceita_pix', 'chave_pix', 'aceita_dinheiro', 'atualizado_em']
    }
];

async function migrate() {
    if (!config.databaseUrl) throw new Error('Defina DATABASE_URL antes de executar a migracao.');

    const sqlite = openSqlite(config.databasePath);
    try {
        await database.initializeDatabase();
        const existing = await database.get('SELECT COUNT(*) AS total FROM usuarios');
        if (existing.total > 0) {
            throw new Error('O PostgreSQL de destino ja possui usuarios. Use um banco vazio para evitar duplicacoes.');
        }

        const sourceData = [];
        for (const table of tables) {
            const rows = await sqliteAll(sqlite, `SELECT ${table.columns.join(', ')} FROM ${table.name}`);
            sourceData.push({ ...table, rows });
        }

        await database.executeTransaction(async (tx) => {
            for (const table of sourceData) {
                const placeholders = table.columns.map(() => '?').join(', ');
                const sql = `INSERT INTO ${table.name} (${table.columns.join(', ')}) VALUES (${placeholders})`;
                for (const row of table.rows) {
                    await tx.run(sql, table.columns.map((column) => row[column]));
                }
            }

            for (const table of sourceData.filter((item) => item.identity)) {
                await tx.run(
                    `SELECT setval(
                        pg_get_serial_sequence('${table.name}', 'id'),
                        COALESCE((SELECT MAX(id) FROM ${table.name}), 1),
                        EXISTS (SELECT 1 FROM ${table.name})
                    )`
                );
            }
        });

        const total = sourceData.reduce((sum, table) => sum + table.rows.length, 0);
        console.log(`Migracao concluida: ${total} registros copiados para o PostgreSQL.`);
    } finally {
        await closeSqlite(sqlite);
        await database.close();
    }
}

migrate().catch((error) => {
    console.error('Falha na migracao:', error.message);
    process.exitCode = 1;
});
