---
name: 15-env
description: >
  Variáveis de ambiente Vite, ficheiros .env por ambiente e config tipada.
  Use when: env, variáveis de ambiente, .env, VITE_, configuração por ambiente.
metadata:
  stack: "react-web"
  scope: "delivery"
  requires: "[]"
  related: "[11-error-handling, 17-security, 18-websockets, 24-ci-quality]"
  last-verified: "2026-07-25"
---
# ENV - Variáveis de Ambiente

## Estrutura de Ficheiros

```
project-root/
├── .env.example        # Template (commitar)
├── .env.development    # Dev (não commitar)
├── .env.production     # Prod (não commitar)
└── .env.local          # Override local (não commitar)
```

## .env.example

```bash
# API
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws

# App
VITE_APP_NAME=MyApp
VITE_APP_ENV=development

# Observabilidade (ver 11-error-handling — DSN é público por natureza, não é secret)
VITE_SENTRY_DSN=
VITE_APP_VERSION=

# Features (opcional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_MOCK=false
```

## Config Tipada

```typescript
// config/env.ts
const requiredEnvVars = ['VITE_API_URL', 'VITE_APP_NAME'] as const;

// Validar variáveis obrigatórias
requiredEnvVars.forEach((key) => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
});

export const env = {
  // API
  apiUrl: import.meta.env.VITE_API_URL as string,
  wsUrl: import.meta.env.VITE_WS_URL as string, // ver 18-websockets
  
  // App
  appName: import.meta.env.VITE_APP_NAME as string,
  appEnv: import.meta.env.VITE_APP_ENV as string || 'development',

  // Observabilidade (11-error-handling)
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  appVersion: import.meta.env.VITE_APP_VERSION as string | undefined, // injetado no CI (SHA/tag)
  
  // Flags
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // Features
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
} as const;

// Type para autocomplete
export type Env = typeof env;
```

## Uso

```typescript
import { env } from '@/config/env';

// API URL
const api = axios.create({
  baseURL: env.apiUrl,
});

// Condicional
if (env.isDev) {
  console.log('Dev mode');
}

if (env.enableAnalytics) {
  initAnalytics();
}
```

## .gitignore

```gitignore
# Env files
.env
.env.local
.env.development
.env.production

# Manter exemplo
!.env.example
```

## Segurança de build (produção)

| Item | Regra |
|------|-------|
| Sourcemaps | Nunca `sourcemap: true` em produção (expõe o código-fonte). Sem error tracking: `false`. Com Sentry/equivalente: `'hidden'` + upload dos `.map` no CI + apagar antes do deploy — ver `24-ci-quality` §Sourcemaps. Sem isto, os stack traces no Sentry chegam minificados e ilegíveis |
| HTTPS | `VITE_API_URL` em produção tem de começar por `https://` — falhar o build se não começar (ver validação abaixo) |
| Variáveis `VITE_*` | **Ficam em texto simples no bundle JS final**, visíveis a qualquer visitante que inspecione o código — nunca colocar aqui secrets/API keys privadas, mesmo que o `.env` não seja commitado. `VITE_` não significa "seguro", significa "público" |
| CSP / SRI / clickjacking | Ver secção "React/SPA-specific" no topo de `17-security` |

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // NUNCA true em produção. Sem error tracking: false.
    // Com Sentry: 'hidden' + upload no CI + apagar .map antes do deploy (ver 24-ci-quality)
    sourcemap: 'hidden',
  },
});
```

```typescript
// config/env.ts — reforçar a validação existente com o check de HTTPS
if (env.isProd && !env.apiUrl.startsWith('https://')) {
  throw new Error('VITE_API_URL deve usar HTTPS em produção');
}
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Prefixo `VITE_` | Obrigatório para expor no client — mas fica público, nunca secrets |
| .env.example | Sempre commitar como template |
| Validar obrigatórias | Falhar cedo se faltarem |
| Config tipada | Usar `env.apiUrl` não `import.meta.env` |
| Não commitar secrets | Usar .gitignore |
| HTTPS obrigatório em produção | Build falha se `VITE_API_URL` não for `https://` |
| Sourcemaps nunca `true` em produção | `false`, ou `'hidden'` + upload Sentry no CI (ver secção acima e `24-ci-quality`) |
