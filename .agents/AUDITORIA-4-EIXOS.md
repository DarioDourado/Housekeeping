# Auditoria Rigorosa — 4 Eixos (react-enterprise-modula)

> **Auditor:** arquitetura frontend React/SPA — segurança, performance, usabilidade, consistência arquitetural
> **Data:** 2026-07-01 · **Versão do sistema auditado:** 1.0 (22 pastas de módulos, `00` a `21`)
> **Metodologia:** leitura integral (não apenas cabeçalhos) de todos os `SKILL.md` do sistema, incluindo os 4 módulos órfãos não indexados (`17-security`, `18-websockets`, `19-solid`, `21-react-auth-page`) e o `react-master.md` (baseline v1.0). Evidência citada por módulo + secção. Eixo de segurança cruzado com a skill `sec-audit-agent` (CISO-grade, CWE/CVSS) para evitar duplicação — ver nota no fim do Eixo 1.
> **Escala:** `Coberto` (orientação concreta e acionável) · `Parcial` (mencionado mas sem profundidade/código, ou presente mas inacessível/inconsistente) · `Ausente` (sem cobertura).

---

## ⚠️ Achado estrutural prévio (afeta os 4 eixos)

Antes da matriz por eixo, um problema estrutural que distorce a cobertura real do sistema: **o índice está desatualizado e esconde 4 dos 22 módulos.**

`README.md`, `USAGE_GUIDE.md` e `00-meta/SKILL.md` listam os módulos `00` a `17-rules` e param aí. Mas `17-rules` **não existe** — o módulo de regras absolutas está em `20-rules/SKILL.md`. Isto significa que um agente que segue o índice ao pé da letra:

- Nunca carrega `17-security` (segurança), `18-websockets` (realtime), `19-solid` (princípios SOLID), nem `21-react-auth-page` (template de auth) — não estão listados em lado nenhum.
- Carrega um caminho inexistente (`17-rules`) em vez das regras absolutas reais (`20-rules`).

Isto é agravado por dois factos: (1) `17-security` é o **único** módulo com cobertura de CSP, CORS, SRI, DOMPurify/XSS e npm audit/Dependabot — toda essa cobertura fica invisível na prática; (2) `21-react-auth-page` contradiz as regras de auth do resto do sistema (ver Eixo 1) — um agente que o carrega manualmente, sem saber que existe um confronto com `20-rules`, produz código inconsistente sem aviso.

> Sugestão de correção (pré-requisito para o resto desta auditoria fazer sentido na prática):
> 🔴 Atualizar `README.md`, `USAGE_GUIDE.md` e `00-meta/SKILL.md`: corrigir a referência `17-rules` → `20-rules` em todos os três ficheiros, e adicionar entradas de índice para `17-security`, `18-websockets`, `19-solid`, `21-react-auth-page`.

---

## Eixo 1 — Segurança (OWASP Top 10 2021 web + ASVS para SPAs)

| # | Item | Estado | Evidência |
|---|------|--------|-----------|
| A01 | Broken Access Control | **Parcial** | `08-auth` `ProtectedRoute` com `hasRole` client-side; `20-rules` ✅ "Roles no Context Prompt" (não hardcoded). Falta o aviso explícito **"RBAC no frontend é só UX — o backend valida sempre"** que existe no sistema RN (`13-auth`) mas não aqui — sem essa nota, um agente pode tratar `hasRole` como controlo de segurança real |
| A02 | Cryptographic Failures | **Ausente/Crítico** | `08-auth` define corretamente token em memória + refresh em cookie httpOnly `sameSite: 'strict'`. Mas `21-react-auth-page` (órfão, não indexado) recomenda **explicitamente** `localStorage` para o access token — contradição direta com `20-rules` ❌1 e `08-auth` §Regras. Ver secção dedicada abaixo |
| A03 | Injection / XSS (`dangerouslySetInnerHTML`) | **Parcial** | Cobertura técnica boa (DOMPurify, CSP com nonce) existe em `17-security` §XSS — mas este módulo não é indexado nem específico de React (exemplos genéricos web, não JSX). Nenhum módulo indexado (`06-patterns`, `20-rules`) menciona `dangerouslySetInnerHTML` ou sanitização |
| A05 | Security Misconfiguration (CSP/CORS/env/source maps) | **Parcial** | `15-env` cobre `.env` por ambiente e prefixo `VITE_`, mas **não avisa** que tudo com prefixo `VITE_` é embutido no bundle client-side e fica publicamente visível — a secção lê-se como regra positiva sem o contraponto de risco. CSP/CORS/source maps só existem em `17-security` (não indexado, não React-specific) |
| A06 | Vulnerable Components | **Ausente** | Não existe módulo de CI/Quality dedicado no sistema web (equivalente ao `33-ci-quality` do RN não tem paralelo). `npm audit`/Dependabot só aparecem em `17-security` (não indexado) |
| A07 | Identification & Auth Failures (JWT storage) | **Coberto** (com exceção A02) | `08-auth` — interceptor de refresh com guard `_retry`, `withCredentials: true`, cookie httpOnly. Falhas apenas via a contradição do `21-react-auth-page` |
| A08 | Software/Data Integrity (SRI) | **Ausente** (nos módulos indexados) | SRI para scripts CDN só coberto em `17-security` (não indexado). Nenhum módulo indexado menciona `integrity=`/`crossorigin` para scripts externos |
| Extra | CSRF | **Parcial** | Mitigado implicitamente por `sameSite: 'strict'` no cookie (`08-auth`), mas nunca discutido explicitamente como proteção CSRF nem mencionado como conceito em nenhum módulo |
| Extra | Clickjacking | **Ausente** (nos módulos indexados) | `X-Frame-Options`/`frame-ancestors` só em `17-security` (não indexado) |
| Extra | Validação Zod em respostas de API (não só forms) | **Ausente** | `06-patterns` §Transporter Pattern faz `return data` direto do `axios`, sem `schema.parse`/`safeParse` — a resposta da API nunca é validada em runtime, só tipada estaticamente (`Promise<User>` é uma promessa TypeScript, não uma garantia). `10-forms`/`14-types` usam Zod só para input de formulário via `zodResolver`. Isto contraria o pedido explícito de validação Zod "tanto em respostas de API como em inputs de formulário" |
| Extra | Sanitização de input (além de forms) | **Parcial** | Validação de forms via Zod é sólida; sanitização de conteúdo renderizado como HTML (rich text, markdown preview) não é abordada em módulo nenhum |

### Gaps e sugestões — Eixo 1

**A02 — Contradição de armazenamento de token (localStorage vs memória) — CRÍTICO.**
> `21-react-auth-page/SKILL.md` linha 78: *"Persistência via `localStorage` (access token) + httpOnly cookie (refresh token, recomendado)"*. Isto contradiz diretamente:
> - `20-rules` ❌ NUNCA #1: "Tokens em localStorage/sessionStorage"
> - `08-auth` §Regras de Segurança: "Token em memória | NUNCA localStorage/sessionStorage"
>
> Um agente que carrega `21-react-auth-page` isoladamente (o cenário mais provável, já que gera um `AuthPage.tsx` standalone) gera um armazenamento de token vulnerável a roubo via XSS, sem qualquer aviso de conflito com o resto do sistema.
> Sugestão: reescrever a secção de persistência em `21-react-auth-page` para citar o padrão canónico de `08-auth` (token em memória via `setAccessToken`/`getAccessToken`, refresh em cookie httpOnly) e remover a menção a `localStorage`. Adicionar nota cruzada: `Ver 08-auth para o padrão de persistência de tokens deste sistema — nunca localStorage.`

**A01 — Falta aviso "RBAC é só UX" — ALTO.**
> Sugestão: adicionar a `08-auth` §Regras de Segurança:
> 🔴 `hasRole`/`ProtectedRoute` controlam **apenas** visibilidade de UI. O backend **deve sempre** re-validar permissões em cada endpoint — nunca confiar no frontend para autorização real. Esconder um botão não é controlo de acesso.

**A06 — Vulnerable Components / dependências — ALTO.**
> Sugestão: criar módulo `22-ci-quality` (paralelo ao `33-ci-quality` da versão RN) com ESLint/Prettier/Husky/lint-staged, `npm audit --audit-level=moderate` em CI, Dependabot semanal, gate de build em PR.

**Validação Zod em respostas de API — ALTO.**
> Sugestão: atualizar o Transporter Pattern em `06-patterns`:
> ```typescript
> getAll: async (filters?: UserFilters): Promise<User[]> => {
>   const { data } = await api.get('/users', { params: filters });
>   return userListSchema.parse(data); // valida a resposta em runtime
> },
> ```
> 🟡 Nem toda API precisa disto (custo de manutenção de schema por endpoint), mas endpoints críticos (auth, dados financeiros/PII) devem validar a resposta, não só o tipo estático.

### Nota de cross-reference com `sec-audit-agent`

Ao contrário do sistema RN — onde o eixo de segurança é quase todo *design-time* e complementar ao `sec-audit-agent` — aqui o problema não é ausência de conteúdo de segurança, é **arquitetura de descoberta**: o conteúdo de segurança mais completo (`17-security`) já é essencialmente uma cópia do `sec-audit-agent` (mesma estrutura de 9 skills, mesmo CWE/CVSS, exemplos PHP/Python/Node/Java em vez de React/TypeScript) colada dentro do sistema sem adaptação nem indexação. Isto duplica genuinamente critérios em vez de complementar. Recomendação: **não** tentar tornar `17-security` mais completo — reduzi-lo a uma camada fina *React/SPA-specific* (XSS via JSX/`dangerouslySetInnerHTML`, CSP para Vite, SRI para CDN scripts, storage de tokens) com exemplos TypeScript/React, e remeter tudo o resto (SSRF, IDOR de backend, Micro APIs) para o `sec-audit-agent` explicitamente, tal como o sistema RN já faz bem com `32-sec-audit`.

---

## Eixo 2 — Performance (Core Web Vitals e equivalentes)

| Item | Estado | Evidência |
|------|--------|-----------|
| LCP / carregamento inicial | **Ausente** | Nenhum módulo menciona Largest Contentful Paint, preload de recursos críticos, ou estratégia de fonte/imagem acima da dobra |
| INP / responsividade a interação | **Ausente** | Sem menção a Interaction to Next Paint, sem discussão de long tasks ou debounce de handlers custosos |
| CLS / estabilidade visual | **Ausente** | Sem menção a `width`/`height` explícitos em imagens, sem discussão de layout shift em skeletons vs conteúdo real |
| Code splitting / lazy routes | **Coberto** | `13-routes` — `lazy()` + `withSuspense` helper aplicado a todas as rotas |
| Re-renders (memo/useCallback, seletores) | **Ausente** | `06-patterns` não usa `memo` em nenhum exemplo; sem módulo ou secção dedicada a evitar re-renders desnecessários; sem menção a seletores otimizados no `07-react-query` |
| Cache de queries (`staleTime`/`gcTime`) | **Ausente/Parcial** | `07-react-query` mostra `staleTime` **comentado** no exemplo (não é a config aplicada por defeito); não existe `QueryClient` com `defaultOptions` global mostrado em módulo nenhum — ao contrário do sistema RN que tem `staleTime: 30_000, gcTime: 5*60_000` explícito |
| Otimização de imagens (WebP/AVIF, dimensões) | **Ausente** | Não mencionado em módulo algum |
| Análise de bundle | **Ausente** | Sem menção a `vite-bundle-visualizer`, budget de tamanho, ou gate de CI para bundle size |
| CSR vs SSR/SSG — clareza de contexto | **Parcial** | `04-stack` assume Vite (CSR puro) implicitamente, mas nunca declara isto explicitamente nem discute quando SSR/SSG (Next.js) seria mais apropriado — ambíguo para quem só lê os módulos |
| Debounce/throttle | **Parcial** | `03-domain-structure` referencia `hooks/common/useDebounce.ts` só como nome de ficheiro na árvore — sem implementação, delay recomendado, ou uso em pesquisa |
| Virtualização de listas | **Ausente** | Nenhuma menção a `@tanstack/react-virtual` ou virtualização — risco real em páginas de listagem (`Users`, etc.) com muitos itens |

### Gaps e sugestões — Eixo 2

**Ausência de módulo de Performance dedicado — CRÍTICO.**
> Ao contrário do sistema RN (`26-performance`, módulo completo e robusto), o sistema Web **não tem nenhum módulo de performance**. Toda a cobertura existente está fragmentada em `13-routes` (só lazy loading) e comentários soltos. Isto é o maior gap estrutural do sistema web.
> Sugestão: criar módulo `22-performance` cobrindo, no mínimo:
> - Core Web Vitals (LCP/INP/CLS) — o que são, como medir (`web-vitals` lib), alvos recomendados.
> - `QueryClient` com `defaultOptions` explícito (`staleTime`, `gcTime`, `retry`).
> - `memo`/`useCallback`/`useMemo` — quando usar (tabela custo/benefício, tal como o RN tem).
> - Imagens: `loading="lazy"`, dimensões explícitas, WebP/AVIF com fallback.
> - Virtualização de listas grandes (`@tanstack/react-virtual`).
> - Bundle analysis + budget em CI.

**Debounce (Parcial → completar).**
> Sugestão: implementação de referência em `07-react-query` ou no novo módulo de performance:
> ```typescript
> const debounced = useDebounce(searchInput, 300);
> const { data } = useGetUsers({ search: debounced });
> ```

---

## Eixo 3 — Design (Heurísticas de Nielsen Norman + especificidades web/desktop)

| # | Heurística | Estado | Evidência |
|---|-----------|--------|-----------|
| 1 | Visibilidade do estado do sistema | **Coberto** | `12-loading-states` — 4 estados (Loading/Error/Empty/Success), `Spinner`, `Skeleton` com Tailwind `animate-spin`/`animate-pulse` |
| 2 | Correspondência sistema-mundo real | **Coberto** | `09-i18n` — i18next completo, keys descritivas por domínio |
| 3 | Controlo e liberdade do utilizador | **Ausente** | Sem padrão de confirmação para ações destrutivas nem de "undo" em nenhum módulo indexado; `11-error-handling` tem toast mas sem ação de desfazer |
| 4 | Consistência e padrões | **Parcial** | Convenções de código muito consistentes (`05-conventions`), mas sem guidance de consistência visual entre browsers/OS (fontes de sistema, scrollbar custom, etc.) |
| 5 | Prevenção de erros | **Parcial** | Validação de formulários via Zod é forte (`10-forms`), mas sem confirmação prévia a ações irreversíveis (delete) em módulo algum |
| 6 | Reconhecimento vs memorização | **Parcial** | `13-routes` estrutura rotas bem, mas sem discussão de indicadores de localização ativa (breadcrumbs, nav item ativo) |
| 7 | Flexibilidade e eficiência de uso | **Ausente** | Sem atalhos de teclado, sem menção a power-user patterns |
| 8 | Design estético e minimalista | **Parcial** | Tailwind + `clsx` dão o mecanismo (`06-patterns`), mas não há tokens de design centralizados (cores hardcoded `bg-blue-600`/`bg-red-600` direto nas classes, ao contrário do sistema RN que tem `36-design-system` com tokens semânticos) |
| 9 | Ajudar a reconhecer/diagnosticar/recuperar erros | **Parcial** | `11-error-handling` tem `ErrorState`/`ToastContext`, mas o `DefaultErrorFallback` só faz `console.error` — o comentário diz "Enviar para Sentry" mas não implementa, ao contrário do `16-error-handling` da versão RN que tem integração Sentry completa com redaction |
| 10 | Ajuda e documentação | **Ausente** | Sem onboarding, tooltips, coach marks ou empty-state com CTA de ajuda em módulo algum |
| Extra | Responsividade / breakpoints | **Ausente** | Nenhum módulo define breakpoints padrão, mobile-first vs desktop-first, ou testa exemplos com classes responsivas Tailwind (`sm:`/`md:`/`lg:`) |
| Extra | WCAG 2.2 AA | **Ausente** | Nenhuma menção a contraste mínimo, tamanho de texto, ou estrutura semântica de headings |
| Extra | Navegação por teclado / focus visible | **Parcial** | `06-patterns` `Button` tem `focus:outline-none focus:ring-2` (bom detalhe), mas é o único exemplo — sem guidance de `tabIndex`, skip-links, focus trap em modais, ou ordem lógica de tab |
| Extra | Hover/active states | **Parcial** | Presentes nos exemplos Tailwind (`hover:bg-blue-700`) mas nunca discutidos como requisito |
| Extra | Browser back/forward + URL como fonte de verdade | **Ausente** | `13-routes` usa `createBrowserRouter` correctamente mas nunca discute sincronizar filtros/paginação com query params da URL (comportamento esperado em SPAs — refresh/partilha de link deve preservar estado) |
| Extra | Gestão de múltiplas tabs/sessão | **Ausente** | Sem discussão de sincronização de logout entre tabs (`storage` event) ou deteção de sessão desatualizada |

### Gaps e sugestões — Eixo 3

**Confirmação destrutiva + undo — ALTO.**
> Sugestão: adicionar a `06-patterns` ou novo bloco em `11-error-handling`, espelhando o padrão já validado no sistema RN:
> ```typescript
> const confirmDelete = () => {
>   if (!window.confirm(t('common.confirmDeleteMessage'))) return;
>   deleteMutation.mutate(id);
> };
> ```
> 🟡 Preferir um modal acessível (focus trap, `Escape` fecha) a `window.confirm` nativo em produção; `window.confirm` serve como exemplo mínimo.

**WCAG 2.2 AA / navegação por teclado — ALTO.**
> Sugestão: novo módulo `23-accessibility` (paralelo ao `37-accessibility` do RN): contraste mínimo 4.5:1, `aria-label` em ícones sem texto, focus visible obrigatório (não remover `outline` sem substituto), skip-link para conteúdo principal, focus trap em modais/drawers, ordem de tab lógica, headings hierárquicos (`h1`→`h2`→`h3` sem saltos).

**Design tokens centralizados — MÉDIO.**
> Sugestão: em vez de cores Tailwind hardcoded (`bg-blue-600`) espalhadas por componentes, definir tokens semânticos no `tailwind.config` (`primary`, `danger`, `surface`) e documentar em `05-conventions` ou novo módulo de design system.

**URL como fonte de verdade para filtros — MÉDIO.**
> Sugestão: em `13-routes` ou `06-patterns`, exemplo de sincronizar filtros de listagem com `useSearchParams` do React Router, para que refresh/partilha de link preserve o estado de UI.

**Sincronização de logout entre tabs — BAIXO.**
> Sugestão: nota em `08-auth` — ouvir evento `storage` (`window.addEventListener('storage', ...)`) para propagar logout entre tabs quando o cookie de sessão expira, já que o access token em memória não é partilhado entre tabs por natureza (isto reforça, e não enfraquece, a decisão de não usar localStorage).

---

## Eixo 4 — Consistência Arquitetural

| Item | Estado | Evidência |
|------|--------|-----------|
| Page → Hook → Transporter sem exceções ad-hoc | **Coberto** | `01-architecture` — tabela de responsabilidades clara, dependências permitidas explícitas (`06-patterns` segue à risca) |
| Fronteiras Atomic Design (Components/Containers) | **Parcial** | `02-folder-structure` distingue `UI/components` de `UI/containers`, mas não tem a subdivisão atoms/molecules/organisms do sistema RN (`07-components`) — mistura tudo em "components", sem critério explícito de quando um componente "sobe" de categoria |
| TypeScript strict | **Parcial** | `14-types` proíbe `any` e usa `interface`/`type` corretamente, mas **não mostra o `tsconfig.json`** (ao contrário do RN `11-types` que lista `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc. explicitamente) — fica implícito, não verificável |
| Zod nas fronteiras | **Parcial** | Forte em forms (`10-forms`), ausente em respostas de API (ver Eixo 1) |
| Error Boundaries | **Coberto** (com ressalva) | `11-error-handling` tem `ErrorBoundary` no root; ressalva: `DefaultErrorFallback` não integra logging real (só `console.error` com comentário "enviar para Sentry" não implementado) |
| Consistência de pastas/nomenclatura | **Coberto** | `02-folder-structure` + `05-conventions` — nomenclatura de ficheiros, exports nomeados, ordem de imports, tudo consistente e sem contradições internas |
| `react-master.md` vs módulos — deriva de conteúdo | **Parcial** | O monolito `react-master.md` (v1.0) não inclui `17-security`, `18-websockets`, `19-solid`, `21-react-auth-page` — confirma que estes 4 módulos foram adicionados depois só ao sistema modular, nunca sincronizados de volta ao master. Risco: quem usa `react-master.md` como fonte única (nota em `00-meta` sugere isto como opção) nunca vê estes 4 módulos |
| SOLID aplicado a hooks/services | **Parcial** | `19-solid` (órfão, não indexado) aplica SOLID a **FastAPI/Python backend** (Routers/Services/Repositories/SQLAlchemy), não a React/frontend — completamente desalinhado do resto do sistema, que é 100% frontend. É o único módulo do sistema que não fala de React |
| Toast auto-dismiss — memory leak potencial | **Parcial** | `11-error-handling` `ToastProvider` usa `setTimeout` para remover toast automaticamente sem `clearTimeout` no cleanup — se o componente desmontar antes do timeout, tentativa de `setState` em componente desmontado |

### Gaps e sugestões — Eixo 4

**`19-solid` desalinhado (backend Python em sistema frontend React) — ALTO.**
> `19-solid/SKILL.md` aplica SRP/OCP/LSP/ISP/DIP a "Routers/Services/Repositories" FastAPI com SQLAlchemy/Pydantic — zero relação com o resto do sistema (Pages/Hooks/Transporters React). Parece ter sido copiado de outro sistema (provavelmente um sistema de backend) sem adaptação.
> Sugestão: reescrever `19-solid` aplicando os mesmos 5 princípios às camadas reais deste sistema — ex.: SRP em Hooks (1 hook = 1 responsabilidade, já é regra em `03-domain-structure`), DIP via injeção de `transporter` mockável em testes (`16-tests` já faz isto implicitamente com `vi.mock`), ISP em Types/interfaces pequenas por domínio. Depois indexar o módulo em `README.md`.

**Toast sem cleanup de timeout — MÉDIO.**
> Sugestão em `11-error-handling`:
> ```typescript
> useEffect(() => {
>   const timer = setTimeout(() => remove(id), duration);
>   return () => clearTimeout(timer); // cleanup se desmontar antes
> }, [id, duration]);
> ```

**`react-master.md` desatualizado face aos módulos — BAIXO.**
> Sugestão: ou (a) sincronizar `react-master.md` com os 4 módulos órfãos, ou (b) marcar explicitamente no topo do ficheiro que é uma baseline v1.0 congelada e que o sistema modular é a fonte de verdade atual — para não induzir em erro quem o usa isoladamente.

**Error logging não implementado — MÉDIO.**
> Sugestão em `11-error-handling`: substituir o comentário "enviar para Sentry" por um exemplo mínimo real (`Sentry.captureException(error, { extra: errorInfo })`), mesmo que simplificado, para não deixar a integração como promessa vazia.

---

## Matriz de Priorização

| Prioridade | Item | Eixo |
|-----------|------|------|
| **Crítico** | Contradição localStorage vs memória (`21-react-auth-page` vs `20-rules`/`08-auth`) | 1 — Segurança |
| **Crítico** | Índice quebrado — `17-rules` inexistente, 4 módulos órfãos não indexados | Estrutural (afeta 1-4) |
| **Crítico** | Ausência total de módulo de Performance dedicado | 2 — Performance |
| **Alto** | Falta aviso "RBAC é só UX, backend valida sempre" | 1 — Segurança |
| **Alto** | Vulnerable Components — sem módulo CI/Quality, sem audit de dependências indexado | 1 — Segurança |
| **Alto** | Zod não valida respostas de API, só forms | 1 — Segurança / 4 — Arquitetura |
| **Alto** | Confirmação destrutiva + undo ausentes | 3 — Design |
| **Alto** | WCAG 2.2 AA / navegação por teclado ausente | 3 — Design |
| **Alto** | `19-solid` desalinhado (backend Python em sistema React) | 4 — Arquitetura |
| **Médio** | `17-security` genérico, duplica sec-audit-agent sem adaptação React | 1 — Segurança |
| **Médio** | Design tokens centralizados ausentes (cores hardcoded Tailwind) | 3 — Design |
| **Médio** | URL como fonte de verdade para filtros/paginação | 3 — Design |
| **Médio** | Toast sem cleanup de `setTimeout` | 4 — Arquitetura |
| **Médio** | Error logging (Sentry) não implementado, só comentado | 4 — Arquitetura |
| **Baixo** | Sincronização de logout entre tabs | 3 — Design |
| **Baixo** | `react-master.md` desatualizado face aos módulos | 4 — Arquitetura |

---

## Top 5 Ações Recomendadas

1. **Corrigir o índice e a contradição de auth** — atualizar `README.md`/`USAGE_GUIDE.md`/`00-meta` (referência `17-rules`→`20-rules` + indexar os 4 módulos órfãos) **e** reescrever `21-react-auth-page` para usar o padrão de token em memória de `08-auth`, removendo `localStorage`. Estas duas correções são pré-requisito para todas as outras — sem elas, parte do sistema é invisível ou contraditória.

2. **Criar módulo `22-performance`** — Core Web Vitals, `QueryClient` com `defaultOptions` explícito, `memo`/`useCallback` (tabela custo/benefício), otimização de imagens, virtualização de listas, bundle analysis. Este é o maior vazio de cobertura do sistema.

3. **Criar módulo `23-accessibility`** — WCAG 2.2 AA, navegação por teclado, focus management, contraste, `aria-*`. Paralelo direto ao `37-accessibility` já validado no sistema RN.

4. **Adicionar confirmação destrutiva + validação Zod em respostas de API** — em `06-patterns` (Transporter Pattern com `schema.parse`) e `11-error-handling`/novo bloco (confirmação antes de `delete`/`remove`).

5. **Reescrever `19-solid` para React** (está em FastAPI/Python, desalinhado com o resto do sistema) e **criar módulo `22-ci-quality`** (ESLint/Husky/`npm audit`/Dependabot) — atualmente esta cobertura só existe, de forma não-específica, dentro do `17-security` não indexado.

---

## Nota final

Comparado ao sistema React Native (auditado e corrigido nesta mesma sessão, agora v1.5 com 38 módulos sem gaps de prioridade Média ou superior), o sistema React Web está numa fase mais precoce de maturidade: a arquitetura core (Page→Hook→Transporter, tipagem, convenções) é sólida e consistente, mas os eixos de Performance e Acessibilidade estão essencialmente por construir, e existem 3 problemas de "higiene do sistema" (índice quebrado, módulo SOLID desalinhado, contradição de auth) que sugerem que módulos foram adicionados ao longo do tempo sem revisão de coerência com o conjunto. Nenhum destes problemas é difícil de corrigir individualmente — a Ação 1 (índice + contradição de auth) devia ser tratada primeiro por ser a mais barata e mais crítica.
