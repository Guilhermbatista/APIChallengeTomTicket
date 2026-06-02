/**
 * API 1 — Gestão de Clientes
 * ===========================
 * Endpoints:
 *   GET  /api/clientes              - Lista todos os clientes (paginado)
 *   GET  /api/clientes/:id          - Consulta um cliente individualmente
 *   GET  /api/clientes/existe       - Verifica existência de cliente por email/id
 *   POST /api/clientes              - Cria um novo cliente
 *   POST /api/clientes/:id/atualizar- Atualiza dados de um cliente
 *   POST /api/clientes/:id/status   - Ativa ou desativa um cliente
 */

const express = require('express');
const { query, body, param } = require('express-validator');
const router = express.Router();

const client = require('../utils/tomticketClient');
const { handleValidation } = require('../middleware/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clientes
// Lista todos os clientes com suporte a paginação e filtros opcionais.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page deve ser inteiro >= 1'),
    query('search').optional().isString().withMessage('search deve ser texto'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const params = {};
      if (req.query.page)   params.page   = req.query.page;
      if (req.query.search) params.search = req.query.search;

      const data = await client.get('/customer/list', params);

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clientes/existe?email=...  OU  ?customer_id=...
// Verifica se um cliente já existe antes de criar.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/existe',
  [
    query('email')
      .optional()
      .isEmail()
      .withMessage('email inválido'),
    query('customer_id')
      .optional()
      .isString()
      .withMessage('customer_id deve ser texto'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      if (!req.query.email && !req.query.customer_id) {
        return res.status(400).json({
          success: false,
          message: 'Informe ao menos "email" ou "customer_id" como query param.',
        });
      }

      const params = {};
      if (req.query.email)       params.email       = req.query.email;
      if (req.query.customer_id) params.customer_id = req.query.customer_id;

      const data = await client.get('/customer/exists', params);

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clientes/:id
// Retorna os detalhes completos de um cliente pelo seu identificador interno.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('id do cliente é obrigatório'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const data = await client.get('/customer/details', {
        customer_id: req.params.id,
      });

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clientes
// Cria um novo cliente na conta TomTicket.
//
// Body (form-data / JSON):
//   customer_id* - Identificador único (CPF, CNPJ, ID interno, etc.)
//   name*        - Nome completo
//   email*       - E-mail do cliente
//   phone        - Telefone (opcional)
//   organization_id - ID da organização vinculada (opcional)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('customer_id')
      .notEmpty().withMessage('customer_id é obrigatório')
      .isLength({ max: 250 }).withMessage('customer_id máximo 250 caracteres'),
    body('name')
      .notEmpty().withMessage('name é obrigatório')
      .isLength({ max: 250 }).withMessage('name máximo 250 caracteres'),
    body('email')
      .notEmpty().withMessage('email é obrigatório')
      .isEmail().withMessage('email inválido')
      .isLength({ max: 250 }),
    body('phone')
      .optional()
      .isLength({ max: 30 }).withMessage('phone máximo 30 caracteres'),
    body('organization_id')
      .optional()
      .isString(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { customer_id, name, email, phone, organization_id } = req.body;

      const payload = { customer_id, name, email };
      if (phone)           payload.phone           = phone;
      if (organization_id) payload.organization_id = organization_id;

      const data = await client.post('/customer/new', payload);

      return res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso.',
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clientes/:id/atualizar
// Atualiza os dados de um cliente existente.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/atualizar',
  [
    param('id').notEmpty().withMessage('id do cliente é obrigatório'),
    body('name').optional().isLength({ max: 250 }),
    body('email').optional().isEmail().withMessage('email inválido'),
    body('phone').optional().isLength({ max: 30 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const payload = { customer_id: req.params.id };
      const campos = ['name', 'email', 'phone', 'organization_id'];
      campos.forEach((c) => { if (req.body[c] !== undefined) payload[c] = req.body[c]; });

      const data = await client.post('/customer/update', payload);

      return res.json({
        success: true,
        message: 'Cliente atualizado com sucesso.',
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clientes/:id/status
// Ativa (active=1) ou desativa (active=0) um cliente.
// Body: { active: 0 | 1 }
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:id/status',
  [
    param('id').notEmpty().withMessage('id do cliente é obrigatório'),
    body('active')
      .notEmpty().withMessage('active é obrigatório')
      .isIn(['0', '1', 0, 1]).withMessage('active deve ser 0 (desativar) ou 1 (ativar)'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const data = await client.post('/customer/permissions/access', {
        customer_id: req.params.id,
        access: String(req.body.active),
      });

      return res.json({
        success: true,
        message: `Cliente ${req.body.active == 1 ? 'ativado' : 'desativado'} com sucesso.`,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
