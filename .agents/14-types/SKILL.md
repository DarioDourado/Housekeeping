---
name: 14-types
description: >
  tsconfig strict verificável e padrões de tipagem TypeScript.
  Use when: typescript, tsconfig, tipos, strict, noUncheckedIndexedAccess.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[04-stack, 06-patterns, 21-react-auth-page]"
  last-verified: "2026-10-25"
---
# TYPES - Tipagem TypeScript

## tsconfig.json — strict verificável, não implícito

"TypeScript strict" (`04-stack`) só é real se o `tsconfig.json` o disser. Flags obrigatórias:

```jsonc
// tsconfig.json (excerto — flags de tipagem)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // arr[0] é T | undefined — obriga a tratar o caso vazio
    "exactOptionalPropertyTypes": true, // prop?: T não aceita undefined explícito
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Supressões:** `// @ts-ignore` é proibido (esconde o erro e tudo o que vier depois na linha). `// @ts-expect-error` só com justificação na mesma linha — e falha o build quando o erro deixa de existir, o que o torna auto-limpante:

```typescript
// ❌ Proibido — silencia sem registo
// @ts-ignore
const x = riskyCall();

// ✅ Aceite — justificado e auto-limpante
// @ts-expect-error — tipos da lib X ainda não suportam a opção Y (issue #123)
const x = riskyCall();
```

## Estrutura por Domínio

```
src/types/
├── auth/
│   ├── auth.types.ts
│   └── index.ts
├── users/
│   ├── user.types.ts
│   └── index.ts
├── {domain}/
│   ├── {domain}.types.ts
│   └── index.ts
└── common/
    ├── api.types.ts
    └── index.ts
```

## Padrão de Ficheiro de Types

```typescript
// types/users/user.types.ts
import { z } from 'zod';

// ==================
// ZOD SCHEMAS — INPUT (forms)
// ==================
export const createUserSchema = z.object({
  name: z.string()
    .min(2, 'validation.minLength')
    .max(100, 'validation.maxLength'),
  email: z.string()
    .min(1, 'validation.required')
    .email('validation.email'),
  role: z.string()
    .min(1, 'validation.required'),
});

export const updateUserSchema = createUserSchema.partial();

// ==================
// DTOS (inferidos do Zod)
// ==================
export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;

// ==================
// ZOD SCHEMA — OUTPUT (resposta da API, fronteira de confiança)
// ==================
// É o que o Transporter usa para validar em runtime o que a API devolve —
// ver 06-patterns §Transporter Pattern. Nunca assumir que a resposta tem a
// forma certa só porque o TypeScript diz `Promise<User>`: isso é uma promessa
// em compile-time, não uma garantia.
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.string(),
  avatar: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userListSchema = z.array(userSchema);

// ==================
// ENTIDADE — DERIVADA do schema de output (nunca interface manual paralela)
// ==================
// Validado empiricamente (tsc, strict + exactOptionalPropertyTypes): uma interface
// manual `avatar?: string` NÃO aceita o resultado de schema.parse(), que infere
// `avatar?: string | undefined` — o Transporter deixa de compilar. Além disso,
// interface manual + schema espelhado derivam silenciosamente com o tempo.
// Uma fonte de verdade: o schema; o type é inferido dele.
export type User = z.infer<typeof userSchema>;

// ==================
// FILTROS — DERIVADOS de schema (mesma regra da entidade)
// ==================
// A URL é fronteira de confiança: chega como string e valida-se (`20-rules` ✅7).
// `sort`/`dir` com enums, coerção e defaults `.catch()` — o mesmo schema serve
// hooks, transporters e parsing de URL (`07-react-query` §Filtros na URL;
// `27-data-table` §Ordenação). Um domínio = um filtersSchema; never interface manual.
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(25),
  sort: z.enum(['name', 'email', 'createdAt']).catch('name'),
  dir: z.enum(['asc', 'desc']).catch('asc'),
});

export type UserFilters = z.infer<typeof userFiltersSchema>;
```

## Types Comuns

```typescript
// types/common/api.types.ts

// Corpo de erro da API — RFC 9457 problem+json. Fonte: `fastapi-hardening` §4.
// `code` e `errors` são extension members do contrato (RFC 9457 §3.2), não extras opcionais.
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: string;                                    // chave de i18n no cliente: `errors.<code>`
  errors?: Array<{ field: string; message: string }>;
}

// Forma normalizada para a UI. Sem `message`: o texto do servidor nunca chega ao ecrã
// (info disclosure + i18n) — a UI deriva a mensagem de `code`.
export interface ApiError {
  status: number;
  code: string;
  details?: Record<string, string>;
}

// Resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Opção de select
export interface SelectOption {
  value: string;
  label: string;
}

// Resposta genérica
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
```

## Auth Types

```typescript
// types/auth/auth.types.ts
import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;  // Roles específicos no Context Prompt
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Força de password — schema ÚNICO partilhado por registo/reset/mudança de password
// (21-react-auth-page usa este, nunca uma regra própria). O backend valida o mesmo contrato.
export const passwordSchema = z.string()
  .min(8, 'validation.passwordMinLength')
  .regex(/[A-Za-z]/, 'validation.passwordLetter')
  .regex(/[0-9]/, 'validation.passwordNumber');

// Login NÃO valida força (min 1): passwords antigas podem não cumprir a regra atual —
// rejeitar no login bloquearia o utilizador; a força só se exige onde a password é criada.
export const loginSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'validation.minLength'),
  email: z.email('validation.email'),
  password: passwordSchema,
  passwordConfirm: z.string(),
}).refine((d) => d.password === d.passwordConfirm, {
  message: 'validation.passwordMatch',
  path: ['passwordConfirm'],
});

export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
```

## Re-export com index.ts

```typescript
// types/users/index.ts
export * from './user.types';

// types/index.ts (opcional - re-export global)
export * from './users';
export * from './auth';
export * from './common';
```

## Sincronização com o Backend (Pydantic ↔ Zod via OpenAPI)

O backend (FastAPI/Pydantic v2) é a fonte de verdade do contrato. Os schemas Zod **não se escrevem à mão em espelho** — geram-se a partir do OpenAPI com **orval** (ou openapi-typescript + zod):

```bash
# regenerar quando o contrato muda (idealmente passo de CI que falha se houver drift)
npx orval --input https://api.exemplo.com/openapi.json --output src/api/generated
```

Regra prática: schemas Zod escritos à mão só para validação de formulário (regras de UX que o backend não conhece, ex.: `confirmPassword`); tudo o que descreve o contrato da API vem gerado. Divergência gerado vs. manual detetada em CI = build falha.

## Regras

| Regra | Descrição |
|-------|-----------|
| **Contrato da API gerado do OpenAPI (orval)** | Nunca schemas Zod espelhados à mão; drift detetado em CI |
| **Entidade = `z.infer` do schema de output** | Nunca interface manual paralela — não compila com `exactOptionalPropertyTypes` e deriva do schema com o tempo (validado empiricamente) |
| Zod para DTOs (input) | Schema → `z.infer` |
| **Zod para entidade (output)** | `userSchema` é a fonte de verdade — usado pelo Transporter para validar a resposta da API em runtime |
| Mensagens i18n | `'validation.minLength'` |
| Filtros tipados | `userFiltersSchema` → `z.infer` (nunca interface manual; ver §Filtros) |
| Sem `any` | NUNCA usar |
| `tsconfig` com flags strict explícitas | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` (ver topo) |
| `@ts-ignore` proibido | `@ts-expect-error` só com justificação na mesma linha |
| `type` para inferidos | `type DTO = z.infer<>` |
| `interface` para objectos | Extensível |
