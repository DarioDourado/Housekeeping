---
name: 24-ci-quality
description: >
  Lint, type-check, testes e auditoria de dependências automatizados em CI.
  Use when: CI, lint, ESLint, GitHub Actions, pipeline, dependabot.
metadata:
  stack: "react-web"
  scope: "quality"
  requires: "[]"
  related: "[05-conventions, 08-auth, 11-error-handling, 15-env, 16-tests, 17-security, 22-performance, 20-rules]"
  last-verified: "2026-10-25"
---
# CI/QUALITY - Qualidade e Segurança do Pipeline

## Objetivo

Garantir que lint, formatação, type-check, testes (`16-tests`) e auditoria de dependências correm automaticamente em cada PR — nunca dependentes de disciplina manual do developer. Complementa `17-security` §Skill 6 (Componentes Vulneráveis) e §Skill 8 (Testes de Segurança Automatizados) com a configuração concreta para este stack (Vite + React + TypeScript).

## vite.config.ts de referência (consolidado)

Os fragmentos espalhados por `15-env`/`22-performance` consolidados num único ficheiro canónico:

```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', gzipSize: true }), // análise de bundle (22)
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }, // alias @/ (05-conventions)
  },
  build: {
    // Nunca true em produção. Sem error tracking: false.
    // Com Sentry: 'hidden' + upload no CI + apagar .map antes do deploy (ver §Sourcemaps)
    sourcemap: 'hidden',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts', // 16-tests (inclui MSW server)
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/utils/**'],
      thresholds: { lines: 80, branches: 70, functions: 80 }, // gate (16-tests)
    },
  },
});
```

## ESLint

```javascript
// eslint.config.js (flat config, ESLint 9+)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // reforça 20-rules ❌3
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // apanha useEffect com deps em falta (ver 08-auth)
      'no-console': ['error', { allow: ['warn', 'error'] }], // reforça 20-rules ❌12
    },
  }
);
```

## Prettier

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Husky + lint-staged (pre-commit)

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "build": "vite build",
    "audit:prod": "npm audit --omit=dev --audit-level=high",
    "audit:all": "npm audit --include=dev --audit-level=high"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

## Pipeline CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: '22.12.x', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
      - run: npm run audit:all

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: '22.12.x', cache: 'npm' }
      - run: npm ci
      - name: SCA de produção
        run: npm run audit:prod
      - name: SCA incluindo dependências de desenvolvimento
        run: npm run audit:all
      - name: Secrets scan
        uses: gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7 # v2
```

O pipeline usa Node.js 22.12+ e um limiar explícito `high`. A auditoria de produção usa
`--omit=dev`; a auditoria completa também cobre dependências de desenvolvimento que entram no
build, nos testes ou nas ferramentas do pipeline. Qualquer comando com vulnerabilidades high ou
critical termina com código diferente de zero.

## Sourcemaps de produção (Sentry)

O build usa `sourcemap: 'hidden'` (`22-performance`) — gera os `.map` sem os referenciar no bundle. O CI envia-os para o Sentry e **apaga-os antes do deploy**; assim os stack traces ficam legíveis no Sentry sem nunca expor o código-fonte ao público.

```yaml
# .github/workflows/ci.yml — job deploy (excerto, após npm run build)
      - name: Upload sourcemaps ao Sentry e remover do artefacto
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          npx sentry-cli sourcemaps upload dist/ --release "${{ github.sha }}"
          find dist -name '*.map' -delete
```

O `--release` tem de coincidir com o `release` do `Sentry.init` (`11-error-handling`) — injetar `VITE_APP_VERSION=${{ github.sha }}` no build.

## Cache headers (SPA)

**Regra:** assets com hash são imutáveis para sempre; o `index.html` nunca é cacheado. Errar isto num dos sentidos prende utilizadores numa versão antiga; no outro, recarrega tudo a cada visita.

```
/assets/*  → Cache-Control: public, max-age=31536000, immutable   (Vite já faz hashing por defeito)
/index.html → Cache-Control: no-cache                              (revalida a cada navegação)
```

```json
// vercel.json (equivalente em netlify.toml / nginx)
{
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/index.html", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }
  ]
}
```

## Releases arriscados — feature flags e rollback

- **Feature flag primeiro:** funcionalidade arriscada entra desligada atrás de flag — `VITE_ENABLE_*` (`15-env`) para flags de build; para ligar/desligar sem redeploy, flag runtime via endpoint de config do backend.
- **Rollback = redeploy do artefacto anterior:** builds são imutáveis e guardados por N versões na plataforma de hosting — reverter é apontar para o build anterior, nunca "corrigir à pressa em produção".
- **Preview deployments:** quando a plataforma suporta (Vercel/Netlify), preview por PR como status check adicional — o revisor vê a app real, não só o diff.

## Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"
```

## Gate de PR (branch protection)

Configurar no GitHub (Settings → Branches → Branch protection rule para `main`):

```
□ Require status checks to pass before merging
  □ quality (lint, typecheck, test, build)
  □ security (npm audit, secrets scan)
□ Require branches to be up to date before merging
□ Require pull request review antes de merge
```

Sem isto, o pipeline corre mas não impede merges com falhas — o gate é o que dá dentes às regras.

## Regras

| Regra | Descrição |
|-------|-----------|
| ESLint com `no-explicit-any: error` | Reforça `20-rules` ❌3 automaticamente, não só por revisão manual |
| `no-console: error` (exceto warn/error) | Reforça `20-rules` ❌12 |
| Husky + lint-staged no pre-commit | Lint/format correm antes do commit chegar ao PR |
| CI corre lint + typecheck + test + build | Em todo o push/PR, não só na branch principal |
| Node.js 22.12+ no CI | Runtime alinhado entre desenvolvimento e pipeline |
| SCA com `--audit-level=high` em prod e no conjunto completo | Cobre dependências runtime e ameaças introduzidas por ferramentas de build/teste |
| Dependabot semanal | PRs automáticos de atualização de dependências |
| Branch protection com status checks obrigatórios | Sem isto, o CI é decorativo — não bloqueia merges |
| Sourcemaps `hidden` + upload + delete | Sentry legível sem expor código-fonte (ver `22`/`15-env`) |
| Cache: assets `immutable`, `index.html` `no-cache` | O erro clássico de SPA é cachear o `index.html` |
| Flag em releases arriscados; rollback = build anterior | Nunca hotfix direto em produção |
