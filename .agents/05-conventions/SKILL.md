---
name: 05-conventions
description: >
  Nomenclatura de ficheiros e convenções de código.
  Use when: nomenclatura, naming, convenções, PascalCase vs camelCase.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[]"
  last-verified: "2026-07-25"
---
# CONVENTIONS - Convenções

## Nomenclatura de Ficheiros

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | `PascalCase.tsx` | `Button.tsx` |
| Pages | `PascalCase.tsx` | `Dashboard.tsx` |
| Hooks | `camelCase.ts` | `useGetUsers.ts` |
| Transporters | `camelCase.ts` | `usersTransporter.ts` |
| Types | `kebab.types.ts` | `user.types.ts` |
| Contexts | `PascalCase.tsx` | `AuthContext.tsx` |
| Tests | `*.test.tsx` | `Button.test.tsx` |

## Nomenclatura de Código

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `const UserCard = () => {}` |
| Hooks | use + PascalCase | `const useGetUsers = () => {}` |
| Funções | camelCase | `const formatDate = () => {}` |
| Constantes | SCREAMING_SNAKE | `const API_URL = ''` |
| Types/Interfaces | PascalCase | `interface User {}` |
| Enums | PascalCase | `enum UserRole {}` |

## Exports

Componentes, hooks, transporters, schemas e tipos usam named exports para que o
contrato público seja explícito e os imports sejam consistentes. Default exports só
são permitidos em ficheiros de configuração que exigem interoperabilidade da
ferramenta (`vite.config.ts`, `tailwind.config.ts`, `orval.config.ts`); não usar
default exports como atalho em código da aplicação.

```typescript
// Componentes, Hooks → named export
export const Button = () => {};
export const useAuth = () => {};

// Transporters → named object
export const usersTransporter = {};

// index.ts → re-export
export * from './Button';
export { useAuth } from './useAuth';
```

## Comentários (reduzidos, bulletpoint)

Regra: código deve ser auto-explicativo. Comentário é exceção, não regra.

- Escrever em **bulletpoint** — curto, sem prosa.
- Só comentar o **porquê** (decisão, quirk, regra de negócio), nunca o **quê** (o quê já é visível no código).
- Evitar comentar nomes de funções/variáveis legíveis — comentário redundante é ruído.
- Mínimo: 1 linha por ponto; só descrever se for mesmo necessário (regra de negócio, `@ts-expect-error`, security quirk).

```tsx
// ❌ Comenta o quê (redundante)
const total = items.reduce((a, b) => a + b.price, 0); // soma os preços

// ✅ Comenta o porquê / decisão, em bulletpoint
// - 30s staleTime evita refetch ao voltar de outro separador (22-performance)
const total = items.reduce((a, b) => a + b.price, 0);
```

## Links vs Botões (convenção web — semântica correta)

| Intenção | Elemento | Porquê |
|----------|----------|--------|
| **Navegar** para outra rota/URL | `<Link>`/`<NavLink>` (React Router) ou `<a>` | Funciona com cmd/ctrl+click (novo separador), clique do meio, "copiar link", e é anunciado como link por leitores de ecrã |
| **Executar ação** (submeter, abrir modal, eliminar) | `<button>` | Focável, ativável com Enter/Espaço, `disabled` nativo |

```tsx
// ❌ Nunca — div clicável (invisível para teclado/leitor de ecrã) ou botão que só navega
<div onClick={() => navigate('/users')}>Utilizadores</div>
<button onClick={() => navigate('/users')}>Utilizadores</button>

// ✅ Navegação é um Link (pode ser estilizado como botão via classes)
<Link to="/users" className="btn-primary">Utilizadores</Link>
```

## Aliases

```typescript
// SEMPRE usar @/
import { Button } from '@/UI/components/Button';
import { useAuth } from '@/hooks/auth';
import type { User } from '@/types/users';
```

## Ordem de Imports

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. Libs externas
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// 3. Router
import { useNavigate } from 'react-router-dom';

// 4. Contexts
import { useAuth } from '@/context/AuthContext';

// 5. Hooks internos
import { useGetUsers } from '@/hooks/users';

// 6. Components
import { Button } from '@/UI/components/Button';

// 7. Types
import type { User } from '@/types/users';

// 8. Utils
import { formatDate } from '@/utils/formatters/date';
```
