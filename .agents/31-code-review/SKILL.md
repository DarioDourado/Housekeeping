---
name: 31-code-review
description: >
  Metodologia de code review de Pull Request com foco em ALTA PERFORMANCE e CIBERSEGURANÇA.
  Checklist por camada: security (bypass de autenticação, XSS, tokens, CORS, headers), performance
  (re-renders, bundle, queries), e regras do sistema (20-rules). Usar ao rever PRs antes de merge.
  Use when: code review, rever PR, revisão de código, pull request review, audit de performance,
  audit de segurança de código, diff review.
metadata:
  stack: "react-web"
  scope: "quality"
  requires: "[20-rules, 17-security, 22-performance]"
  related: "[17-security, 22-performance, 20-rules, 28-security-verification, 24-ci-quality, 29-pentest]"
  last-verified: "2026-09-02"
---
# CODE REVIEW — Review de PR (Performance + Segurança)

> Metodologia para rever diffs de Pull Request antes do merge. Começa sempre por confirmar as
> regras absolutas (`20-rules`) e cruzar com `17-security` (estático) quando há superfícies novas.

## Passo 1 — Bloqueios imediatos (regras absolutas)

Barram o merge tal como estão:
- `any` não tipado / `@ts-ignore`.
- Token em `localStorage`/`sessionStorage` (regra ❌1) — tem de ser memória + refresh httpOnly.
- `dangerouslySetInnerHTML` sem `DOMPurify.sanitize()` no mesmo local (❌16 / `17-security`).
- HTTP direto nas pages (❌2) — tudo via hooks/transporters.
- `console.log` em produção (❌12).
- Ações destrutivas (delete) sem `ConfirmDialog` (❌15).
- Analytics antes do consentimento (❌18).
- Hardcoded roles/strings (❌4, ❌14).

## Passo 2 — Cibersegurança (vetores por camada)

| Área | Perguntas do reviewer | Referência |
|---|---|---|
| Autenticação | O login valida credenciais no servidor? Tem rate limit/lockout? Refresh em single-flight sem loop em 401? | `08-auth`, `28` |
| Autorização | O endpoint verifica ownership (IDOR)? O role é verificado no servidor, não só no cliente? | `17` Skill 3 |
| Input | Resposta de API validada com `schema.parse`? Input de forms com Zod (não só UX)? | `10`, `14` |
| Tokens | JWT com algoritmo seguro (nunca `none`), secret forte, expiração, audience/issuer? | `17` Skill 4 |
| XSS | Qualquer `dangerouslySetInnerHTML` sanitizado? Texto simples preferido? | `17` Skill 1 |
| Headers/CSP/CORS | CSP sem `unsafe-inline`/`unsafe-eval`? CORS restrito (nunca `*` com credentials)? HSTS? | `17` Skill 5, `28` vetor 4 |
| Segredos | Nada de secrets no bundle/diff/`.env` commitado? | `28` vetor 1 |
| Dependências | Nova lib adicionada sem necessidade real? (cruzar `30-simplify`) | `17` Skill 6 |

## Passo 3 — Alta performance

| Área | Perguntas | Referência |
|---|---|---|
| Re-renders | `memo` só em listas grandes (>20 itens)? `useCallback` só quando passado a componente memoizado? | `22` §Re-renders |
| Estado | Zustand lido por seletor (nunca store inteiro)? | `22` §Zustand |
| Queries | React Query para dados do servidor? `staleTime`/`retry` classificado? Invalidar após mutation? | `07`, `22` |
| Bundle | Componente pesado lazy dentro da página? Nova dependência justificada? | `22` §Code splitting |
| Imagens | `width`/`height` + `loading="lazy"`? (exceto LCP) `srcset`/`sizes`? | `22` §Imagens |
| Listas longas | Virtualização acima de ~100 itens? | `22` §Virtualização |
| Debounce | Pesquisa/inputs com `useDebounce`? | `22` §Debounce |

## Passo 4 — Simplificação (anti over-engineering)

- Existe código que podia ser uma linha ou uma feature nativa? (`30-simplify`)
- Está a reescrever algo que já existe no codebase ou numa dependência instalada?
- Adicionou dependência para resolver o que a stdlib/browser já resolve?

## Saída do review

Comentários concisos em **bulletpoint** (ver `05-conventions` §Comentários), ordenados por bloqueante → maior impacto:
```
🔴 BLOQUEANTE  · token de acesso em localStorage → move para memória (rule ❌1)
🟠 ALTO        · endpoint GET /users/{id} sem verificação de ownership (IDOR) → scope ao user
🟡 MÉDIO       · lista de 500 users com .map direto → virtualizar (22)
🟢 NIT         · ordenação trivial num hook próprio → in-line (30-simplify)
```

## Regras

| Regra | Razão |
|---|---|
| `20-rules` primeiro | As regras absolutas barram sozinhas o merge |
| Segurança no servidor, não no cliente | Cliente só esconde; o servidor é a trust boundary |
| Só otimizar o que o profiler justifica | `memo`/`useMemo` têm overhead próprio |
| Comentários em bulletpoint | Curto, acionável, sem ruído (`05-conventions`) |
| Cruzar com `17`/`28`/`29` | Estático + verificação + pentest ativo cobrem níveis diferentes |
| Aprovar só quando bloqueantes resolvidos | O reviewer é gate de qualidade e segurança |
