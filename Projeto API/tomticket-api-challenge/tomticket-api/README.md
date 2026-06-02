# API Challenge — TomTicket Integration

> Integração completa com a API TomTicket v2.0 para **gestão de clientes** e **gestão de chamados**.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Autenticação](#autenticação)
5. [API 1 — Clientes](#api-1--clientes)
6. [API 2 — Chamados](#api-2--chamados)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Rate Limit](#rate-limit)
9. [Validação dos Endpoints](#validação-dos-endpoints)
10. [Exemplos cURL](#exemplos-curl)

---

## Visão Geral

| Item | Detalhe |
|------|---------|
| Versão da API TomTicket | v2.0 |
| Base URL TomTicket | `https://api.tomticket.com/v2.0` |
| Autenticação | Bearer Token |
| Formato de entrada (TomTicket) | `form-data` |
| Formato de saída | JSON |
| Rate Limit TomTicket | 3 requisições/segundo |
| Porta padrão local | `3000` |

---

## Estrutura do Projeto

```
tomticket-api/
├── src/
│   ├── api1-clientes/
│   │   └── clientesRoutes.js     # Todos os endpoints de Clientes
│   ├── api2-chamados/
│   │   └── chamadosRoutes.js     # Todos os endpoints de Chamados
│   ├── middleware/
│   │   └── errorHandler.js       # Validação e erros centralizados
│   ├── utils/
│   │   └── tomticketClient.js    # Cliente HTTP (axios + Bearer Token)
│   └── server.js                 # Entrypoint Express
├── tests/
│   └── run-tests.js              # Suite de testes funcionais
├── .env.example                  # Modelo de variáveis de ambiente
├── package.json
└── README.md
```

---

## Instalação e Configuração

### Pré-requisitos

- Node.js >= 18
- npm >= 9
- Token de acesso gerado no painel TomTicket

### Passos

```bash
# 1. Clone ou descompacte o projeto
cd tomticket-api

# 2. Instale as dependências
npm install

# 3. Configure o token
cp .env.example .env
# Edite o arquivo .env e preencha TOMTICKET_TOKEN=<seu_token>

# 4. Inicie o servidor
npm start

# Desenvolvimento (hot-reload)
npm run dev
```

O servidor inicia em `http://localhost:3000`.

---

## Autenticação

O token de acesso é gerado no painel do TomTicket em:
**Configurações → API → Token de Acesso**

Ele é enviado automaticamente em todas as requisições para a API TomTicket via header:

```
Authorization: Bearer {SEU-TOKEN-AQUI}
```

Configure-o no arquivo `.env`:

```env
TOMTICKET_TOKEN=seu_token_aqui
```

---

## API 1 — Clientes

Base path: `/api/clientes`

---

### 1.1 Listar Clientes

```
GET /api/clientes
```

**Query Params (opcionais)**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | inteiro ≥ 1 | Página dos resultados (50 itens/página) |
| `search` | string | Busca por nome ou e-mail |

**Resposta de Sucesso (200)**

```json
{
  "success": true,
  "data": {
    "error": false,
    "customers": [
      {
        "id": "CLI001",
        "name": "João Silva",
        "email": "joao@empresa.com",
        "active": true
      }
    ],
    "total": 120,
    "page": 1
  }
}
```

---

### 1.2 Consultar Cliente (individual)

```
GET /api/clientes/:id
```

**Path Params**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | Identificador interno do cliente |

**Resposta de Sucesso (200)**

```json
{
  "success": true,
  "data": {
    "error": false,
    "customer": {
      "id": "CLI001",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "phone": "11999990000",
      "active": true,
      "created_at": "2024-01-15"
    }
  }
}
```

---

### 1.3 Verificar Existência de Cliente

```
GET /api/clientes/existe?email=joao@empresa.com
GET /api/clientes/existe?customer_id=CLI001
```

**Query Params (ao menos um obrigatório)**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `email` | string (email válido) | E-mail do cliente |
| `customer_id` | string | Identificador interno |

---

### 1.4 Criar Cliente

```
POST /api/clientes
Content-Type: application/json
```

**Body**

| Campo | Tipo | Obrigatório | Máximo | Descrição |
|-------|------|-------------|--------|-----------|
| `customer_id` | string | ✅ | 250 | Identificador único (CPF, CNPJ, ID) |
| `name` | string | ✅ | 250 | Nome completo |
| `email` | string (email) | ✅ | 250 | E-mail |
| `phone` | string | ❌ | 30 | Telefone |
| `organization_id` | string | ❌ | — | ID da organização vinculada |

**Resposta de Sucesso (201)**

```json
{
  "success": true,
  "message": "Cliente criado com sucesso.",
  "data": {
    "error": false,
    "customer_id": "CLI_NOVO_001"
  }
}
```

---

### 1.5 Atualizar Cliente

```
POST /api/clientes/:id/atualizar
Content-Type: application/json
```

**Body (todos opcionais — ao menos um recomendado)**

| Campo | Tipo | Máximo |
|-------|------|--------|
| `name` | string | 250 |
| `email` | string (email) | 250 |
| `phone` | string | 30 |
| `organization_id` | string | — |

---

### 1.6 Ativar / Desativar Cliente

```
POST /api/clientes/:id/status
Content-Type: application/json
```

**Body**

| Campo | Tipo | Obrigatório | Valores |
|-------|------|-------------|---------|
| `active` | inteiro | ✅ | `1` (ativar) / `0` (desativar) |

---

## API 2 — Chamados

Base path: `/api/chamados`

---

### 2.1 Listar Chamados

```
GET /api/chamados
```

**Query Params (todos opcionais)**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | inteiro ≥ 1 | Página (50 itens/página) |
| `department_id` | string | Filtrar por departamento |
| `status` | string | Filtrar por status |
| `customer_id` | string | Filtrar por cliente |
| `search` | string | Busca textual |
| `date_start` | string | Data início (YYYY-MM-DD) |
| `date_end` | string | Data fim (YYYY-MM-DD) |

---

### 2.2 Consultar Chamado (individual)

```
GET /api/chamados/:id
```

**Path Params**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | Identificador do chamado |

---

### 2.3 Criar Chamado

```
POST /api/chamados
Content-Type: application/json
```

**Body**

| Campo | Tipo | Obrigatório | Máximo | Descrição |
|-------|------|-------------|--------|-----------|
| `customer_id` | string | ✅ | 250 | Identificador do cliente |
| `customer_id_type` | string | ❌ | 1 | `I` = interno (padrão), `E` = email |
| `department_id` | string | ✅ | 250 | Identificador do departamento |
| `subject` | string | ✅ | 250 | Título/assunto |
| `message` | string | ✅ | — | Mensagem de abertura (text/plain) |
| `category_id` | string | ❌ | — | Categoria do chamado |
| `operator_id` | string | ❌ | — | Atendente responsável |

**Resposta de Sucesso (201)**

```json
{
  "success": true,
  "message": "Chamado criado com sucesso.",
  "data": {
    "error": false,
    "ticket_id": "TKT-2024-0001"
  }
}
```

---

### 2.4 Comentar Chamado

```
POST /api/chamados/:id/comentar
Content-Type: application/json
```

**Body**

| Campo | Tipo | Obrigatório | Máximo |
|-------|------|-------------|--------|
| `comment` | string | ✅ | 512 |

---

### 2.5 Responder Chamado (como Atendente)

```
POST /api/chamados/:id/responder
Content-Type: application/json
```

**Body**

| Campo | Tipo | Obrigatório | Máximo |
|-------|------|-------------|--------|
| `message` | string | ✅ | 512 |

> ⚠️ Só funciona se houver um atendente vinculado ao chamado.

---

### 2.6 Finalizar Chamado

```
POST /api/chamados/:id/finalizar
Content-Type: application/json
```

**Body**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `message` | string | ✅ | Mensagem de encerramento |

---

### 2.7 Transferir Chamado

```
POST /api/chamados/:id/transferir
Content-Type: application/json
```

**Body (ao menos um obrigatório)**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `department_id` | string | Novo departamento |
| `operator_id` | string | Novo atendente |

---

## Tratamento de Erros

Todas as respostas de erro seguem o mesmo formato:

```json
{
  "success": false,
  "message": "Descrição do erro.",
  "errors": [
    { "campo": "email", "mensagem": "email inválido" }
  ]
}
```

| Código HTTP | Situação |
|-------------|----------|
| `400` | Parâmetros inválidos ou ausentes (validação local) |
| `429` | Rate limit local atingido (3 req/s) |
| `500` | Erro interno / token não configurado |
| `502` | Erro retornado pela API TomTicket |

---

## Rate Limit

A API TomTicket permite **3 requisições por segundo**. O servidor aplica automaticamente esse limite via middleware `express-rate-limit`. Ao ultrapassar, a resposta será:

```json
{
  "success": false,
  "message": "Muitas requisições. Aguarde um instante e tente novamente."
}
```

---

## Validação dos Endpoints

Execute a suite de testes funcionais com o servidor ativo:

```bash
# Terminal 1 — servidor
npm start

# Terminal 2 — testes
npm test
```

Os testes cobrem:

- ✅ Health check
- ✅ Listagem de clientes com paginação
- ✅ Validação de parâmetros inválidos (page, email, campos obrigatórios)
- ✅ Verificação de existência de cliente
- ✅ Criação de cliente (payload completo)
- ✅ Listagem de chamados com filtros
- ✅ Validação de criação de chamado (campos obrigatórios, customer_id_type)
- ✅ Validação de comentário e transferência

---

## Exemplos cURL

### Listar clientes
```bash
curl -X GET "http://localhost:3000/api/clientes?page=1" \
  -H "Content-Type: application/json"
```

### Criar cliente
```bash
curl -X POST "http://localhost:3000/api/clientes" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CLI_001",
    "name": "Maria Souza",
    "email": "maria@empresa.com",
    "phone": "11988887777"
  }'
```

### Verificar existência
```bash
curl "http://localhost:3000/api/clientes/existe?email=maria@empresa.com"
```

### Listar chamados com filtros
```bash
curl "http://localhost:3000/api/chamados?page=1&department_id=DEPT01&status=aberto"
```

### Criar chamado
```bash
curl -X POST "http://localhost:3000/api/chamados" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CLI_001",
    "customer_id_type": "I",
    "department_id": "DEPT01",
    "subject": "Problema no sistema de login",
    "message": "Não consigo acessar o sistema desde ontem.",
    "category_id": "CAT01"
  }'
```

### Comentar chamado
```bash
curl -X POST "http://localhost:3000/api/chamados/TKT-001/comentar" \
  -H "Content-Type: application/json" \
  -d '{ "comment": "Verificando o problema relatado." }'
```

### Finalizar chamado
```bash
curl -X POST "http://localhost:3000/api/chamados/TKT-001/finalizar" \
  -H "Content-Type: application/json" \
  -d '{ "message": "Problema resolvido após atualização do sistema." }'
```

---

## Health Check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-05-29T10:00:00.000Z",
  "token_configurado": true
}
```
