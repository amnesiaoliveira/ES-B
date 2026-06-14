# OrganoLife

Aplicacao web para conectar produtores rurais e consumidores.

## Executar

```bash
npm install
npm run migrate:postgres
npm start
```

Acesse `http://localhost:3001`.

Antes de iniciar, configure a conexao PostgreSQL. No PowerShell:

```powershell
$env:DATABASE_URL="postgresql://usuario:senha@host:5432/organolife?sslmode=require"
```

Use a URL fornecida pelo Neon, Supabase, Railway ou outro provedor PostgreSQL.

Para manter imagens de produtos e comprovantes em hospedagens com disco temporario,
configure tambem `CLOUDINARY_URL`. Sem essa variavel, os arquivos continuam sendo
salvos em `public/uploads`, o que e adequado apenas para desenvolvimento local.

## Estrutura

- `server.js`: inicializacao do servidor.
- `src/database`: conexao, schema e transacoes PostgreSQL.
- `src/routes`: contratos HTTP da API.
- `src/services`: regras de negocio.
- `src/middlewares`: autenticacao, upload e erros.
- `public`: paginas e JavaScript do navegador.
- `test`: testes automatizados.

`DATABASE_URL` e obrigatoria para executar a aplicacao. A porta pode ser alterada
com `PORT`.

## Migrar os dados do SQLite

O comando abaixo cria as tabelas no PostgreSQL e copia os dados existentes de
`organolife.db`:

```bash
npm run migrate:postgres
```

O banco PostgreSQL de destino deve estar vazio. Para ler outro arquivo SQLite,
configure tambem `DATABASE_PATH` antes de executar o comando. Depois da migracao,
o backend passa a ler e gravar somente no PostgreSQL.

## Fluxo de pagamento

1. O produtor configura PIX, dinheiro ou ambos na aba `Pagamentos`.
2. O carrinho pode conter produtos de vários produtores.
3. Ao finalizar, o sistema cria uma compra geral e um pedido separado por produtor.
4. O cliente escolhe pagamento, comprovante PIX e troco individualmente para cada produtor.
5. Cada produtor visualiza e aceita somente sua parte. O cliente acompanha os pedidos separados pelo mesmo histórico.

## Recursos da plataforma

- Produtos em alta calculados por vendas e avaliações.
- Favoritos persistentes para clientes.
- Chat persistente entre clientes e produtores, atualizado automaticamente.
- Receitas da comunidade ligadas aos produtos do catálogo.
- Atualizações recentes dos pedidos na área do cliente.
- Endereço solicitado apenas no checkout e salvo junto à compra.
- Painel do produtor com faturamento, vendas e alertas de estoque baixo.

## Testes

```bash
npm test
```

Os testes de integracao precisam de um PostgreSQL de teste configurado em
`TEST_DATABASE_URL`. Esse banco e limpo automaticamente ao iniciar os testes.
