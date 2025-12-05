const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// --- 1. CONFIGURAÇÃO DE UPLOAD ---
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 2. MIDDLEWARES ---
app.use(cors());
app.use(express.json()); // CRUCIAL para ler o JSON do pedido
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- 3. BANCO DE DADOS ---
const db = new sqlite3.Database('./organolife.db', (err) => {
    if (err) console.error('Erro ao abrir banco:', err.message);
    else console.log('Banco de dados conectado.');
});

db.serialize(() => {
    // Tabelas Base
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT, email TEXT UNIQUE, telefone TEXT, senha TEXT, tipo_perfil TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT, descricao TEXT, preco REAL, quantidade INTEGER, imagem TEXT, produtor_id INTEGER,
        FOREIGN KEY(produtor_id) REFERENCES usuarios(id)
    )`);

    // Tabela Pedidos
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Pendente',
        FOREIGN KEY(cliente_id) REFERENCES usuarios(id)
    )`);

    // Tabela Itens do Pedido
    db.run(`CREATE TABLE IF NOT EXISTS itens_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER,
        produto_id INTEGER,
        quantidade INTEGER,
        preco_unitario REAL,
        FOREIGN KEY(pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )`);

    // Tabela Avaliações
    db.run(`CREATE TABLE IF NOT EXISTS avaliacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER,
        cliente_id INTEGER,
        nota INTEGER,
        comentario TEXT,
        data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(produto_id) REFERENCES produtos(id),
        FOREIGN KEY(cliente_id) REFERENCES usuarios(id)
    )`);
});

// --- 4. ROTAS GERAIS (Login, Cadastro, Produtos) ---
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    db.get('SELECT * FROM usuarios WHERE email = ? AND senha = ?', [email, senha], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json({ success: true, user: { id: row.id, nome: row.nome, perfil: row.tipo_perfil } });
        else res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    });
});

app.post('/api/register', (req, res) => {
    const { nome, email, telefone, senha, tipo_perfil } = req.body;
    db.run('INSERT INTO usuarios (nome, email, telefone, senha, tipo_perfil) VALUES (?,?,?,?,?)', 
        [nome, email, telefone, senha, tipo_perfil], 
        function(err) {
            if (err) return res.json({ success: false, message: 'Erro ao cadastrar. Email já existe?' });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.post('/api/produtos', upload.single('imagem'), (req, res) => {
    const { nome, descricao, preco, quantidade, produtor_id } = req.body;
    const imagemPath = req.file ? `/uploads/${req.file.filename}` : 'https://via.placeholder.com/150';
    db.run('INSERT INTO produtos (nome, descricao, preco, quantidade, imagem, produtor_id) VALUES (?,?,?,?,?,?)',
        [nome, descricao, preco, quantidade, imagemPath, produtor_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Produto cadastrado!' });
        }
    );
});

app.get('/api/produtos', (req, res) => {
    db.all('SELECT * FROM produtos ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- 5. ROTAS DO PRODUTOR ---
app.get('/api/produtor/:id/pedidos', (req, res) => {
    const sql = `
        SELECT p.id as pedido_id, p.data_pedido, p.status, u.nome as cliente_nome, 
               pr.nome as produto_nome, ip.quantidade, ip.preco_unitario
        FROM itens_pedido ip
        JOIN pedidos p ON ip.pedido_id = p.id
        JOIN produtos pr ON ip.produto_id = pr.id
        JOIN usuarios u ON p.cliente_id = u.id
        WHERE pr.produtor_id = ?
        ORDER BY p.data_pedido DESC
    `;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/produtor/:id/avaliacoes', (req, res) => {
    const sql = `
        SELECT a.nota, a.comentario, a.data_avaliacao, u.nome as cliente_nome, pr.nome as produto_nome, pr.imagem as produto_imagem
        FROM avaliacoes a
        JOIN produtos pr ON a.produto_id = pr.id
        JOIN usuarios u ON a.cliente_id = u.id
        WHERE pr.produtor_id = ?
        ORDER BY a.data_avaliacao DESC
    `;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- 6. ROTAS DO CONSUMIDOR (ESSAS ESTAVAM FALTANDO!) ---

// CRIAR PEDIDO (Finalizar Compra)
app.post('/api/pedidos', (req, res) => {
    const { cliente_id, itens } = req.body;
    
    if (!itens || itens.length === 0) return res.status(400).json({ msg: 'Carrinho vazio' });

    db.serialize(() => {
        // 1. Cria o Pedido
        db.run("INSERT INTO pedidos (cliente_id, status) VALUES (?, 'Pendente')", [cliente_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const pedidoId = this.lastID;
            
            // 2. Insere os Itens do Pedido
            const stmt = db.prepare("INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)");
            
            itens.forEach(item => {
                stmt.run(pedidoId, item.produto_id, item.quantidade, item.preco_unitario);
                // Opcional: Baixar estoque
                db.run("UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?", [item.quantidade, item.produto_id]);
            });
            
            stmt.finalize();
            console.log(`Pedido #${pedidoId} criado com sucesso!`);
            res.json({ success: true, pedidoId });
        });
    });
});

// LISTAR MEUS PEDIDOS
app.get('/api/consumidor/:id/pedidos', (req, res) => {
    const sql = `
        SELECT p.id as pedido_id, p.data_pedido, p.status, 
               pr.id as produto_id, pr.nome as produto_nome, pr.imagem, 
               ip.quantidade, ip.preco_unitario
        FROM pedidos p
        JOIN itens_pedido ip ON p.id = ip.pedido_id
        JOIN produtos pr ON ip.produto_id = pr.id
        WHERE p.cliente_id = ?
        ORDER BY p.data_pedido DESC
    `;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// SALVAR AVALIAÇÃO
app.post('/api/avaliacoes', (req, res) => {
    const { produto_id, cliente_id, nota, comentario } = req.body;
    db.run("INSERT INTO avaliacoes (produto_id, cliente_id, nota, comentario) VALUES (?, ?, ?, ?)",
        [produto_id, cliente_id, nota, comentario],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Debug
app.post('/api/debug/seed-orders', (req, res) => {
    res.json({msg: 'Use o painel do consumidor para criar pedidos reais.'});
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});