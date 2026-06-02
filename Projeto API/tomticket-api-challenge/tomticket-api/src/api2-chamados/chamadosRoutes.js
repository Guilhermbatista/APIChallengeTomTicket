/**
 * API 2 — Gestão de Chamados
 * ===========================
 * Endpoints:
 *   GET  /api/chamados              - Lista todos os chamados (paginado + filtros)
 *   GET  /api/chamados/:id          - Consulta um chamado individualmente
 *   POST /api/chamados              - Cria um novo chamado
 *   POST /api/chamados/:id/comentar - Adiciona comentário em um chamado
 *   POST /api/chamados/:id/responder- Responde um chamado (como atendente)
 *   POST /api/chamados/:id/finalizar- Finaliza um chamado
 *   POST /api/chamados/:id/transferir - Transfere chamado de departamento/atendente
 */

const express = require('express');
const { query, body, param } = require('express-validator');
const router = express.Router();

const client = require('../utils/tomticketClient');
const { handleValidation } = require('../middleware/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chamados
// Lista chamados com paginação e filtros opcionais (status, departamento, etc.)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page deve ser inteiro >= 1'),
    query('department_id').optional().isString(),
    query('status').optional().isString(),
    query('customer_id').optional().isString(),
    query('search').optional().isString(),
    query('date_start').optional().isString(),
    query('date_end').optional().isString(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const allowed = ['page', 'department_id', 'status', 'customer_id', 'search', 'date_start', 'date_end'];
      const params = {};
      allowed.forEach((k) => { if (req.query[k]) params[k] = req.query[k]; });

      const data = await client.get('/ticket/list', params);

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chamados/:id
// Retorna todos os detalhes de um chamado específico.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('id do chamado é obrigatório'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const data = await client.get('/ticket/detail', {
        ticket_id: req.params.id,
      });

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chamados
// Abre um novo chamado no TomTicket.
//
// Body:
//   customer_id*    - Identificador do cliente (email ou ID interno)
//   customer_id_type- I (interno) | E (email) — padrão: I
//   department_id*  - Identificador do departamento
//   subject*        - Título/assunto do chamado (max 250)
//   message*        - Mensagem de abertura (text/plain)
//   category_id     - Categoria (opcional)
//   operator_id     - Atendente responsável (opcional)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('customer_id')
      .notEmpty().withMessage('customer_id é obrigatório')
      .isLength({ max: 250 }),
    body('customer_id_type')
      .optional()
      .isIn(['I', 'E']).withMessage('customer_id_type deve ser I (interno) ou E (email)'),
    body('department_id')
      .notEmpty().withMessage('department_id é obrigatório')
      .isLength({ max: 250 }),
    body('subject')
      .notEmpty().withMessage('subject é obrigatório')
      .isLength({ max: 250 }).withMessage('subject máximo 250 caracteres'),
    body('message')
      .notEmpty().withMessage('message é obrigatório'),
    body('category_id').optional().isString(),
    body('operator_id').optional().isString(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { customer_id, customer_id_type, department_id, subject, message, category_id, operator_id } = req.body;

      const payload = { customer_id, department_id, subject, message };
      if (customer_id_type) payload.customer_id_type = customer_id_type;
      if (category_id)      payload.category_id      = category_id;
      if (operator_id)      payload.operator_id      = operator_id;

      const data = await client.post('/ticket/new', payload);

      return res.status(201).json({
        success: true,
        message: 'Chamado criado com sucesso.',
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chamados/:id/comentar
// Adiciona um comentário interno em um chamado.
// Body: { comment* }
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/comentar',
  [
    param('id').notEmpty().withMessage('id do chamado é obrigatório'),
    body('comment')
      .notEmpty().withMessage('comment é obrigatório')
      .isLength({ max: 512 }).withMessage('comment máximo 512 caracteres'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const data = await client.post('/ticket/comment', {
        ticket_id: req.params.id,
        comment: req.body.comment,
      });

      return res.json({
        success: true,
        message: 'Comentário adicionado com sucesso.',
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chamados/:id/responder
// Responde um chamado como atendente responsável.
// Body: { message* }
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/responder',
  [
    param('id').notEmpty().withMessage('id do chamado é obrigatório'),
    body('message')
      .notEmpty().withMessage('message é obrigatório')
      .isLength({ max: 512 }).withMessage('message máximo 512 caracteres'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const data = await client.post('/ticket/reply/operator', {
        ticket_id: req.params.id,
        message: req.body.message,
      });

      return res.json({
        success: true,
        message: 'Chamado respondido com sucesso.',
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chamados/:id/finalizar
// Finaliza (encerra) um chamado.
// Body: { message* }
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/finalizar',
  [
    param('id').notEmpty().withMessage('id do chamado é obrigatório'),
    body('message')
      .notEmpty().withMessage('message é obrigatório (mensagem de encerramento)'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const data = await client.post('/ticket/finish', {
        ticket_id: req.params.id,
        message: req.body.message,
      });

      return res.json({
        success: true,
        message: 'Chamado finalizado com sucesso.',
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chamados/:id/transferir
// Transfere um chamado para outro departamento e/ou atendente.
// Body: { department_id?, operator_id? }  — ao menos um obrigatório
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/transferir',
  [
    param('id').notEmpty().withMessage('id do chamado é obrigatório'),
    body('department_id').optional().isString(),
    body('operator_id').optional().isString(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { department_id, operator_id } = req.body;

      if (!department_id && !operator_id) {
        return res.status(400).json({
          success: false,
          message: 'Informe ao menos "department_id" ou "operator_id" para transferência.',
        });
      }

      const payload = { ticket_id: req.params.id };
      if (department_id) payload.department_id = department_id;
      if (operator_id)   payload.operator_id   = operator_id;

      const data = await client.post('/ticket/transfer', payload);

      return res.json({
        success: true,
        message: 'Chamado transferido com sucesso.',
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
