# Auditoria Rigorosa — 11 Eixos (react-enterprise-modula)

> **Auditor:** arquitetura frontend web — segurança (OWASP/ASVS, cruzado com `sec-audit-agent`), performance (CWV), usabilidade (NN/g), arquitetura (Page→Hook→Transporter), testes, CI/CD, observabilidade, resiliência, forms, i18n/RGPD, meta-qualidade
> **Data:** 2026-07-02 · **Versão auditada:** sistema modular pós-correções de 2026-07-01 (25 módulos, `00`–`24`, + `react-master.md` baseline congelada)
> **Metodologia:** leitura integral de todos os `SKILL.md`, `react-master.md`, `README.md`, `USAGE_GUIDE.md` e da auditoria anterior (`AUDITORIA-4-EIXOS.md`). Evidência citada por módulo/§secção. Eixo 1 cruzado com `sec-audit-agent` (CWE/CVSS) — critérios não duplicados.
> **Escala:** `Coberto` (regra concreta e acionável, com código) · `Parcial` (mencionado sem profundidade, ou coberto com lacuna específica) · `Ausente`.

## Estado face à auditoria anterior

Dos 16 achados da `AUDITORIA-4-EIXOS.md` (2026-07-01), **13 foram resolvidos** e verificados nesta leitura: índice corrigido e módulos indexados; `21-react-auth-page` reescrito (token em memória, sem localStorage); `19-solid` reescrito para React; módulos `22-performance`, `23-accessibility`, `24-ci-quality` criados; Zod nas respostas de API (`06-patterns` §Transporter); aviso "RBAC é só UX" (`08-auth` §Regras); `ConfirmDialog`; filtros na URL (`07`); multi-tab (`08-auth` BroadcastChannel); toast com cleanup (`11`); Sentry no ErrorBoundary (`11`); `react-master.md` marcado como baseline congelada. **Não resolvidos** (reaparecem abaixo): critério Atomic Design (Eixo 4), `tsconfig.json` strict explícito (Eixo 4), declaração CSR vs SSR (Eixo 2). Esta auditoria não repete o que já está fechado.

---

## Eixo 1 — Segurança (OWASP Top 10 2021 + ASVS SPA)

| Item | Estado | Evidência / O que falta |
|---|---|---|
| A01 Broken Access Control | **Coberto** | `08-auth` §Protected Route + regra explícita "RBAC no frontend é só UX — o backend deve sempre re-validar" (§Regras de Segurança) |
| A02 Cryptographic Failures | **Coberto** | Token em memória (`08-auth`), cookie httpOnly+secure+sameSite, HTTPS forçado com falha de build (`15-env` §Segurança de build) |
| A03 Injection / XSS | **Coberto** (c/ nota) | `17-security` §Adenda React: `dangerouslySetInnerHTML` sem DOMPurify = achado Alto/Crítico. **Nota:** a regra vive só em `17-security`; `20-rules` (o módulo "consultar sempre") não a menciona |
| A05 Security Misconfiguration | **Coberto** | CSP para SPA estática (`17-security` §Adenda), CORS com credentials (`08-auth` §CORS), `VITE_*` = público (`15-env`), sourcemaps off (`15-env`/`22`) |
| A06 Vulnerable Components | **Coberto** | `24-ci-quality`: `npm audit --audit-level=moderate` a falhar build, Dependabot, GitLeaks, branch protection |
| A07 Auth Failures — refresh flow | **Parcial** | `08-auth` interceptor tem guard `_retry` por pedido, mas **sem fila/single-flight**: N pedidos com 401 simultâneos disparam N `POST /auth/refresh` em paralelo (race condition; com refresh token rotativo, o 2.º refresh invalida a sessão). Expiry/rotation só mencionados em `21` (§Notas PHP: 15min/7d) — não como regra do sistema |
| A08 Integrity / SRI | **Coberto** | `17-security` §Adenda SRI (preferir npm+bundle; SRI quando inevitável) |
| CSRF | **Parcial** | Mitigado de facto por `sameSite: 'strict'` + CORS estrito, mas o conceito **nunca é nomeado** — um agente não sabe que essa é a defesa nem quando precisa de token anti-CSRF (ex.: se `sameSite` baixar para `lax`/`none`) |
| Clickjacking | **Coberto** | `17-security` §Adenda: `frame-ancestors` + `X-Frame-Options` fallback por plataforma |
| Zod nas duas fronteiras | **Coberto** | Input: `10-forms`/`zodResolver`. Output: `06-patterns` §Transporter (`schema.parse` obrigatório, nunca `return data`), `14-types` §schemas output, `20-rules` ✅7 |
| Sanitização antes de render / uploads | **Parcial** | DOMPurify coberto; **uploads de ficheiros ausentes** em todo o corpus (sem validação de tipo/tamanho, sem accept/magic bytes) — ver Eixo 9 |
| WebSocket auth | **Parcial** | `18-websockets` tem nota de segurança correta ("token na URL expõe em logs"), mas o **código de referência implementa exatamente o anti-padrão** (`?token=...`) e a alternativa recomendada (auth na 1.ª mensagem) não tem código |

### Sugestões — Eixo 1

**A07 — Fila de refresh (single-flight) — CRÍTICO.** Substituir o interceptor de `08-auth` por versão com promessa partilhada:

```typescript
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  refreshPromise ??= axios
    .post(`${env.apiUrl}/auth/refresh`, {}, { withCredentials: true })
    .then(({ data }) => { setAccessToken(data.accessToken); return data.accessToken as string; })
    .finally(() => { refreshPromise = null; });
  return refreshPromise; // N pedidos 401 simultâneos partilham UM único refresh
};

// no interceptor de resposta:
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  try {
    const token = await refreshAccessToken();
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  } catch { /* session-expired como já está */ }
}
```

Acrescentar a `08-auth` §Regras: "Refresh single-flight — múltiplos 401 simultâneos partilham UMA chamada a `/auth/refresh`; nunca N chamadas paralelas (com rotação de refresh token, a 2.ª invalida a sessão)."

**WebSocket — inverter o default — ALTO.** Em `18-websockets`, tornar a auth por 1.ª mensagem o código principal (`onopen: () => this.send({ type: 'auth', token })`) e o query param o fallback documentado. Corrigir também `process.env.REACT_APP_WS_URL` → `env.wsUrl` (`VITE_WS_URL`) — contradiz `15-env` (ver Eixo 11).

**XSS em `20-rules` — MÉDIO.** Adicionar ❌16: "`dangerouslySetInnerHTML` sem `DOMPurify.sanitize()` imediatamente antes — o único vetor XSS real em JSX (ver `17-security`)."

**CSRF nomeado — MÉDIO.** Nota de 3 linhas em `08-auth`: "A defesa CSRF deste sistema é `sameSite: 'strict'` no cookie de refresh + CORS com origem exata. Se o backend baixar para `sameSite: 'lax'/'none'` (ex.: subdomínios distintos), passa a ser obrigatório token anti-CSRF (double-submit ou header custom)."

---

## Eixo 2 — Performance

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Core Web Vitals com metas | **Coberto** | `22-performance`: LCP<2.5s, INP<200ms, CLS<0.1 + RUM via `web-vitals`/sendBeacon + gate Lighthouse CI |
| Code splitting | **Coberto** (c/ nota) | `13-routes` lazy em todas as rotas. Splitting por feature além de rotas (componentes pesados, ex.: charts) não abordado |
| Re-renders | **Coberto** | `22-performance`: tabela custo/benefício memo/useCallback/useMemo + Zustand com seletores obrigatórios |
| TanStack Query cache | **Coberto** | `22-performance`: `QueryClient` com `defaultOptions` explícitos (staleTime 30s, gcTime 5min, retry 1) |
| Paginação / infinite query | **Parcial** | `useInfiniteQuery` aparece só numa linha de tabela (`07`); zero código, apesar de a virtualização (`22`) assumir listas grandes — o par natural (infinite + virtual) não existe |
| Imagens | **Coberto** (c/ nota) | `22-performance`: dimensões, lazy, AVIF/WebP, fetchPriority. Falta `srcset`/`sizes` para responsive |
| Bundle | **Coberto** | Visualizer, orçamento 250KB gzip, gate CI opcional |
| CSR vs SSR/SSG | **Parcial** | `04-stack` assume Vite (CSR) mas **nunca declara** o contexto nem as implicações (SEO, TTFB, quando Next.js seria adequado). Já flagado na auditoria anterior, não corrigido |
| Debounce/throttle | **Coberto** | `22-performance` §useDebounce com implementação + integração URL (`07`); throttle referido sem código (aceitável) |
| Virtualização | **Coberto** | `@tanstack/react-virtual`, regra ~100 itens |
| Web fonts | **Ausente** | Nenhum módulo cobre `font-display`, preload, self-hosting. Agravante: `21-react-auth-page` carrega Syne+DM Sans **via Google Fonts** sem estratégia — introduz FOIT/CLS e um third-party request precisamente onde o sistema não dá orientação |

### Sugestões — Eixo 2

**Web fonts — MÉDIO.** Secção nova em `22-performance`: "Fontes: self-host (`@fontsource/*` via npm, alinhado com a preferência npm+bundle de `17-security` §SRI); `font-display: swap`; `<link rel="preload" as="font" crossorigin>` para a fonte do texto acima da dobra; `size-adjust`/fallback metrics para eliminar CLS de swap." Corrigir `21-react-auth-page` para usar `@fontsource/syne` + `@fontsource/dm-sans` em vez do CDN Google.

**Infinite query — MÉDIO.** Exemplo em `07-react-query` com `useInfiniteQuery` + `getNextPageParam` ligado ao `PaginatedResponse<T>` de `14-types`, e nota cruzada para a virtualização de `22`.

**CSR declarado — BAIXO.** Parágrafo em `04-stack`: "Este sistema assume SPA/CSR pura (Vite). Implicações: SEO limitado a apps autenticadas (aceitável para back-office), TTFB não crítico, CSP sem nonces dinâmicos. Para conteúdo público indexável, usar Next.js — fora do âmbito destas skills."

---

## Eixo 3 — Design (10 Heurísticas NN/g + web/desktop)

| # | Heurística | Estado | Evidência / O que falta |
|---|---|---|---|
| 1 | Visibilidade do estado | **Coberto** | `12`: 4 estados obrigatórios, Skeleton/Spinner, `isLoading` em botões |
| 2 | Sistema ↔ mundo real | **Parcial** | Mecanismo i18n sólido (`09`); falta orientação de *terminologia*: usar vocabulário do domínio do utilizador nas keys/labels, não jargão técnico ("Guardar alterações" vs "Persistir entidade") |
| 3 | Controlo e liberdade | **Parcial** | Cancelar (ConfirmDialog) e back-button seguro (filtros na URL, `07`) cobertos; **undo ausente** — nenhuma alternativa "desfazer" pós-ação (toast com ação de undo) |
| 4 | Consistência e padrões | **Parcial** | Convenções de código exemplares (`05`); falta a camada de *convenções web de UI*: link (`<a>`, navega) vs botão (`<button>`, age), Enter submete forms, comportamento padrão de selects/dates |
| 5 | Prevenção de erros | **Coberto** | Zod pré-submit (`10`), ConfirmDialog obrigatório (`20-rules` ✅16/❌15), duplo-submit bloqueado (`Button` disabled+isLoading) |
| 6 | Reconhecimento vs memorização | **Parcial** | Nav persistente (`Layout`) e estado na URL cobertos; **breadcrumbs e indicação de item de menu ativo ausentes**; autocomplete não abordado |
| 7 | Flexibilidade e eficiência | **Coberto** | `23`: `useKeyboardShortcut` + painel `?` + bulk actions com ConfirmDialog |
| 8 | Estética e minimalismo | **Parcial** | Design tokens centralizados (`04-stack`) resolvem consistência de cor; sem orientação de hierarquia visual/densidade/whitespace para desktop |
| 9 | Reconhecer/recuperar erros | **Coberto** | `11`: ErrorState+retry, mensagens i18n genéricas ao utilizador, stack trace nunca exposto (fallback + Sentry) |
| 10 | Ajuda e documentação | **Coberto** | `12` EmptyState com `action`/`helpHref`, `06` Tooltip + OnboardingHint |
| — | Responsividade / breakpoints | **Ausente** | Nenhum módulo define breakpoints, mobile-first vs desktop-first, ou usa `sm:`/`md:`/`lg:` nos exemplos (o `Layout` de `13`/`23` com sidebar fixa quebra em mobile e ninguém o diz). Flagado na auditoria anterior, não corrigido |
| — | WCAG 2.2 AA | **Coberto** | `23-accessibility`: contraste verificado, foco, focus trap, aria-live, headings, checklist |
| — | Estados focus/hover/active | **Coberto** | `23` (regra "nunca remover outline") + exemplos `06` |
| — | URL como fonte de verdade | **Coberto** | `07` §Filtros na URL (`useSearchParams`, regra "nunca só useState") |
| — | Multi-tab / sessão | **Coberto** | `08-auth`: BroadcastChannel com fallback Safari documentado |

### Sugestões — Eixo 3

**Breakpoints — ALTO (é o único "Ausente" estrutural do eixo).** Secção em `04-stack` ou `23`: "Desktop-first para back-office (contexto deste sistema), com adaptação obrigatória até 768px: Sidebar colapsa para drawer (`lg:` visível, hamburger abaixo), tabelas passam a cards ou scroll horizontal explícito. Breakpoints = defaults Tailwind (sm 640/md 768/lg 1024/xl 1280); nunca valores arbitrários por componente." Atualizar o `Layout` com o exemplo responsivo.

**Undo — MÉDIO.** Padrão em `11-error-handling`: toast de sucesso pós-delete com ação `{ label: t('common.undo'), onClick }` e janela de N segundos antes de a mutation destrutiva ser irreversível (soft-delete no backend ou delete diferido no client). Alternativa mínima: documentar que ConfirmDialog é a única barreira e undo exige suporte do backend.

**Breadcrumbs/nav ativa — BAIXO.** Exemplo com `NavLink` (`className={({isActive}) => ...}`) em `13-routes` + componente `Breadcrumbs` derivado de `useMatches`.

**Links vs botões — BAIXO.** Regra em `05-conventions`: "Navegação = `<Link>`/`<a>` (funciona com cmd+click, novo separador); ação = `<button>`. Nunca `<div onClick>` nem botão que só navega."

---

## Eixo 4 — Consistência Arquitetural

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Page → Hook → Transporter sem exceções | **Coberto** (1 exceção) | `01` matriz de dependências, `19-solid` reforça. **Exceção não declarada:** `18-websockets` cria `src/hooks/` e `src/contexts/` (plural) fora de `services/hooks`/`context/` — viola `02-folder-structure` sem justificar |
| Atomic Design | **Parcial** | Só `components`/`containers`; sem critério atoms/molecules/organisms nem regra de "promoção" (quando um componente de `pages/X/components/` sobe para `UI/components/`). Flagado na auditoria anterior, não corrigido. Nota: o contexto do projeto declara Atomic Design; o sistema implementa uma simplificação de 2 níveis sem o dizer |
| TypeScript strict verificável | **Parcial** | `no-explicit-any: error` no ESLint (`24`) e regras em `20`/`14`; mas o **`tsconfig.json` nunca é mostrado** — "strict mode" (`04-stack`) fica não verificável (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Flagado na auditoria anterior, não corrigido. `// @ts-ignore`/`@ts-expect-error` nunca são mencionados |
| Zod nas fronteiras | **Coberto** | Ver Eixo 1 |
| Error Boundaries + fallback | **Coberto** | `11`: root + por secção, fallback com reset, Sentry real |
| Pastas/nomenclatura consistentes | **Coberto** (c/ exceção `18`) | `02`+`05` sem contradições entre si |
| Zustand vs TanStack Query vs local | **Parcial** | Tabela de decisão existe (`04-stack` §Quando usar) e `22` cobre seletores; mas Zustand é remetido para um "prompt auxiliar" **que não existe no corpus** — o critério fino (o que é "estado complexo partilhado"? porque nunca dados de servidor em Zustand?) não está escrito em lado nenhum carregável |

### Sugestões — Eixo 4

**tsconfig explícito — ALTO (barato e fecha um gap de 2 auditorias).** Bloco em `14-types` ou `04-stack`:

```jsonc
// tsconfig.json — flags obrigatórias
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

Mais regra em `20-rules` ❌: "`@ts-ignore` proibido; `@ts-expect-error` só com comentário a justificar na mesma linha."

**Módulo/secção Zustand — MÉDIO.** Ou criar `25-zustand` ou secção em `04-stack`: "Zustand só para estado de cliente partilhado entre páginas que não é derivável do servidor (ex.: seleção multi-página, preferências de UI). Nunca cache de API (isso é TanStack Query — server state ≠ client state). Store por fatia, sempre com seletor (`22`)." Remover a referência ao "prompt auxiliar" fantasma.

**Critério de promoção de componentes — MÉDIO.** Em `02-folder-structure`: "Componente usado por 1 página → `pages/X/components/`. Usado por ≥2 páginas → `UI/components/`. `UI/containers/` = layout/composição sem lógica. (Mapeamento Atomic: components ≈ atoms/molecules; containers ≈ templates; pages ≈ pages — este sistema usa deliberadamente 2 níveis.)"

**Normalizar `18-websockets` — ver Eixo 11 (Crítico).**

---

## Eixo 5 — Testes e Qualidade

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Unit: Vitest + RTL | **Coberto** | `16-tests`: setup, exemplos de component e hook com wrapper de QueryClient |
| Queries por acessibilidade | **Parcial** | Exemplos misturam `getByText` e `getByRole`; **não existe regra** "preferir getByRole/getByLabelText; testId só como último recurso" — apesar de `23` dar toda a base semântica para isso funcionar |
| E2E (Playwright/Cypress) | **Ausente** | Zero menções em todo o corpus. Sem fluxos críticos definidos (login+refresh, CRUD principal) |
| MSW para transporters | **Ausente** (escolha divergente) | `16-tests` mocka o módulo (`vi.mock('@/services/transporters/users')`) e `19-solid` §DIP defende-o. Válido para unit de hooks, mas deixa o próprio transporter (interceptors, `schema.parse`, tratamento 401) **sem estratégia de teste** — é precisamente a camada onde vive o risco (refresh race, Zod) |
| Cobertura mínima | **Ausente** | CI corre `--coverage` (`24`) mas nenhum threshold definido — a métrica é recolhida e ignorada |
| Testes a11y automatizados | **Ausente** | Sem axe-core/jest-axe/@axe-core/playwright, apesar do checklist manual de `23` |
| Regressão visual | **Ausente** (opcional) | Aceitável omitir; nota de 1 linha bastaria |

### Sugestões — Eixo 5

**Camada de integração com MSW — ALTO.** Secção em `16-tests`: "Dois níveis de mock: (1) unit de hooks → `vi.mock` do transporter (rápido, já documentado); (2) integração de Pages e testes do próprio transporter → MSW (`setupServer` + handlers por endpoint), porque interceta a rede e exercita interceptors + `schema.parse` reais." Incluir handler de exemplo e um teste do fluxo 401→refresh→retry (que hoje ninguém consegue testar — cruza com o Crítico do Eixo 1).

**E2E — ALTO.** Novo módulo `25-e2e` (ou secção em `16`): Playwright, fluxos mínimos obrigatórios = login→dashboard, CRUD do domínio principal, expiração de sessão; correr em CI no build de preview; `@axe-core/playwright` nas páginas principais (fecha também o gap de a11y automatizada).

**Threshold de cobertura — MÉDIO.** Em `16-tests`+`24`: `coverage.thresholds { lines: 80, branches: 70 }` no `vitest.config`, aplicado a `services/**` e `utils/**` (as camadas puras); UI medida mas sem gate.

**Regra de queries RTL — BAIXO.** Tabela de prioridade em `16-tests`: `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (último recurso, nunca para elementos interativos).

---

## Eixo 6 — Build, Deploy e CI/CD

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Tooling/build documentado | **Parcial** | Snippets dispersos (`22` visualizer/sourcemap, `15` env); sem `vite.config.ts` consolidado de referência |
| Env sem secrets no bundle | **Coberto** | `15-env`: "`VITE_` não significa seguro, significa público" — exatamente o aviso pedido |
| Source maps | **Parcial** | `sourcemap: false` coberto (`15`/`22`); mas o passo complementar — **gerar hidden sourcemaps e enviá-los só para a ferramenta de monitorização** — está ausente. Sem isto, o Sentry de `11` recebe stack traces minificados ilegíveis (contradição prática entre módulos) |
| Cache busting / cache headers | **Ausente** | Vite faz hashing por defeito mas nada documenta a estratégia de headers: `index.html` no-cache vs assets `immutable` — o erro clássico de SPA (utilizadores presos numa versão antiga) não é prevenido |
| CI obrigatório pré-merge | **Coberto** | `24`: lint+typecheck+test+build+audit+gitleaks e branch protection ("sem gate, o CI é decorativo") |
| Preview deployments | **Ausente** | Não mencionado |
| Rollback / feature flags | **Ausente** | Não mencionado em módulo algum |
| Auditoria de dependências | **Coberto** | `24`: npm audit em CI + Dependabot semanal |

### Sugestões — Eixo 6

**Sourcemaps para monitorização — ALTO (fecha a contradição com `11`).** Em `22-performance` ou `24`:

```typescript
// vite.config.ts
build: { sourcemap: 'hidden' }, // gera .map sem referência no bundle
// CI (após build): upload para o Sentry e apagar antes do deploy
// npx sentry-cli sourcemaps upload dist/ --release $SHA && rm dist/**/*.map
```

Regra: "`hidden` + upload + delete — nunca `true` (expõe fonte) nem `false` cego (Sentry ilegível)."

**Cache headers — MÉDIO.** Em `15-env` ou `24`: "`/assets/*` (com hash) → `Cache-Control: public, max-age=31536000, immutable`; `index.html` → `no-cache`. Sem isto, deploys não chegam aos utilizadores ou assets recarregam sempre." Exemplo `vercel.json`/nginx.

**Rollback/flags — MÉDIO.** Nota em `24`: releases arriscados atrás de flag (`15-env` já tem o padrão `VITE_ENABLE_*` para flags de build; para flags runtime, endpoint de config); rollback = redeploy do artefacto anterior (imutável, guardado por N versões).

**Preview deploys — BAIXO.** Uma linha em `24` §Gate de PR: preview por PR (Vercel/Netlify) como status check quando a plataforma o suportar.

---

## Eixo 7 — Observabilidade e Resiliência

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Error tracking | **Parcial** | `Sentry.captureException` no ErrorBoundary (`11`) — mas sem `Sentry.init` (DSN via env, environment, release para ligar aos sourcemaps), e ver gap de sourcemaps no Eixo 6 |
| Error Boundary + report | **Coberto** | `11`: fallback + captura real, regra "nunca só console.error" |
| RUM (CWV em produção) | **Coberto** | `22`: web-vitals + sendBeacon, "não só Lighthouse" |
| Logging sem dados pessoais | **Ausente** | Nenhuma orientação de scrubbing de PII em erros/logs (o `extra` enviado ao Sentry pode conter emails/tokens de um payload de request). RGPD exposto |
| Analytics com consentimento | **Ausente** | `15-env` tem `VITE_ENABLE_ANALYTICS` (flag de build) mas zero sobre consentimento do utilizador ou separação telemetria técnica vs analytics de produto — ver Eixo 10 |

### Sugestões — Eixo 7

**Sentry init + scrubbing — ALTO.** Em `11-error-handling`:

```typescript
// main.tsx
Sentry.init({
  dsn: env.sentryDsn,            // VITE_SENTRY_DSN (público por natureza — DSN não é secret)
  environment: env.appEnv,
  release: env.appVersion,        // liga aos sourcemaps do CI (ver 24)
  sendDefaultPii: false,
  beforeSend(event) {
    // nunca enviar headers Authorization, cookies, ou body de requests
    delete event.request?.headers; delete event.request?.cookies;
    return event;
  },
});
```

Regra: "Telemetria técnica (Sentry, web-vitals) é interesse legítimo e corre sem consentimento, **desde que** sem PII (beforeSend obrigatório). Analytics de produto exige consentimento prévio (Eixo 10)."

---

## Eixo 8 — Resiliência de Rede e Estado

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Timeouts no Axios | **Ausente** | `axios.create` (`08-auth`) sem `timeout` — um backend pendurado dá spinner infinito (o anti-padrão que o eixo proíbe) |
| Retry com backoff | **Parcial** | TanStack Query `retry: 1` (`22`); sem backoff configurado nem critério de quais erros repetir (repetir um 400 é inútil; um 503 merece backoff) |
| Estados erro/loading/empty em todas as queries | **Coberto** | `12`: 4 estados obrigatórios + `20-rules` ✅6 |
| Fila no refresh do JWT | **Ausente** | Ver Eixo 1 A07 — é o gap técnico mais grave do corpus |
| Optimistic updates — critério | **Ausente** | Nunca mencionado; `06`/`07` usam sempre invalidate-after-success sem discutir quando o otimista se justifica |
| Sessão expirada graciosa | **Parcial** | Evento `auth:session-expired` → redirect `/login` com `state.from` (volta ao sítio). Mas **trabalho perde-se**: um form a meio morre no redirect; sem draft |
| Offline / rede lenta | **Ausente** | Sem deteção `navigator.onLine`/evento `offline`, sem mensagem dedicada de rede (o `errors.network` de `09` existe mas nada o dispara), sem tratamento de rede lenta |

### Sugestões — Eixo 8

**Timeout + classificação de erros — CRÍTICO (com o refresh, é o par que fecha o eixo).** Em `08-auth`/`11`:

```typescript
const api = axios.create({ baseURL: env.apiUrl, withCredentials: true, timeout: 15_000 });

// TanStack Query — retry só para erros transitórios, com backoff
queries: {
  retry: (failureCount, error) => {
    const status = (error as AxiosError).response?.status;
    if (status && status >= 400 && status < 500) return false; // 4xx nunca
    return failureCount < 2;                                    // rede/5xx: 2 tentativas
  },
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000), // backoff exponencial
}
```

**Optimistic updates — MÉDIO.** Critério em `07-react-query`: "Otimista só quando (1) a taxa de sucesso é ~100% (toggles, reordenar), (2) o rollback é trivial (`onError` repõe snapshot de `onMutate`), e (3) o utilizador beneficia de resposta instantânea. CRUD normal mantém invalidate-after-success." Incluir o exemplo canónico `onMutate`/`onError`/`onSettled`.

**Draft de formulário em sessão expirada — MÉDIO.** Em `10-forms`: guardar `getValues()` em `sessionStorage` ao apanhar `auth:session-expired` (dados de form não são token — não viola `20-rules` ❌1, tal como o precedente do `OnboardingHint` em `06`; excluir campos sensíveis como passwords) e reidratar via `defaultValues` no regresso.

**Offline — MÉDIO.** Hook `useOnlineStatus` (eventos `online`/`offline`) em `services/hooks/common/` + banner global; mapear `AxiosError` sem `response` → `t('errors.network')` no `11`.

---

## Eixo 9 — Formulários e Interação com Dados

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Biblioteca padronizada | **Coberto** | RHF + Zod + resolver (`10`, `04-stack`) |
| Confiança zero no client | **Parcial** | `08-auth` di-lo para *permissões*; `10-forms` **não diz explicitamente** que o backend revalida sempre os *dados* — a validação Zod client-side pode ser lida como suficiente |
| Estados de submissão | **Coberto** | `isLoading`→disabled no `Button`, toasts de sucesso/erro, duplo-submit bloqueado |
| Acessibilidade de forms | **Coberto** (c/ nota) | `htmlFor`/`useId`, `aria-invalid`, `aria-describedby`, `role="alert"` (`10`/`23`). **Foco no primeiro erro:** o RHF fá-lo por defeito (`shouldFocusError`) mas o corpus nunca o afirma — comportamento crítico a depender de um default não documentado |
| Uploads | **Ausente** | Zero cobertura: sem validação de tipo/tamanho client-side, sem progresso, sem accept, sem integração com o padrão Transporter (multipart) |
| Erros de servidor → campos | **Ausente** (item implícito do eixo) | Um 422 do Laravel/FastAPI com erros por campo não tem padrão de mapeamento para `setError` do RHF — o utilizador recebe só o toast genérico |

### Sugestões — Eixo 9

**Uploads — ALTO.** Secção em `10-forms`:

```typescript
const fileSchema = z.instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, 'validation.fileTooLarge')
  .refine((f) => ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type), 'validation.fileType');

// Transporter: multipart + progresso
upload: async (file: File, onProgress: (pct: number) => void) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/files', form, {
    onUploadProgress: (e) => onProgress(Math.round((e.loaded / (e.total ?? 1)) * 100)),
  });
  return fileResponseSchema.parse(data);
},
```

Regras: `accept` no input espelha o schema; MIME do client é indicativo — **o backend revalida por magic bytes** (confiança zero); progresso visível acima de ~1s.

**Erros 422 → campos — ALTO.** Padrão em `10-forms`/`11`: parse do corpo de erro (`{ errors: { email: ['já existe'] } }` Laravel / `detail[]` FastAPI) → `setError(field, { message })` + foco no primeiro; toast genérico só quando não há mapeamento de campo. (Adicionar aos itens de contrato cruzado — secção final.)

**Frase de confiança zero — BAIXO (1 linha, alto valor).** Em `10-forms` §Regras: "A validação Zod no client é UX, não segurança — o backend revalida **sempre** todos os dados (o schema client-side é trivialmente contornável via curl)."

---

## Eixo 10 — Internacionalização e Privacidade (RGPD)

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Strings externalizadas, PT base | **Coberto** | `09`: i18next, `fallbackLng: 'pt'`, regra "sem hardcoded" (`20-rules` ✅5/❌4) |
| Plurais | **Parcial** | Interpolação `{{count}}` coberta; o sistema de plurais do i18next (`key_one`/`key_other`) nunca é mostrado — "Mínimo {{count}} caracteres" funciona, mas "1 resultados" vai acontecer |
| Formatos data/moeda (Intl) | **Ausente** | `utils/formatters/` existe só como nome de pasta (`02`); zero código `Intl.DateTimeFormat`/`NumberFormat` por locale — datas/moedas vão ser formatadas ad-hoc |
| Consentimento antes de analytics | **Ausente** | Nada em todo o corpus: sem banner, sem recusa real, sem gate de scripts de tracking ao consentimento |
| Minimização / retenção de storage | **Ausente** | Usos de `localStorage` existem (i18n cache, OnboardingHint) e são legítimos, mas não há política: o que pode viver em storage, por quanto tempo, limpeza no logout |
| Cookies: classificação/flags | **Parcial** | Flags do cookie de auth impecáveis (`08`); classificação essenciais vs não essenciais e a ligação ao consentimento: ausentes |

### Sugestões — Eixo 10

**Módulo `25-privacy` (ou secção RGPD em `09`) — ALTO.** Conteúdo mínimo: (1) `ConsentContext` com estado `necessary | analytics | marketing` persistido em `localStorage` (o consentimento em si é dado "necessário"), recusa tão fácil como aceitação, sem cookie walls; (2) analytics só carrega após opt-in (`if (consent.analytics) initAnalytics()` — liga ao `VITE_ENABLE_ANALYTICS` de `15`); (3) tabela de classificação: cookie de refresh = essencial (sem consentimento, com fundamentação), analytics/marketing = opt-in; (4) política de storage: inventário do que o sistema escreve (i18n lang, hints, drafts), regra "nunca PII em localStorage", limpeza no logout (`authChannel` já propaga — acrescentar `localStorage.removeItem` das keys de sessão); (5) telemetria técnica sem PII = interesse legítimo (cruza com Eixo 7).

**Intl formatters — MÉDIO.** Implementar `utils/formatters/date.ts`/`currency.ts` de referência:

```typescript
export const formatDate = (iso: string, locale = i18n.language) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
export const formatCurrency = (value: number, locale = i18n.language, currency = 'EUR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
```

Regra em `09`: "Datas/números/moeda **nunca** em strings de tradução — sempre Intl com o locale ativo."

**Plurais — BAIXO.** Exemplo `results_one`/`results_other` em `09` §Estrutura JSON.

---

## Eixo 11 — Meta-qualidade da Skill

| Item | Estado | Evidência / O que falta |
|---|---|---|
| Regras acionáveis vs vagas | **Coberto** | Padrão consistente: regra + porquê + código ❌/✅ (ex.: `22` §Zustand, `23` §foco). Quase nada é "usar boas práticas" |
| Exemplos corretos e atuais | **Coberto** (c/ exceções) | React 19, RQ v5 (`isPending`, `gcTime`), ESLint 9 flat config. Exceções: ver contradições abaixo; micro-bug em `10-forms` §3 (usa `t()` sem `useTranslation` no snippet `CreateUser`) |
| Anti-padrões explícitos | **Coberto** | `20-rules` ❌1–15 + ❌/✅ nos módulos; alguns ❌ do `20` são tersos mas o "porquê" vive no módulo referenciado |
| Checklists auto-validáveis | **Coberto** | `20` (implementação/domínio/page/component), `23` (a11y), `21` (entrega) |
| Contradições internas | **Parcial** | **`18-websockets` é o módulo desviante:** (a) `process.env.REACT_APP_WS_URL` — CRA, contradiz `15-env` (`import.meta.env.VITE_*`); (b) pastas `src/hooks/`+`src/contexts/` — contradiz `02` (`services/hooks/`, `context/` singular; erro análogo ao que `21` §5 corrige noutro contexto); (c) `useAuth()` a devolver `accessToken` — o `AuthContext` de `08` **não expõe** o token (e bem); teria de usar `getAccessToken()` de `lib/axios`; (d) código default com token na URL vs a própria nota de segurança. Menor: paleta fixa de `21` (`#6c5ce7`) vs design tokens de `04` (`#2563eb`) sem nota de reconciliação; `21` valida password ≥8 no registo enquanto `14-types` `loginSchema` usa `min(1)` (correto para login, mas a regra de força de password não existe como schema partilhado) |
| Encontrabilidade | **Coberto** | Índice por categoria + grafo de dependências (`README`), tags/depends nos headers, `00-meta` com mapa tarefa→módulos |
| Coerência cross-stack (RN/FastAPI) | **Não verificável** | Não existem skills React Native nem FastAPI nesta pasta — ver secção final |

### Sugestões — Eixo 11

**Normalizar `18-websockets` — CRÍTICO (4 contradições no mesmo módulo).** Reescrever: `env.wsUrl` (`VITE_WS_URL` adicionado a `15-env`), `context/SocketContext.tsx` + `services/hooks/{socket}/`, token obtido via `getAccessToken()` no momento do connect (nunca exposto pelo AuthContext), auth por 1.ª mensagem como default (Eixo 1). Acrescentar reconexão com backoff exponencial + jitter (o atual é intervalo fixo) e re-auth no reconnect.

**Reconciliar `21` com os design tokens — BAIXO.** Nota em `21` §Decisões de design: "A paleta indicada é o default standalone; num projeto com `04-stack` aplicado, mapear para os tokens (`primary`, `danger`, `success`) em vez de hex fixos."

**Corrigir o micro-bug de `10-forms` — BAIXO.** Adicionar `const { t } = useTranslation();` ao snippet `CreateUser`.

---

## Priorização por risco/impacto

| Prioridade | Item | Eixo(s) |
|---|---|---|
| **Crítico** | Refresh JWT sem fila/single-flight (race condition com 401 simultâneos) | 1, 8 |
| **Crítico** | `18-websockets` desviante: env CRA, pastas fora do padrão, `accessToken` exposto, token na URL como default | 11, 1, 4 |
| **Alto** | Sem timeout no Axios + retry sem classificação de erro/backoff (spinners infinitos) | 8 |
| **Alto** | Eixo de testes incompleto: sem E2E, sem MSW (transporter/interceptors não testáveis), sem threshold de cobertura, sem jest-axe | 5 |
| **Alto** | RGPD: sem consentimento para analytics, sem política de storage, sem scrubbing de PII no Sentry | 10, 7 |
| **Alto** | Uploads ausentes + erros 422→campos ausentes | 9 |
| **Alto** | Sourcemaps: `false` cego contradiz Sentry (stack traces ilegíveis) — falta `hidden`+upload | 6, 7 |
| **Alto** | Responsividade/breakpoints ausentes (Layout quebra em mobile sem aviso) | 3 |
| **Médio** | `tsconfig.json` strict nunca mostrado; `@ts-expect-error` sem regra (pendente de 2 auditorias) | 4 |
| **Médio** | Web fonts sem estratégia (e `21` carrega Google Fonts via CDN) | 2 |
| **Médio** | Optimistic updates sem critério; draft em sessão expirada; deteção offline | 8 |
| **Médio** | Cache headers de SPA; rollback/feature flags | 6 |
| **Médio** | Critério Zustand incompleto (aponta para "prompt auxiliar" inexistente); critério de promoção de componentes | 4 |
| **Médio** | Intl (datas/moeda) ausente; undo pós-ação; XSS/CSRF não referidos em `20-rules`/`08-auth` | 10, 3, 1 |
| **Baixo** | Infinite query sem exemplo; `srcset`; plurais i18next; NavLink/breadcrumbs; links vs botões; CSR declarado; paleta de `21`; bug `t()` em `10`; preview deploys; regressão visual | vários |

---

## Top 5 ações a fazer primeiro

1. **Fila de refresh no interceptor (`08-auth`)** — é o único defeito com potencial de partir sessões em produção de forma intermitente e difícil de diagnosticar. Código pronto acima (Eixo 1). Meio dia, incluindo o teste MSW do fluxo 401→refresh→retry.
2. **Reescrever `18-websockets`** — 4 contradições com `02`/`08`/`15` no mesmo módulo tornam-no o único sítio onde um agente gera código fora do sistema. Normalizar env/pastas/token e inverter o default de auth (Eixo 11 + 1).
3. **Resiliência de rede mínima (`08`/`11`/`22`)** — `timeout: 15s` no Axios, retry com classificação 4xx/5xx + backoff, mapeamento de erro de rede para `errors.network`. Três blocos pequenos, elimina a classe inteira de spinners infinitos (Eixo 8).
4. **Completar o eixo de testes (`16`/`24`)** — MSW como segundo nível de mock, módulo E2E Playwright com 3 fluxos críticos + `@axe-core/playwright`, thresholds de cobertura no CI. É o eixo com mais `Ausente` de todos (Eixo 5).
5. **Módulo `25-privacy` (RGPD) + Sentry completo** — consentimento a gatear analytics, política de storage com limpeza no logout, `Sentry.init` com `beforeSend` sem PII e sourcemaps `hidden`+upload no CI (Eixos 10, 7, 6). Para software vendido na UE isto é requisito legal, não polish.

---

## Verificação cruzada — regras que devem ser idênticas entre stacks (React Web ↔ React Native ↔ FastAPI/Laravel)

**Limitação:** as skills React Native e FastAPI não estão nesta pasta — a coerência não foi verificável nesta sessão (a `AUDITORIA-4-EIXOS.md` referencia um sistema RN com `13-auth`, `26-performance`, `32-sec-audit`, `33-ci-quality`, mas os ficheiros não estão acessíveis aqui). A lista abaixo é o contrato que deve ser auditado quando esses corpora estiverem disponíveis, com o valor canónico definido pelo sistema web atual:

| # | Contrato | Valor canónico (este sistema) | Verificar em RN / FastAPI |
|---|---|---|---|
| 1 | Armazenamento de tokens | Access em memória; refresh em cookie httpOnly+secure+sameSite strict (`08-auth`) | RN não tem cookies httpOnly → o equivalente é Keychain/EncryptedStorage (nunca AsyncStorage plano); FastAPI emite o cookie com as mesmas flags |
| 2 | Contrato JWT | HS256, access 15min, refresh 7d, endpoints `POST /auth/{login,register,forgot,refresh,logout}` (`21` §Notas backend) | Mesmos TTLs/algoritmo/paths nos 3 corpora; rotação de refresh token declarada dos dois lados |
| 3 | Refresh single-flight | A adicionar (Crítico #1) | O mesmo padrão de fila é obrigatório no cliente RN; FastAPI deve tolerar 1 retry de refresh (grace period na rotação) |
| 4 | CORS com credentials | Origem exata, `Allow-Credentials: true`, preflight sem auth — snippets Laravel e FastAPI já em `08-auth` §CORS ✅ | Confirmar que a skill FastAPI usa exatamente o snippet de `08-auth` (única fonte) |
| 5 | Schemas de validação | Zod nas duas fronteiras (input forms + output API), mensagens como keys i18n (`14`/`10`) | Zod (RN) e Pydantic (FastAPI) espelham os mesmos campos/constraints; regra de força de password única e partilhada (hoje nem o web a tem como schema — ver Eixo 11) |
| 6 | Formato de erro da API | `ApiError { message, code?, statusCode }` (`14-types`) | FastAPI devolve `detail[]` por defeito — **divergência provável**: definir envelope comum ou documentar o mapeamento 422→`setError` (Eixo 9) nos dois clients |
| 7 | Sessão expirada | Evento `auth:session-expired` → limpar estado → login (`08`) | Mesmo nome de evento/semântica no RN; FastAPI responde 401 (nunca 403) para token expirado, para o interceptor distinguir de falta de permissão |
| 8 | WebSocket auth | Auth por 1.ª mensagem pós-handshake (após correção do Crítico #2) | Backend (Laravel/FastAPI) tem de aceitar esse handshake — hoje `18` assume query param; alinhar os dois lados na mesma correção |
| 9 | Telemetria/PII | `beforeSend` sem headers/cookies/PII; analytics só com consentimento (a criar — Top 5 #5) | Mesma política de scrubbing no RN (Sentry RN) e no backend (logs estruturados sem PII) |

---

## Nota final

O sistema está num estado substancialmente melhor do que há um dia: a arquitetura core, a segurança de auth, a acessibilidade e o pipeline de CI estão entre `Coberto` quase por inteiro, e as correções da auditoria anterior foram aplicadas com qualidade (não cosmética — o `19-solid` reescrito e o `schema.parse` nos transporters são exemplares). Os gaps remanescentes concentram-se em três famílias: **resiliência de runtime** (refresh race, timeouts, offline — Eixos 1/8), **verificação automatizada** (E2E, MSW, cobertura — Eixo 5) e **privacidade/observabilidade de produção** (RGPD, PII, sourcemaps — Eixos 6/7/10), mais um módulo desviante (`18-websockets`) que escapou à ronda de correções anterior. Nenhum exige redesenho — são adições e uma reescrita localizada.
