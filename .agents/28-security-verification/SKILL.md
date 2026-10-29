---
name: 28-security-verification
description: >
  Prova, com testes e gates de CI, que a superfície de segurança do cliente React web está blindada —
  segredos fora do bundle, token só em memória, sinks de XSS controlados, headers/CSP do host, SCA.
  Não é auditoria de código (isso é 17-security): é verificação de runtime/build que falha quando o
  controlo desaparece.
  Use when: verificação de segurança web, segredos no bundle, token em localStorage, XSS sink,
  dangerouslySetInnerHTML, CSP do frontend, security headers, npm audit, gate de segurança no CI,
  blindar o frontend.
metadata:
  stack: "react-web"
  scope: "security"
  requires: "[]"
  related: "[17-security, 26-privacy, 08-auth, 24-ci-quality, 25-e2e]"
  last-verified: "2026-10-25"
---
# SECURITY VERIFICATION — React web (build + E2E)

> **Auditoria ≠ verificação.** `17-security` (17) *procura* falhas; esta skill **prova** que os
> controlos do cliente funcionam, em CI. A superfície é diferente da do backend: um SPA não tem
> endpoint de login para brute-forçar — os vetores HTTP (SQLi, IDOR, brute force) são do
> `fastapi-security-verification`. Aqui verifica-se o que é do **cliente**: o que vai no bundle, onde
> ficam os tokens, que sinks de DOM existem, e o que o host devolve nos headers.

## Como usar

Alguns vetores são de **build** (analisar o `dist/`), outros de **runtime** (Playwright contra o
staging — compõe com `25-e2e`). Todos entram no gate de CI como bloqueantes.

## Os vetores do cliente

### 1. Segredos fora do bundle

Nada de chaves de API, tokens ou segredos no JS servido. Só variáveis `VITE_` **públicas por
desenho** (URLs, flags) — nunca segredos (`15-env`).

```bash
# scripts/check-bundle-secrets.sh — corre sobre dist/ depois do build
set -e
# Prova primeiro que o scanner deteta um canary numa fixture descartável.
fixture=$(mktemp -d)
printf '%s\n' 'TEST_SECRET=canary-not-for-production' > "$fixture/example.js"
if gitleaks dir "$fixture" --no-banner; then
  echo "❌ o scanner não detetou o canary"; exit 1
fi
gitleaks dir dist/ --no-banner
```

Use um scanner de segredos e uma fixture canary para validar a própria regra. Uma regex sobre o
bundle é apenas uma pista e não demonstra que todos os segredos foram cobertos.

### 2. Token de acesso só em memória

O contrato (`08-auth`, `shared-auth-jwt-contract`) diz cookie httpOnly para o refresh e access
**em memória** — nunca `localStorage`/`sessionStorage`, que são legíveis por qualquer XSS.

```typescript
// e2e/security/token-storage.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('login does not write token-like values to browser storage', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER!);
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: /entrar/i }).click();
  const dump = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(dump).not.toMatch(/eyJ|accessToken|refreshToken/i);
});
```

### 3. Sinks de XSS controlados

`dangerouslySetInnerHTML` só com conteúdo sanitizado (DOMPurify). Verificação estática — falha o
build se aparecer sem sanitização (`17-security`).

```bash
# ESLint analisa o AST; não infere segurança pela proximidade de texto.
npx eslint src --rule 'react/no-danger:error'
```

`react/no-danger` deve falhar por omissão. Se HTML sanitizado for realmente necessário, use um
wrapper/allowlist revisto ou uma regra Semgrep AST com exceções explícitas e testadas. Um `grep` de
`dangerouslySetInnerHTML` perto de `DOMPurify.sanitize` não prova que os dados e o sink estão ligados.

### 4. Security headers + CSP do host

O SPA é servido por um host (Nginx, Vercel, CloudFront). Playwright verifica os headers da resposta
do `index.html` no staging.

```typescript
// e2e/security/headers.spec.ts (Playwright)
test('o host devolve os headers de segurança', async ({ request }) => {
  const r = await request.get(process.env.E2E_BASE_URL!);
  const h = r.headers();
  expect(h['strict-transport-security']).toBeTruthy();
  expect(h['x-content-type-options']).toBe('nosniff');
  const csp = h['content-security-policy'] ?? '';
  expect(csp).toBeTruthy();
  const directives = Object.fromEntries(csp.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values];
  }));
  expect(directives['script-src'] ?? directives['default-src']).not.toContain("'unsafe-inline'");
  expect(directives['script-src'] ?? directives['default-src']).not.toContain("'unsafe-eval'");
  expect(csp).toMatch(/frame-ancestors\s+/);
});
```

`style-src 'unsafe-inline'` may be an explicit, documented compatibility choice; it never makes
`script-src` permissive. Parse directives separately so a style exception is not confused with an
executable-script exception.

### 5. Refresh não entra em loop em credenciais inválidas

Verifica a correção de `08-auth`: um `401` em `/auth/login` **não** dispara refresh (senão o login
errado repete-se em ciclo).

```typescript
// e2e/security/auth.spec.ts (network assertion; no undefined authApi)
import { test, expect } from '@playwright/test';

test('401 on login does not call refresh', async ({ page }) => {
  let refreshCalls = 0;
  await page.route('**/auth/login', (route) => route.fulfill({ status: 401, body: '{}' }));
  await page.route('**/auth/refresh', (route) => {
    refreshCalls += 1;
    return route.fulfill({ status: 401, body: '{}' });
  });
  await page.goto('/login');
  await page.getByLabel('Email').fill('invalid@example.test');
  await page.getByLabel('Password').fill('invalid');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(refreshCalls).toBe(0);
});
```

### 6. SCA / dependências

`npm audit` como gate. Fixar `--audit-level=high` para não falhar em ruído low/moderate mas bloquear
o que importa.

### 7. Source maps não expõem segredos em produção

Se geras source maps, não podem ir para o host público (expõem o código-fonte). Ou não os publicas,
ou só os envias para o Sentry.

```bash
test -z "$(find dist/ -name '*.map')" || { echo "❌ source maps no dist público"; exit 1; }
```

## Pipeline de CI — gate bloqueante

```yaml
# .github/workflows/security.yml
name: security
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: "22.12.x", cache: "npm" }
      - run: npm ci
      - run: npm run build
      - name: Segredos no bundle (vetor 1) + source maps (vetor 7)
        run: bash scripts/check-bundle-secrets.sh
      - name: Testes de segurança (vetores 2, 5)
        run: npx playwright test e2e/security
      - name: Headers/CSP no staging (vetor 4)
        run: npx playwright test e2e/security/headers.spec.ts
        env:
          E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}
      - name: SCA (vetor 6)
        run: npm audit --audit-level=high
      - name: Confirmar que não há sourcemaps públicos
        run: test -z "$(find dist -name '*.map' -print -quit)"
```

## Regras

| Regra | Razão |
|---|---|
| Vetores HTTP (SQLi, IDOR, brute force) **não** são daqui | São da API — ver `fastapi-security-verification`. O SPA verifica a sua própria superfície |
| Segredo no bundle é falha de build, não warning | O bundle é público por definição; um segredo lá é um segredo vazado |
| Token em `localStorage` é XSS-legível → proibido, testado | Access em memória, refresh em cookie httpOnly (`shared-auth-jwt-contract`) |
| Headers verificados no **host de staging**, não no dev server | O `vite dev` não representa a config de produção |
| `npm audit` é gate bloqueante em `high` | SCA que não bloqueia não protege |
