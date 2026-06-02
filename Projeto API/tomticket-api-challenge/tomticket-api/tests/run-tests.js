/**
 * Suite de testes funcionais — TomTicket API Challenge
 * =====================================================
 * Executa chamadas reais para validar todos os endpoints.
 * Requer: TOMTICKET_TOKEN configurado no .env
 *         Servidor rodando em http://localhost:3000
 *
 * Uso: node tests/run-tests.js
 */

require('dotenv').config();
const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 3000}`;

let passed = 0;
let failed = 0;

// ─── Utilitários ─────────────────────────────────────────────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url     = new URL(path, BASE);

    const options = {
      hostname: url.hostname,
      port:     url.port,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function test(label, fn) {
  try {
    await fn();
    console.log(`  ✅  ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ❌  ${label}`);
    console.log(`       ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ─── Delay para respeitar rate limit (3 req/s) ───────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Testes ──────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  TomTicket API — Suite de Testes Funcionais');
  console.log('══════════════════════════════════════════════════\n');

  // ── Health Check ──────────────────────────────────────────────────────────
  console.log('▶ Health Check');
  await test('GET /health retorna status ok', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200, `status esperado 200, recebido ${res.status}`);
    assert(res.body.status === 'ok', 'campo status deve ser "ok"');
  });

  await delay(400);

  // ── API 1: Clientes ───────────────────────────────────────────────────────
  console.log('\n▶ API 1 — Clientes');

  await test('GET /api/clientes — lista clientes (paginado)', async () => {
    const res = await request('GET', '/api/clientes?page=1');
    assert(res.status === 200, `status esperado 200, recebido ${res.status}`);
    assert(res.body.success === true, 'success deve ser true');
    assert(res.body.data !== undefined, 'data deve estar presente');
  });

  await delay(400);

  await test('GET /api/clientes — validação: page inválido', async () => {
    const res = await request('GET', '/api/clientes?page=abc');
    assert(res.status === 400, `status esperado 400, recebido ${res.status}`);
    assert(res.body.success === false, 'success deve ser false em erro de validação');
  });

  await delay(400);

  await test('GET /api/clientes/existe — sem parâmetros retorna 400', async () => {
    const res = await request('GET', '/api/clientes/existe');
    assert(res.status === 400, `status esperado 400, recebido ${res.status}`);
  });

  await delay(400);

  await test('GET /api/clientes/existe?email=teste@exemplo.com — verifica existência', async () => {
    const res = await request('GET', '/api/clientes/existe?email=teste@exemplo.com');
    // 200 = resposta da API (existe ou não), 4xx = erro de validação nosso
    assert([200, 400, 422, 502].includes(res.status), `status inesperado: ${res.status}`);
  });

  await delay(400);

  await test('POST /api/clientes — validação: campos obrigatórios ausentes', async () => {
    const res = await request('POST', '/api/clientes', { name: 'Apenas Nome' });
    assert(res.status === 400, `status esperado 400, recebido ${res.status}`);
    assert(Array.isArray(res.body.errors), 'deve retornar array de erros');
  });

  await delay(400);

  await test('POST /api/clientes — criação de cliente (mock payload)', async () => {
    // Este teste enviará para a API real — precisa do token
    const res = await request('POST', '/api/clientes', {
      customer_id: `test_${Date.now()}`,
      name:        'Cliente Teste API Challenge',
      email:       `teste_${Date.now()}@apitest.com`,
      phone:       '11999990000',
    });
    // 201 = criado, 422/400 = regra de negócio TomTicket (ex: email duplicado)
    assert([201, 400, 422, 502].includes(res.status), `status inesperado: ${res.status}`);
  });

  await delay(400);

  // ── API 2: Chamados ───────────────────────────────────────────────────────
  console.log('\n▶ API 2 — Chamados');

  await test('GET /api/chamados — lista chamados', async () => {
    const res = await request('GET', '/api/chamados?page=1');
    assert(res.status === 200, `status esperado 200, recebido ${res.status}`);
    assert(res.body.success === true, 'success deve ser true');
    assert(res.body.data !== undefined, 'data deve estar presente');
  });

  await delay(400);

  await test('GET /api/chamados — filtro por department_id (query string)', async () => {
    const res = await request('GET', '/api/chamados?page=1&department_id=DEPT_EXEMPLO');
    assert([200, 422, 502].includes(res.status), `status inesperado: ${res.status}`);
  });

  await delay(400);

  await test('POST /api/chamados — validação: campos obrigatórios ausentes', async () => {
    const res = await request('POST', '/api/chamados', { subject: 'Sem cliente nem depto' });
    assert(res.status === 400, `status esperado 400, recebido ${res.status}`);
    assert(Array.isArray(res.body.errors), 'deve retornar array de erros');
  });

  await delay(400);

  await test('POST /api/chamados — validação: customer_id_type inválido', async () => {
    const res = await request('POST', '/api/chamados', {
      customer_id:      'cliente@teste.com',
      customer_id_type: 'X',  // inválido: deve ser I ou E
      department_id:    'DEPT1',
      subject:          'Teste',
      message:          'Mensagem de teste',
    });
    assert(res.status === 400, `status esperado 400, recebido ${res.status}`);
  });

  await delay(400);

  await test('POST /api/chamados/:id/comentar — validação: comment ausente', async () => {
    const res = await request('POST', '/api/chamados/CHAMADO123/comentar', {});
    assert(res.status === 400, `status esperado 400, recebido ${res.status}`);
  });

  await delay(400);

  await test('POST /api/chamados/:id/transferir — sem department_id nem operator_id retorna 400', async () => {
    const res = await request('POST', '/api/chamados/CHAMADO123/transferir', {});
    assert(res.status === 400, `status esperado 400, recebido ${res.status}`);
  });

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  Resultado: ${passed} ✅  /  ${failed} ❌  (total: ${passed + failed})`);
  console.log('══════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('\n[ERRO FATAL] Não foi possível conectar ao servidor.');
  console.error('Certifique-se de que o servidor está rodando: npm start\n');
  console.error(err.message);
  process.exit(1);
});
