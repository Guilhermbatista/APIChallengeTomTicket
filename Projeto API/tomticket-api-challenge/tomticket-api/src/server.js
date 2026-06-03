/**
 * Servidor Express — API Challenge TomTicket
 * ============================================
 * Registra as duas APIs e middlewares globais.
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const clientesRoutes = require('./api1-clientes/clientesRoutes');
const chamadosRoutes = require('./api2-chamados/chamadosRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Trust proxy (necessário para Railway, Azure, Render e outros clouds) ─────
app.set('trust proxy', 1);

// ─── Middlewares Globais ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limit local: respeita o limite de 3 req/s da API TomTicket
const limiter = rateLimit({
  windowMs: 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas requisições. Aguarde um instante e tente novamente.',
  },
});
app.use('/api', limiter);

// ─── Rotas ────────────────────────────────────────────────────────────────
app.use('/api/clientes', clientesRoutes);
app.use('/api/chamados', chamadosRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    token_configurado: !!process.env.TOMTICKET_TOKEN,
  });
});

// ─── Tratamento de Erro Global ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 TomTicket API rodando em http://localhost:${PORT}`);
  console.log(`   API 1 - Clientes : http://localhost:${PORT}/api/clientes`);
  console.log(`   API 2 - Chamados : http://localhost:${PORT}/api/chamados`);
  console.log(`   Health Check     : http://localhost:${PORT}/health\n`);
});

module.exports = app;
