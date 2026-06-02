# APIChallengeTomTicket
Integração com a API do TomTicket utilizando Node.js e Express, oferecendo operações de consulta e criação de clientes e chamados.

# Desafio Técnico - Integração TomTicket

## Sobre o Projeto

Este projeto foi desenvolvido como parte de um desafio técnico proposto pela **PSATECH**, com o objetivo de demonstrar habilidades em desenvolvimento de APIs, integração entre sistemas e aplicação de tecnologia para otimização de processos corporativos.

A solução implementa uma API REST em **Node.js**, responsável por integrar sistemas externos à plataforma **TomTicket**, permitindo operações de criação e consulta de clientes e chamados de forma centralizada, segura e escalável.

## Objetivo

Desenvolver uma camada de integração capaz de automatizar processos de atendimento, reduzindo atividades manuais e facilitando a comunicação entre aplicações e o sistema de gestão de tickets.

## Funcionalidades

### Clientes

* Cadastro de clientes
* Consulta de clientes
* Consulta de cliente por identificador

### Chamados

* Criação de chamados
* Consulta de chamados
* Consulta de chamado por protocolo

## 🛠 Tecnologias Utilizadas

* Node.js
* Express.js
* Axios
* REST API
* Swagger/OpenAPI
* JavaScript

## 📂 Estrutura do Projeto

```text
src/
├── controllers/
├── services/
├── routes/
├── middlewares/
├── config/
└── app.js
```

## 🔗 Integração

A aplicação consome a API oficial do TomTicket para realizar operações de gerenciamento de clientes e chamados, utilizando autenticação por token e comunicação via HTTP REST.

## 💡 Diferenciais Implementados

* Arquitetura organizada em camadas
* Separação de responsabilidades
* Tratamento de erros
* Padronização de respostas da API
* Código preparado para futuras evoluções e escalabilidade

## 👨‍💻 Autores

**Vinicius Lacava**

**Guilherme Batista**

---

### PSATECH

Este projeto foi desenvolvido com foco na aplicação da tecnologia como ferramenta para melhoria contínua, automação de processos e geração de valor para o negócio, alinhando qualidade técnica, escalabilidade e eficiência operacional.
