/**
 * Middleware centralizado de tratamento de erros.
 * Captura erros lançados em qualquer rota e devolve resposta padronizada.
 */

const { validationResult } = require('express-validator');

/**
 * Formata erros de validação do express-validator.
 * Deve ser chamado dentro de cada route handler após as regras de validação.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Parâmetros inválidos.',
      errors: errors.array().map((e) => ({ campo: e.path, mensagem: e.msg })),
    });
  }
  next();
}

/**
 * Middleware de erro global (deve ser registrado por último no Express).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Erros vindos da API TomTicket (axios)
  if (err.response) {
    const status = err.response.status || 502;
    return res.status(status).json({
      success: false,
      message: 'Erro retornado pela API TomTicket.',
      detalhes: err.response.data,
    });
  }

  // Erros de configuração (token ausente, etc.)
  if (err.message && err.message.includes('TOMTICKET_TOKEN')) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }

  // Erro genérico
  console.error('[ERRO]', err.message);
  return res.status(500).json({
    success: false,
    message: 'Erro interno no servidor.',
    detalhes: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

module.exports = { handleValidation, errorHandler };
