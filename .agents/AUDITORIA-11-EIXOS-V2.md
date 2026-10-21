# Re-Auditoria — 11 Eixos (react-enterprise-modula v1.1)

> **Tipo:** auditoria de verificação pós-correção · **Data:** 2026-07-03
> **Baseline:** `AUDITORIA-11-EIXOS.md` (2026-07-02) — todos os itens `Parcial`/`Ausente` reverificados contra o corpus corrigido (27 módulos, `00`–`26`)
> **Metodologia:** releitura dos módulos alterados + verificação automatizada (referências cruzadas entre módulos, anti-padrões residuais, keys i18n usadas vs declaradas, API TanStack v5, regras de segurança presentes nos módulos "consultar sempre")

## Veredito

**Todos os itens Crítico, Alto, Médio e Baixo da auditoria anterior estão corrigidos e verificados.** Restam apenas 3 limitações conhecidas e aceites (documentadas no fim) — nenhuma é um gap corrigível dentro deste corpus.

---

## Matriz de verificação por eixo

### Eixo 1 — Segurança

| Item (estado anterior) | Estado atual | Verificação |
|---|---|---|
| A07 refresh sem fila (Parcial) | **Coberto** | `08-auth`: `refreshAccessToken` com promessa partilhada (`refreshPromise ??=`), comentário explica a race condition, regra na tabela; teste MSW do single-flight em `16-tests` |
| CSRF nunca nomeado (Parcial) | **Coberto** | `08-auth` §Nota CSRF: defesa atual nomeada + condição que a invalida (`sameSite` ≠ strict) + alternativa |
| XSS só em `17-security` (nota) | **Coberto** | `20-rules` ❌16 + checklist; `17-security` mantém a profundidade |
| Uploads sem sanitização (Parcial) | **Coberto** | `10-forms` §Uploads: Zod tipo/tamanho + regra "backend revalida por magic bytes" |
| WS token na URL como default (Parcial) | **Coberto** | `18-websockets` reescrito: auth na 1.ª mensagem no `onopen`, query param despromovido a fallback documentado com token dedicado de curta duração |

### Eixo 2 — Performance

| Item | Estado atual | Verificação |
|---|---|---|
| Web fonts (Ausente) | **Coberto** | `22` §Web fonts: `@fontsource`, preload, swap/CLS; `21` (SKILL + os 2 templates) corrigido para self-host |
| Infinite query (Parcial) | **Coberto** | `07` §Infinite query: `getNextPageParam` + `PaginatedResponse<T>` + ligação à virtualização |
| `srcset`/`sizes` (nota) | **Coberto** | `22` §Imagens: exemplo responsive com critério |
| CSR vs SSR não declarado (Parcial) | **Coberto** | `04` §Contexto de renderização: âmbito e implicações explícitos |
| Code splitting só por rota (nota) | **Coberto** | `22` §Code splitting além das rotas: lazy de componente pesado + critério (bundle visualizer) |
| Retry sem classificação (novo em v1) | **Coberto** | `22` §QueryClient: 4xx nunca repete, rede/5xx com backoff exponencial |

### Eixo 3 — Design (NN/g)

| Item | Estado atual | Verificação |
|---|---|---|
| H2 terminologia (Parcial) | **Coberto** | `09` §Terminologia do domínio: tabela ❌/✅ + regra de consistência de termo + glossário |
| H3 undo (Parcial) | **Coberto** | `11` §Undo: toast com ação + dependência de soft-delete declarada + fallback honesto |
| H4 convenções web (Parcial) | **Coberto** | `05` §Links vs Botões: semântica navegar/agir com exemplos ❌/✅ |
| H6 breadcrumbs/nav ativa (Parcial) | **Coberto** | `13` §Navegação ativa: `NavLink` (+`aria-current`) + `Breadcrumbs` via `useMatches` |
| H8 hierarquia/densidade (Parcial) | **Coberto** | `04` §Hierarquia visual e densidade: escala tipográfica, espaçamento, 1 ação primária, progressive disclosure |
| Breakpoints (Ausente) | **Coberto** | `04` §Responsividade: desktop-first com adaptação obrigatória, breakpoints Tailwind, Layout responsivo, tabelas→cards |

### Eixo 4 — Arquitetura

| Item | Estado atual | Verificação |
|---|---|---|
| Atomic sem critério (Parcial) | **Coberto** | `02` §Critério de promoção: regra objetiva 1 pág./≥2 págs. + mapeamento Atomic explícito e justificado |
| tsconfig implícito (Parcial) | **Coberto** | `14` §tsconfig: flags obrigatórias + regra `@ts-ignore`/`@ts-expect-error` (também em `20-rules` ❌17) |
| Zustand "prompt auxiliar" fantasma (Parcial) | **Coberto** | `04` §Critério Zustand: server ≠ client state, exemplos, referência ao fantasma removida |
| `18-websockets` desviante (Coberto c/ exceção) | **Coberto** | Reescrito: `context/` singular, `services/hooks/socket/`, `env.wsUrl`, `getAccessToken()` — zero desvios de `02`/`08`/`15` |

### Eixo 5 — Testes

| Item | Estado atual | Verificação |
|---|---|---|
| Queries RTL sem regra (Parcial) | **Coberto** | `16` §Prioridade de queries: tabela com `getByTestId` como último recurso justificado |
| MSW (Ausente) | **Coberto** | `16` §Dois níveis de mock: critério vi.mock vs MSW + setup + teste do single-flight (401 concorrentes → 1 refresh) |
| E2E (Ausente) | **Coberto** | Módulo novo `25-e2e`: Playwright, 3 fluxos críticos obrigatórios, CI + branch protection |
| Cobertura sem threshold (Ausente) | **Coberto** | `16` + `24` (vite.config consolidado): thresholds 80/70/80 em `services/**`+`utils/**` |
| a11y automatizada (Ausente) | **Coberto** | `25-e2e` §axe: WCAG A/AA/22AA como gate nas páginas principais |
| Regressão visual (Ausente/opcional) | **Aceite como opcional** | `16` §Regressão visual: decisão documentada com alternativa |

### Eixo 6 — Build/Deploy/CI

| Item | Estado atual | Verificação |
|---|---|---|
| Build não consolidado (Parcial) | **Coberto** | `24` §vite.config.ts de referência: alias, sourcemap, visualizer, coverage num único ficheiro canónico |
| Sourcemaps `false` cego (Parcial) | **Coberto** | `'hidden'` + upload sentry-cli + delete no CI (`24`), coerente em `15` e `22` (verificado por grep — zero `sourcemap: false` residual) |
| Cache headers (Ausente) | **Coberto** | `24` §Cache headers: assets `immutable` / `index.html` `no-cache` + exemplo vercel.json |
| Rollback/flags (Ausente) | **Coberto** | `24` §Releases arriscados: flag primeiro, rollback = build anterior |
| Preview deploys (Ausente) | **Coberto** | `24` §Releases arriscados: preview por PR como status check |

### Eixo 7 — Observabilidade

| Item | Estado atual | Verificação |
|---|---|---|
| Sentry sem init (Parcial) | **Coberto** | `11` §Sentry: `init` com DSN/environment/release + env vars em `15` |
| PII em logs (Ausente) | **Coberto** | `beforeSend` obrigatório (headers/cookies/user scrubbed) + ligação à base legal em `26-privacy` |
| Analytics sem consentimento (Ausente) | **Coberto** | `26-privacy` §Gate de analytics + `20-rules` ❌18 |

### Eixo 8 — Resiliência

| Item | Estado atual | Verificação |
|---|---|---|
| Sem timeout (Ausente) | **Coberto** | `08-auth`: `timeout: 15_000` no `axios.create` + regra |
| Fila de refresh (Ausente) | **Coberto** | Ver Eixo 1 |
| Optimistic sem critério (Ausente) | **Coberto** | `07` §Optimistic: 3 condições + exemplo canónico `onMutate`/`onError`/`onSettled` |
| Draft em sessão expirada (Parcial) | **Coberto** | `10` §Draft: `useFormDraft` (sessionStorage, campos sensíveis excluídos, consumo único) + limpeza no logout (`26-privacy`) |
| Offline (Ausente) | **Coberto** | `11` §Erros de rede: `useOnlineStatus` (useSyncExternalStore) + banner aria-live + `getErrorMessageKey` |

### Eixo 9 — Forms

| Item | Estado atual | Verificação |
|---|---|---|
| Confiança zero não explícita (Parcial) | **Coberto** | `10` topo + tabela de regras: "validação client é UX, não segurança" |
| Foco no 1.º erro não documentado (nota) | **Coberto** | `10`: `shouldFocusError` afirmado como default a não desativar + replicado em erros de servidor |
| Uploads (Ausente) | **Coberto** | `10` §Uploads: schema + multipart + progresso + accept + magic bytes |
| 422→campos (Ausente) | **Coberto** | `10` §Erros do servidor: `applyServerErrors` (Laravel `errors{}` e FastAPI `detail[]`) + toast só como fallback |

### Eixo 10 — i18n/RGPD

| Item | Estado atual | Verificação |
|---|---|---|
| Plurais (Parcial) | **Coberto** | `09` §Plurais: sufixos CLDR + exemplo no JSON |
| Intl (Ausente) | **Coberto** | `09` §Datas/números/moeda: `formatDate`/`formatCurrency` em `utils/formatters/` + regra |
| Consentimento (Ausente) | **Coberto** | `26-privacy`: ConsentContext + banner sem dark patterns + gate de SDK |
| Retenção de storage (Ausente) | **Coberto** | `26-privacy` §Política de storage: inventário completo + limpeza no logout multi-tab |
| Classificação de cookies (Parcial) | **Coberto** | `26-privacy` §Classificação: essencial/telemetria/analytics/marketing com base legal por categoria |

### Eixo 11 — Meta-qualidade

| Item | Estado atual | Verificação |
|---|---|---|
| Contradições `18-websockets` (Parcial) | **Coberto** | Reescrito; grep confirma zero `REACT_APP`, zero `?token=` fora de contexto de proibição |
| Paleta `21` vs tokens `04` (menor) | **Coberto** | Nota de reconciliação em `21` §Decisões de design |
| Password sem schema partilhado (menor) | **Coberto** | `14` `passwordSchema` + `registerSchema` partilhados; racional login vs registo documentado; `21` referencia-os; keys de validação declaradas em `09` |
| Bug `t()` em `10-forms` (menor) | **Coberto** | `useTranslation` + import de tipo adicionados ao snippet `CreateUser` |
| Índices | **Coberto** | `README` (índice + grafo com 25/26), `00-meta` (árvore, mapa de tarefas, versão 1.1), `USAGE_GUIDE`, nota da baseline `react-master.md` atualizada para `00`–`26` |

---

## Verificações automatizadas (todas limpas)

| Check | Resultado |
|---|---|
| Referências cruzadas `NN-nome` entre módulos | Todas resolvem para pastas existentes |
| Anti-padrões residuais (`REACT_APP_`, "prompt auxiliar", `?token=`, `cacheTime` v4) | Zero ocorrências fora de contexto de proibição |
| Coerência de sourcemaps (`15`/`22`/`24`) | `'hidden'` + upload em todos; zero `sourcemap: false` órfão |
| Keys i18n usadas nos exemplos vs declaradas em `09` | Declaradas (undo, retry, uploading, learnMore, offline, password*, file*, nav) |
| Regra XSS nos módulos "consultar sempre" | Presente em `20-rules` (❌16 + checklist) e `17-security` |
| Templates de `21` (2 cópias) | Google Fonts `@import` removido de ambas |

---

## Limitações conhecidas e aceites (não são gaps corrigíveis aqui)

1. **Verificação cruzada RN/FastAPI** — os corpora não estão nesta pasta; a tabela de 9 contratos (`AUDITORIA-11-EIXOS.md` §final) fica pronta para quando estiverem acessíveis. O lado web define agora o valor canónico de todos os 9.
2. **Regressão visual (Chromatic/Percy)** — decisão explícita de não exigir (`16-tests`), com alternativa (axe no E2E). Opcional por natureza no brief original.
3. **SSR/SSG** — declarado como fora de âmbito (`04-stack`), por design, não por omissão.

## Estado final

**v1.1 — 27 módulos, 0 itens Ausente, 0 itens Parcial nos 11 eixos** (excluindo as 3 limitações aceites acima). O sistema passou de "arquitetura core sólida com eixos por construir" (v1.0) para cobertura completa e internamente consistente: segurança de auth com resiliência real (single-flight, timeout, offline), verificação automatizada de ponta a ponta (unit → MSW → E2E → axe → thresholds), e conformidade RGPD por construção. A próxima ação de maior valor já não está neste corpus: é auditar os sistemas React Native e FastAPI contra a tabela de contratos cruzados.
