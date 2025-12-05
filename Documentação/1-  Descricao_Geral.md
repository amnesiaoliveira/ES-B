# OrganoLife – Sistema Web

## 1. Descrição Geral do Projeto

### 1.1 Nome do Projeto
OrganoLife

### 1.2 Descrição do Produto
O OrganoLife é um sistema web desenvolvido para conectar produtores rurais, consumidores e profissionais da área de nutrição e agronomia no município de Itacoatiara. O sistema permite o cadastro e gerenciamento de produtos orgânicos, a realização de pedidos, o acompanhamento do status das compras e a disponibilização de conteúdos educativos.

A aplicação utiliza:
- Node.js com Express para o servidor;
- SQLite para armazenamento de dados (arquivo local `organolife.db`);
- HTML, CSS e JavaScript no front-end;


### 1.3 Objetivo
Fornecer um sistema web funcional e acessível que facilite o acesso a produtos orgânicos, fortaleça a economia local, valorize pequenos produtores e promova práticas agrícolas sustentáveis.

### 1.4 Motivação
A demanda crescente por produtos orgânicos e a necessidade de valorizar os pequenos produtores locais motivaram o desenvolvimento deste sistema. O projeto busca reduzir intermediários, aumentar a visibilidade dos agricultores e promover saúde e sustentabilidade.

### 1.5 Equipe de Desenvolvimento
- Ana Paula  
- Eugenio  
- Josiel  
- Wamberson  

### 1.6 Usuários Finais
- Produtores rurais: cadastram e gerenciam seus produtos.  
- Consumidores: realizam compras e acompanham pedidos.  
- Profissionais da área de nutrição e agronomia: poderão fornecer conteúdos educativos (escopo futuro).

---

## 2. Escopo do Sistema

### 2.1 Escopo Específico

### Tabela de Requisitos Funcionais

| Código | Requisito Funcional | Descrição |
|--------|----------------------|-----------|
| RF01 | Cadastro de Usuários | Permitir cadastro com nome, e-mail, telefone e senha. |
| RF02 | Diferenciação de Perfil | Identificar se o usuário é cliente ou produtor. |
| RF03 | Armazenamento de Usuários | Registrar dados no banco SQLite. |
| RF04 | Login | Permitir login com e-mail e senha. |
| RF05 | Controle de Sessão | Manter sessão ativa para usuários autenticados. |
| RF06 | Cadastro de Produtos | Permitir que produtores cadastrem nome, descrição, preço, quantidade e imagem. |
| RF07 | Upload de Imagens | Enviar imagens via multer e armazenar em `/public/uploads`. |
| RF08 | Edição de Produtos | Permitir que produtores editem produtos cadastrados. |
| RF09 | Exclusão de Produtos | Permitir que produtores excluam produtos cadastrados. |
| RF10 | Listagem de Produtos do Produtor | Exibir apenas produtos vinculados ao produtor logado. |
| RF11 | Catálogo de Produtos | Listar todos os produtos disponíveis para o cliente. |
| RF12 | Exibição de Imagens | Mostrar imagens armazenadas no servidor junto aos produtos. |
| RF13 | Comprar Produto | Direcionar o cliente para criação de pedido ao clicar em comprar. |
| RF14 | Registro de Pedido | Registrar pedido contendo cliente, produto e quantidade. |
| RF15 | Status Inicial do Pedido | Definir “Aguardando confirmação” como status inicial. |
| RF16 | Atualização de Status | Permitir que o produtor atualize o status do pedido. |
| RF17 | Acompanhamento de Pedido | Cliente pode visualizar atualizações do pedido. |
| RF18 | Notificações ao Cliente | Atualizações do pedido exibidas quando o cliente acessa a página. |
| RF19 | Notificações ao Produtor | Exibição de novos pedidos quando o produtor acessa o painel. |

---

### Tabela de Requisitos Não Funcionais

| Código | Requisito Não Funcional | Descrição |
|--------|---------------------------|-----------|
| RNF01 | Segurança | Validações no back-end e controle de uploads. |
| RNF02 | Disponibilidade | Sistema acessível conforme disponibilidade do servidor. |
| RNF03 | Usabilidade | Interface simples e intuitiva acessível via navegador. |
| RNF04 | Compatibilidade | Funcionamento em navegadores modernos. |
| RNF05 | Armazenamento | Utilização do banco SQLite em arquivo local. |

---

### Tabela de Regras de Negócio

| Código | Regra de Negócio | Descrição |
|--------|-------------------|-----------|
| RN01 | Acesso de Produtor | Apenas produtores podem cadastrar, editar e excluir produtos. |
| RN02 | Acesso de Cliente | Apenas clientes podem realizar pedidos. |
| RN03 | Atualização de Pedido | Apenas produtores podem alterar o status dos pedidos. |
| RN04 | Integridade de Produto | Produto só pode ser publicado se todos os campos estiverem completos. |
| RN05 | Imagem Válida | Imagens devem estar em formatos aceitos pelo sistema. |

---

## 2.2 Escopo Futuro

### Tabela de Requisitos Funcionais – Escopo Futuro

| Código | Requisito Funcional Futuro | Descrição |
|--------|-----------------------------|-----------|
| RF-F01 | Chat Integrado | Comunicação direta entre cliente e produtor. |
| RF-F02 | Assinaturas | Implementação de assinaturas semanais de cestas orgânicas. |
| RF-F03 | Avaliações | Sistema de avaliações com notas e comentários. |
| RF-F04 | Pagamentos Online | Integração com sistemas de pagamento digital. |
| RF-F05 | Expansão Geográfica | Disponibilização do sistema para outros municípios. |

---

### Tabela de Requisitos Não Funcionais – Escopo Futuro

| Código | Requisito Não Funcional Futuro | Descrição |
|--------|--------------------------------|-----------|
| RNF-F01 | Banco na Nuvem | Migração para banco de dados remoto. |
| RNF-F02 | Segurança Avançada | Aumento da robustez e proteção no back-end. |
| RNF-F03 | Escalabilidade | Suporte a um número maior de usuários simultâneos. |

---

### Tabela de Regras de Negócio – Escopo Futuro

| Código | Regra de Negócio Futura | Descrição |
|--------|---------------------------|-----------|
| RN-F01 | Programa de Fidelidade | Bonificação de clientes conforme frequência de compras. |
| RN-F02 | Parcerias | Integração com cooperativas e associações rurais. |
| RN-F03 | Classificação Automática | Categorização automática de produtos cadastrados. |



