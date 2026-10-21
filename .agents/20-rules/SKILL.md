---
name: 20-rules
description: >
  Lei Absoluta: regras SEMPRE/NUNCA não negociáveis. Consultar sempre.
  Use when: sempre, lei absoluta, review, checklist pré-PR, regras.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[06-patterns, 14-types, 17-security, 26-privacy]"
  last-verified: "2026-07-25"
---
# RULES - Regras Absolutas

## ✅ SEMPRE

| # | Regra |
|---|-------|
| 1 | Tipar TUDO (sem `any`) |
| 2 | React Query para dados do servidor |
| 3 | Lógica nos hooks, não nas pages |
| 4 | Aliases `@/` para imports |
| 5 | i18n para TODOS os textos |
| 6 | Tratar 4 estados: loading, error, empty, success |
| 7 | Validar forms **e respostas de API** com Zod (`schema.parse` no transporter — ver `06-patterns`/`14-types`) |
| 8 | Access token em memória (não localStorage) |
| 9 | `withCredentials: true` no Axios |
| 10 | `index.ts` em cada pasta |
| 11 | 1 hook = 1 ficheiro |
| 12 | 1 domínio = estrutura espelhada (hooks/transporters/types) |
| 13 | Named exports (não default) |
| 14 | Invalidar queries após mutations |
| 15 | ErrorBoundary no root |
| 16 | Confirmar ações destrutivas (delete) com `ConfirmDialog` antes de disparar a mutation |
| 17 | Alterar `types/`, transporters ou `config/constants.ts` ⇒ atualizar o contrato em `34-backend-fastapi` (domain-contract.md) no mesmo trabalho |

## ❌ NUNCA

| # | Regra |
|---|-------|
| 1 | Tokens em localStorage/sessionStorage |
| 2 | HTTP directo nas pages |
| 3 | Usar `any` |
| 4 | Strings hardcoded (usar i18n) |
| 5 | Lógica de negócio em components |
| 6 | Esquecer invalidar queries após mutations |
| 7 | Imports relativos longos (`../../../`) |
| 8 | Components > 200 linhas |
| 9 | Hooks > 100 linhas |
| 10 | Misturar responsabilidades entre camadas |
| 11 | Default exports |
| 12 | Console.log em produção |
| 13 | Silenciar erros sem feedback |
| 14 | Hardcoded roles (definir no Context) |
| 15 | Chamar `useDelete{Domain}.mutate()` direto num `onClick` sem `ConfirmDialog` |
| 16 | `dangerouslySetInnerHTML` sem sanitizacao adequada; rever tambem URLs perigosas, sinks DOM e bibliotecas de terceiros (ver `17-security`) |
| 17 | `// @ts-ignore` — usar `@ts-expect-error` com justificação na mesma linha (ver `14-types`) |
| 18 | Analytics/tracking a carregar antes do opt-in de consentimento (ver `26-privacy`) |

## Checklist de Implementação

Antes de considerar código completo, verificar:

```
□ Estrutura de pastas correcta
□ Types definidos com Zod (input de forms E schema de entidade/output)
□ Transporter valida a resposta da API com `schema.parse()` — nunca `return data` direto
□ i18n para todos os textos
□ React Query para dados
□ 4 estados UI tratados
□ Auth com memory + httpOnly
□ Formulários com RHF + Zod
□ @/ imports
□ index.ts exports
□ Domínio espelhado (hooks/transporters/types)
□ ErrorBoundary presente
□ Lazy loading nas routes
□ Ações destrutivas (delete) passam por ConfirmDialog
□ dangerouslySetInnerHTML só com DOMPurify (idealmente: nenhum)
□ Analytics só após consentimento (26-privacy)
```

## Checklist: Novo Domínio

```
□ src/hooks/{domain}/
□ src/services/transporters/{domain}/
□ src/types/{domain}/
□ Query keys em _queryKeys.ts
□ Traduções em lang/*.json
```

## Checklist: Nova Page

```
□ pages/{Page}/{Page}.tsx
□ Hook(s) correspondente(s)
□ Rota em routes.config.tsx
□ Traduções
□ 4 estados (loading/error/empty/success)
```

## Checklist: Novo Component

```
□ UI/components/{Component}/{Component}.tsx
□ UI/components/{Component}/index.ts
□ Props tipadas com interface
□ Tailwind para estilos
□ Acessibilidade básica (aria, roles)
```
