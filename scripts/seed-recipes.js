const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000
});

const recipes = [
    {
        title: 'Salada fresca de tomate e grao-de-bico',
        description: 'Uma refeicao leve, rica em fibras e proteina vegetal.',
        ingredients: '2 tomates maduros\n1 xicara de grao-de-bico cozido\n1/2 pepino\nFolhas verdes\nSuco de 1 limao\n1 colher de azeite\nSal e ervas a gosto',
        preparation: 'Corte os tomates e o pepino em cubos. Misture com o grao-de-bico e as folhas. Tempere com limao, azeite, sal e ervas.',
        product: 'tomate'
    },
    {
        title: 'Batata rustica assada com ervas',
        description: 'Alternativa saudavel e crocante a batata frita.',
        ingredients: '4 batatas medias\n1 colher de azeite\nAlecrim\nPaprica\nAlho\nSal moderado',
        preparation: 'Corte as batatas com casca em gomos. Misture com azeite e temperos. Asse a 200 graus por 35 a 45 minutos.',
        product: 'batata'
    },
    {
        title: 'Sopa nutritiva de tomate e lentilha',
        description: 'Sopa reconfortante com proteinas, fibras e poucas gorduras.',
        ingredients: '4 tomates\n1 xicara de lentilha cozida\n1 cenoura\n1 cebola\n2 dentes de alho\nCaldo caseiro\nCheiro-verde',
        preparation: 'Refogue cebola e alho. Acrescente tomate e cenoura. Cozinhe ate amaciar, bata parte da sopa e junte a lentilha.',
        product: 'tomate'
    },
    {
        title: 'Escondidinho leve de batata com legumes',
        description: 'Versao vegetariana e equilibrada para o almoco.',
        ingredients: '5 batatas\n1 cenoura\n1 abobrinha\n1 xicara de ervilhas\n1 cebola\nLeite ou bebida vegetal',
        preparation: 'Cozinhe e amasse as batatas. Refogue os legumes. Monte uma camada de legumes, cubra com o pure e leve ao forno.',
        product: 'batata'
    },
    {
        title: 'Tomate recheado com quinoa',
        description: 'Prato colorido, leve e rico em nutrientes.',
        ingredients: '4 tomates grandes\n1 xicara de quinoa cozida\nMilho\nCenoura ralada\nCebolinha\nAzeite e limao',
        preparation: 'Retire a polpa dos tomates. Misture a quinoa com os vegetais, recheie os tomates e asse por 15 minutos.',
        product: 'tomate'
    },
    {
        title: 'Bowl saudavel de batata e folhas',
        description: 'Bowl completo para uma refeicao pratica e saciante.',
        ingredients: '2 batatas\nFolhas verdes\n1 ovo cozido ou tofu\nCenoura ralada\nSementes\nLimao e azeite',
        preparation: 'Asse as batatas em cubos. Distribua todos os ingredientes em uma tigela e finalize com limao e azeite.',
        product: 'batata'
    },
    {
        title: 'Molho de tomate caseiro sem acucar',
        description: 'Molho natural para substituir versoes industrializadas.',
        ingredients: '6 tomates maduros\n1 cebola\n2 dentes de alho\nManjericao\n1 cenoura pequena\nSal moderado',
        preparation: 'Refogue cebola e alho. Adicione tomate e cenoura. Cozinhe por 30 minutos, bata e finalize com manjericao.',
        product: 'tomate'
    },
    {
        title: 'Omelete de legumes com tomate',
        description: 'Opcao rapida e proteica para cafe da manha ou jantar.',
        ingredients: '2 ovos\n1 tomate\nCebola picada\nEspinafre ou couve\nErvas\nSal moderado',
        preparation: 'Bata os ovos e misture os vegetais. Despeje em frigideira antiaderente e cozinhe em fogo baixo.',
        product: 'tomate'
    }
];

async function seed() {
    if (!process.env.DATABASE_URL) throw new Error('Defina DATABASE_URL antes de executar.');
    const client = await pool.connect();
    try {
        await client.query("SET statement_timeout = '15s'");
        await client.query('BEGIN');
        const user = await client.query(
            "SELECT id FROM usuarios WHERE tipo_perfil = 'cliente' ORDER BY id LIMIT 1"
        );
        if (!user.rows[0]) throw new Error('Nenhum cliente encontrado.');

        let created = 0;
        for (const recipe of recipes) {
            const inserted = await client.query(
                `INSERT INTO receitas (cliente_id, titulo, descricao, ingredientes, modo_preparo)
                 SELECT $1, $2, $3, $4, $5
                 WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE titulo = $2)
                 RETURNING id`,
                [user.rows[0].id, recipe.title, recipe.description, recipe.ingredients, recipe.preparation]
            );
            const recipeRow = inserted.rows[0] || (await client.query(
                'SELECT id FROM receitas WHERE titulo = $1', [recipe.title]
            )).rows[0];
            if (inserted.rows[0]) created++;

            const product = await client.query(
                'SELECT id FROM produtos WHERE LOWER(nome) = LOWER($1) ORDER BY id LIMIT 1',
                [recipe.product]
            );
            if (product.rows[0]) {
                await client.query(
                    `INSERT INTO receita_produtos (receita_id, produto_id) VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [recipeRow.id, product.rows[0].id]
                );
            }
        }
        await client.query('COMMIT');
        const total = await client.query('SELECT COUNT(*)::int AS total FROM receitas');
        console.log(`Receitas criadas: ${created}. Total no mural: ${total.rows[0].total}.`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch((error) => {
    console.error('Falha ao criar receitas:', error.message);
    process.exitCode = 1;
});
