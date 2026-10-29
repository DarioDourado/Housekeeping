---
name: 25-e2e
description: >
  Fluxos críticos cobertos por testes end-to-end com Playwright.
  Use when: e2e, Playwright, fluxo crítico, teste end-to-end.
metadata:
  stack: "react-web"
  scope: "testing"
  requires: "[]"
  related: "[16-tests, 20-rules, 23-accessibility, 24-ci-quality]"
  last-verified: "2026-10-25"
---
# E2E - Testes End-to-End (Playwright)

## Objetivo

Cobrir os fluxos que nenhum teste unitário ou de integração consegue garantir: a app real, no browser real, contra um backend (mockado ou de staging). Complementa `16-tests` (unit/integração) — não o substitui nem duplica.

## Fluxos críticos obrigatórios

**Regra:** o E2E não tenta cobrir tudo — cobre os fluxos cuja falha é inaceitável em produção. Mínimo para qualquer projeto deste sistema:

| # | Fluxo | O que valida |
|---|-------|--------------|
| 1 | Login → dashboard | Auth completo: form, cookie httpOnly, redirect, sessão restaurada em reload |
| 2 | CRUD do domínio principal | Page→Hook→Transporter real, ConfirmDialog no delete, 4 estados de UI |
| 3 | Sessão expirada | 401 → refresh → retry transparente; refresh falhado → redirect gracioso para login |

## Setup

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const remoteBaseURL = process.env.E2E_BASE_URL;
const authFile = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: remoteBaseURL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { browserName: 'chromium', storageState: authFile },
    },
  ],
  // A remote E2E_BASE_URL is already running; only start Vite for local runs.
  ...(remoteBaseURL
    ? {}
    : { webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI } }),
});
```

The setup project must create the stored session explicitly. Keep credentials in CI secrets or a
local test account, never in the repository:

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER!);
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

## Fluxo 1 — Login

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should login and land on dashboard', async ({ page }) => {
  await page.goto('/login');

  // getByLabel/getByRole — mesma prioridade de queries de 16-tests
  await page.getByLabel('Email').fill('admin@exemplo.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('should keep session after reload (httpOnly cookie + checkSession)', async ({ page }) => {
  // ... login ...
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/); // sessão restaurada, sem voltar ao login
});
```

## Fluxo 2 — CRUD com ConfirmDialog

```typescript
// e2e/users-crud.spec.ts
test('should delete only after explicit confirmation', async ({ page }) => {
  await page.goto('/users');
  let deleteRequests = 0;
  page.on('request', (request) => {
    if (request.method() === 'DELETE') deleteRequests += 1;
  });
  await page.getByRole('button', { name: /eliminar/i }).first().click();

  // 20-rules ❌15: a mutation nunca dispara sem ConfirmDialog
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: /cancelar/i }).click();
  await expect(dialog).not.toBeVisible(); // cancelar não elimina nada
  expect(deleteRequests).toBe(0); // cancelar não pode sequer iniciar a mutation
});
```

## Fluxo 3 — Sessão expirada

```typescript
// e2e/session-expiry.spec.ts
test('should redirect to login when the protected request and refresh both fail', async ({ page }) => {
  await page.route('**/api/users', (route) => route.fulfill({ status: 401, body: '{}' }));
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, body: '{}' }));

  await page.goto('/users');
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});
```

`context.clearCookies()` alone does not prove expiry handling: an in-memory access token may still
work. Force the protected request to return `401`, make refresh fail, and assert the protected
route ends at the expected login URL.

## Acessibilidade automatizada (axe) nas páginas principais

Fecha o gap entre o checklist manual de `23-accessibility` e a verificação contínua — regressões de contraste/labels/roles falham o pipeline:

```typescript
// e2e/a11y.spec.ts
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/login', '/dashboard', '/users']) {
  test(`should have no WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path !== '/login') {
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
      await expect(page).not.toHaveURL(/\/login/);
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

## CI

```yaml
# .github/workflows/ci.yml — job adicional (ver 24-ci-quality)
  e2e:
    runs-on: ubuntu-latest
    needs: [quality]
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: '22.12.x', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}
          E2E_USER: ${{ secrets.E2E_USER }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        if: failure()
        with: { name: playwright-traces, path: test-results/ }
```

Adicionar `e2e` aos status checks obrigatórios do branch protection (`24-ci-quality` §Gate de PR).

## Regras

| Regra | Descrição |
|-------|-----------|
| 3 fluxos críticos mínimos | Login, CRUD principal, sessão expirada — antes de qualquer outro E2E |
| Queries por acessibilidade | `getByRole`/`getByLabel` — mesma prioridade de `16-tests` |
| axe nas páginas principais | WCAG 2.0 A/AA e WCAG 2.1/2.2 AA como gate, não como auditoria manual anual |
| Trace só em falha | `on-first-retry` com uma retry no CI |
| E2E não substitui unit/integração | Pirâmide: muitos unit (16), alguns integração MSW (16), poucos E2E (aqui) |
| Backend mockado ou staging | Nunca produção; dados de teste determinísticos |
