---
name: 21-react-auth-page
description: Login SPA com RHF e Zod; usar para integrar a pagina de login e planear registo ou recuperacao com contratos de backend.
metadata:
  stack: "react-web"
  scope: "ux"
  requires: "[]"
  related: "[02-folder-structure, 03-domain-structure, 04-stack, 06-patterns, 08-auth, 13-routes, 14-types, 22-performance]"
  last-verified: "2026-10-25"
---

# Pagina de autenticacao

Aplicar [08-auth](../08-auth/SKILL.md), [10-forms](../10-forms/SKILL.md),
[09-i18n](../09-i18n/SKILL.md) e [23-accessibility](../23-accessibility/SKILL.md).

A [referencia compilada](references/AuthPage.template.tsx) implementa apenas login,
com React Hook Form, Zod, labels associados e mensagens traduzidas. O callback
login deve chamar o cliente de 08-auth; nao existe sucesso simulado nem persistencia
de tokens. Injetar traducoes reais e integrar os tokens Tailwind do projeto.

Registo e recuperacao sao extensoes, nao funcionalidades prontas do template:
confirmar endpoints, schemas, politica de password e respostas neutras anti-enumeracao.
Nao inventar OAuth, backend PHP, endpoints ou ficheiros ausentes.
Reutilizar o unico AuthProvider do projeto. Restore usa /auth/session para obter
utilizador e token; /auth/refresh devolve apenas token. O interceptor reage a 401,
nao e um temporizador preventivo de expiracao.

Antes de entregar: testar validacao, submissao unica, erro generico sem texto
do servidor, estado pendente, teclado, traducoes e contrato real do backend.
Esta referencia SPA nao implica suporte pronto a SSR/Next.js.
