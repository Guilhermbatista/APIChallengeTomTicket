/**
 * Cliente HTTP para comunicação com a API TomTicket v2.0
 * Base URL: https://api.tomticket.com/v2.0
 * Autenticação: Bearer Token
 * Rate Limit: 3 requisições/segundo
 */

const axios = require('axios');

const BASE_URL = 'https://api.tomticket.com/v2.0';

/**
 * Cria uma instância axios configurada com o token Bearer do TomTicket.
 * O token é lido de process.env.TOMTICKET_TOKEN em cada requisição,
 * permitindo trocar o token sem reiniciar o servidor.
 */
function getClient() {
  const token = process.env.TOMTICKET_TOKEN;

  if (!token) {
    throw new Error('TOMTICKET_TOKEN não configurado. Defina a variável de ambiente.');
  }

  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000, // 15 segundos
  });
}

/**
 * Realiza uma requisição GET para a API TomTicket.
 * @param {string} endpoint - Caminho relativo, ex: '/customer/list'
 * @param {object} params   - Query string params
 * @returns {Promise<object>} Dados retornados pela API
 */
async function get(endpoint, params = {}) {
  const client = getClient();
  const response = await client.get(endpoint, { params });
  return response.data;
}

/**
 * Realiza uma requisição POST para a API TomTicket usando form-data.
 * @param {string} endpoint - Caminho relativo, ex: '/customer/new'
 * @param {object} body     - Campos do formulário
 * @returns {Promise<object>} Dados retornados pela API
 */
async function post(endpoint, body = {}) {
  const client = getClient();

  // A API TomTicket v2.0 exige Content-Type: form-data (multipart)
  const formData = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await client.post(endpoint, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data;
}

module.exports = { get, post };
