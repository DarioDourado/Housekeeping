---
name: 32-ci-cd
description: >
  Continuous Delivery/Deployment (CD): promover builds imutáveis do CI para produção com
  estratégia segura. Foca no que 24-ci-quality NÃO cobre — ambientes (dev/staging/prod), gate de
  promoção, blue-green/canary, e2e+axe no staging, aprovação, observabilidade pós-deploy, rollback e
  verificação de segurança no pipeline. Complementa 24-ci-quality (qualidade/lint/testes no PR).
  Use when: CD, deployment, deploy, ambientes, staging, produção, promote, blue-green, canary,
  release, pipeline de deploy, rollback, enviar para produção.
metadata:
  stack: "react-web"
  scope: "devops"
  requires: "[24-ci-quality, 25-e2e, 15-env]"
  related: "[24-ci-quality, 25-e2e, 15-env, 28-security-verification, 22-performance, 11-error-handling]"
  last-verified: "2026-10-25"
---
# CI/CD — Continuous Delivery e Deploy

> **Divisão de responsabilidade:** `24-ci-quality` garante a **qualidade no PR** (lint, typecheck,
> testes, `npm audit`, dependabot, gate de branch). Esta skill cuida do **percurso até produção**:
> ambientes, builds imutáveis, gate de promoção, estratégias de deploy, verificação pós-deploy e
> rollback. O build de qualidade gera o artefacto; esta skill decide **como e quando** ele sobe.

## Princípio central: build uma vez, promove a artefacto

O mesmo artefacto binário que passou no CI é o que vai para produção — **nunca** rebuildar no deploy.
Um build é imutável, versionado pelo commit, e promovido entre ambientes. Rebuildar por ambiente
introduz variação ("funciona em staging, falha em prod") e anula o que o CI validou.

```
commit ──▶ CI (build imutável + testes + audit) ──▶ artefacto v{sha}
                                                        │  promote
                                        ┌───────────────┴───────────────┐
                                        ▼                               ▼
                                     staging (e2e + axe)          produção (canary → full)
```

VITE_* fica incorporado no build: para promover o mesmo artefacto, usar API relativa
ou configuracao publica de runtime validada. Nunca injectar secrets no bundle.
Os exemplos exigem scripts/deploy.sh implementado para a plataforma, Sentry configurado
(se usado) e environments/permissoes reais; nao sao um deploy pronto por si.

## Ambientes

| Ambiente | Objetivo | Data | Quem decide |
|---|---|---|---|
| **Preview (por PR)** | Revisão visual/UX do change | Fake API / staging API | Revisor humano |
| **Staging** | Validação final (e2e + a11y + perf) | Clone realista | Automatizado |
| **Produção** | Live | Dados reais | Gate + aprovação |

## Build imutável + artefacto

```yaml
# .github/workflows/build.yml — gera o artefacto UMA vez
name: build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
      - run: npm run build
      # Enviar sourcemaps ao Sentry e apagar antes de empacotar (24-ci-quality)
      - run: npx sentry-cli sourcemaps upload dist/ --release "${{ github.sha }}"
      - run: find dist -name '*.map' -delete
      # Artefacto imutável, versionado pelo SHA
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: app-${{ github.sha }}
          path: dist/
          if-no-files-found: error
```

> Injetar a versão/commit no build (`VITE_APP_VERSION=${{ github.sha }}`) para o `Sentry.init`
> coincidir com o `--release` do upload (ver `24-ci-quality` §Sourcemaps e `11-error-handling`).

## Gate de promoção para produção

Só promover quando **todos** passam:

- [ ] `npm audit --audit-level=high` limpo (SCA — `17-security` §Skill 6)
- [ ] Sourcemaps enviados ao Sentry e removidos do artefacto
- [ ] Build/testes verdes no CI (`24-ci-quality`)
- [ ] E2E + axe passam no staging (`25-e2e`)
- [ ] Gate de segurança do cliente (`28-security-verification`) verde
- [ ] Aprovação humana (quando o risco justifica)

## Deploy no staging + e2e + a11y (bloqueante)

```yaml
# .github/workflows/build.yml — adicionar sob jobs, no MESMO workflow
  deploy_staging:
    runs-on: ubuntu-latest
    needs: build
    environment: staging
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with: { name: app-${{ github.sha }}, path: dist }
      - name: Deploy para staging
        run: ./scripts/deploy.sh staging dist
      - name: E2E + a11y (25-e2e)
        run: npx playwright test
        env: { E2E_BASE_URL: ${{ vars.STAGING_URL }} }
```

> O deploy do staging **dispara** o E2E contra o URL real de staging. E2E/axe falhar = não promove.

## Estratégias de produção (blue-green / canary)

Escolhe consoante o risco do change:

| Estratégia | Como | Quando |
|---|---|---|
| **Full deploy** | Troca direta do artefacto | Change de baixo risco |
| **Blue-green** | Duas versões; router aponta para a nova, volta se falhar | Risco médio; rollback instantâneo |
| **Canary** | % pequena de tráfego na nova, aumenta se monitorização estável | Risco alto; exposição gradual |

Canary via flag de runtime (back-end) para controlar % sem redeploy; via `VITE_*` (build) quando é só
visual. **Rollback = apontar para o build anterior** (guarda N versões na plataforma) — nunca
"corrigir à pressa em produção".

## Feature flags em releases arriscados

Funcionalidade arriscada entra **desligada atrás de flag**; liga-se só quando a monitorização
confirma estabilidade. Sem redeploy (flag runtime via endpoint de config) quando precisa de
ligar/desligar a quente; `VITE_ENABLE_*` (`15-env`) só para flags de build/visuais.

## Pós-deploy: verificação e observabilidade

Após promover para produção, confirmar antes de considerar completo:

- [ ] `/health` ou smoke check responde (HTTP 200)
- [ ] Erros no Sentry não subiram (críticos/altos estáveis) — `11-error-handling`
- [ ] Core Web Vitals não regrediram (RUM + `lighthouse-ci`) — `22-performance`
- [ ] Headers de segurança presentes no host de produção — `28-security-verification`

Se algo falha pós-deploy, executar o rollback (apontar para o build anterior) e investigar.

## Segurança no pipeline (não só qualidade)

- Secrets só via GitHub Secrets/`${{ secrets.* }}` — nunca no código nem em logs (CI logs ficam
  públicos em forks mal configurados).
- Guardar artefactos com permissões restritas; não expor o `dist/` de staging sem auth.
- Correr `29-pentest` (ativo) apenas com autorizacao explicita, alvos e limites definidos; nunca como efeito automatico de um PR — a superfície de produção
  difere do dev server.
- Pipelines com `GITHUB_TOKEN` com mínimo privilégio; não marcar actions de terceiros como `trusted`
  sem rever.

## Regras

| Regra | Razão |
|---|---|
| Build uma vez, promove o artefacto | Nunca rebuildar no deploy (variação entre ambientes) |
| Artefacto versionado pelo SHA | Rastreabilidade e rollback determinístico |
| E2E + axe correm contra o staging real | O dev server não representa produção |
| `npm audit`/SCA bloqueia a promoção | Vulnerabilidade conhecida não vai para prod |
| Blue-green/canary para risco alto | Exposição gradual e rollback instantâneo |
| Rollback = build anterior | Nunca hotfix à pressa em produção |
| Secrets só via `${{ secrets.* }}` | CI logs podem tornar-se públicos |
| Feature flag para releases arriscados | Desligar sem redeploy quando necessário |
| Pós-deploy: smoke + Sentry + Vitals + headers | "Deployed" só quando verificado, não quando empurrado |
| `29-pentest` periódico no staging | Superfície de produção difere do dev; testar o real |

## Dependências

```
24-ci-quality (qualidade no PR) ──▶ 32-ci-cd (promoção ao deploy)
                                        ├─▶ 25-e2e (e2e+axe no staging)
                                        ├─▶ 28-security-verification (gate do cliente)
                                        └─▶ 11-error-handling / 22-performance (pós-deploy)
```
