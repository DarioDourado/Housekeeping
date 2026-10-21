---
name: 16-tests
description: >
  Localização de testes junto ao código-fonte e o que testar por camada.
  Use when: testes, Vitest, Testing Library, onde testar, cobertura.
metadata:
  stack: "react-web"
  scope: "testing"
  requires: "[]"
  related: "[04-stack, 06-patterns, 08-auth, 23-accessibility, 24-ci-quality]"
  last-verified: "2026-07-25"
---
# TESTS - Estrutura de Testes

## Localização

```
Testes junto ao ficheiro original:

src/
├── UI/components/Button/
│   ├── Button.tsx
│   └── Button.test.tsx      ← Junto
├── hooks/users/
│   ├── useGetUsers.ts
│   └── useGetUsers.test.ts  ← Junto
└── pages/Users/
    ├── Users.tsx
    └── Users.test.tsx       ← Junto
```

## Naming Convention

| Tipo | Padrão |
|------|--------|
| Ficheiro | `{Original}.test.tsx` |
| Describe | `describe('{ComponentName}')` |
| It | `it('should ...')` em inglês |

## O que Testar por Camada

| Camada | Testar |
|--------|--------|
| **Components** | Render, props, eventos, estados visuais |
| **Hooks** | Retornos, side effects, edge cases |
| **Pages** | Integração, fluxos principais |
| **Utils** | Input/output, edge cases |

## Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

## Exemplo: Component Test

```typescript
// UI/components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    await userEvent.click(screen.getByText('Click'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger'); // token semântico, ver 04-stack
  });
});
```

## Exemplo: Hook Test

```typescript
// hooks/users/useGetUsers.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetUsers } from './useGetUsers';

// Mock do transporter
vi.mock('@/services/transporters/users', () => ({
  usersTransporter: {
    getAll: vi.fn(),
  },
}));

import { usersTransporter } from '@/services/transporters/users';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGetUsers', () => {
  it('should fetch users', async () => {
    const mockUsers = [{
      id: '1', name: 'John', email: 'john@example.com', role: 'admin',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    }];
    vi.mocked(usersTransporter.getAll).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useGetUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUsers);
  });
});
```

## Prioridade de queries (RTL)

**Regra:** testar como o utilizador (e o leitor de ecrã) encontra o elemento — a semântica de `23-accessibility` é o que torna isto possível.

| Prioridade | Query | Quando |
|---|---|---|
| 1.ª | `getByRole('button', { name: /guardar/i })` | Elementos interativos — sempre que possível |
| 2.ª | `getByLabelText('Email')` | Campos de formulário |
| 3.ª | `getByText(...)` | Conteúdo não interativo |
| Último recurso | `getByTestId(...)` | Só quando não há semântica possível — **nunca** para botões/inputs (se não há role/label, o problema é de acessibilidade, não de teste) |

## Dois níveis de mock — `vi.mock` vs MSW

| Nível | Ferramenta | O que exercita | Quando |
|---|---|---|---|
| Unit de **hooks** | `vi.mock` do transporter (exemplo acima) | Só a lógica do hook — rápido e isolado | `useGet*`/`useCreate*` individualmente |
| Integração de **Pages** e teste do **próprio transporter** | **MSW** (interceta a rede) | Interceptors do axios, `schema.parse`, fluxo 401→refresh | Fluxos completos; tudo o que vive em `lib/axios` e nos transporters |

`vi.mock` do transporter salta por cima de `lib/axios` — os interceptors (refresh single-flight de `08-auth`) e a validação Zod (`06-patterns`) ficariam **sem qualquer teste** se fosse o único nível.

```typescript
// tests/msw/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/users', () => HttpResponse.json([{ id: '1', name: 'John', email: 'j@x.pt', role: 'admin', createdAt: '', updatedAt: '' }])),
];

export const server = setupServer(...handlers);

// tests/setup.ts — acrescentar:
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
```

```typescript
// lib/axios.test.ts — o teste que vi.mock nunca conseguiria fazer:
// N pedidos com 401 simultâneos → UM único POST /auth/refresh (ver 08-auth §single-flight)
it('should share a single refresh call across concurrent 401s', async () => {
  let refreshCalls = 0;
  server.use(
    http.get('*/users', () => new HttpResponse(null, { status: 401 }), { once: true }),
    http.get('*/contacts', () => new HttpResponse(null, { status: 401 }), { once: true }),
    http.post('*/auth/refresh', () => {
      refreshCalls++;
      return HttpResponse.json({ accessToken: 'new-token' });
    }),
    http.get('*/users', () => HttpResponse.json([])),
    http.get('*/contacts', () => HttpResponse.json([])),
  );

  await Promise.all([api.get('/users'), api.get('/contacts')]);

  expect(refreshCalls).toBe(1); // não 2 — a promessa de refresh é partilhada
});
```

## Cobertura mínima (gate, não decoração)

O CI já corre `--coverage` (`24-ci-quality`) — sem thresholds, a métrica é recolhida e ignorada. Gate nas camadas puras; UI é medida mas sem bloquear:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/utils/**'], // camadas puras — onde o gate faz sentido
      thresholds: { lines: 80, branches: 70, functions: 80 },
    },
  },
});
```

## Regressão visual (opcional)

Chromatic/Percy só se o design system justificar o custo — não é requisito deste sistema. A alternativa barata: testes de a11y automatizados no E2E (`25-e2e` §axe) apanham a maioria das regressões estruturais.

## Test Utils

```typescript
// tests/utils/test-utils.tsx
import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface WrapperProps {
  children: ReactNode;
}

const AllProviders = ({ children }: WrapperProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Testes junto ao código | Não em pasta separada |
| Naming em inglês | `it('should ...')` |
| Mock de HTTP | Nunca fazer requests reais |
| Queries por acessibilidade | `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (último recurso) |
| Dois níveis de mock | `vi.mock` para unit de hooks; MSW para integração/transporters/interceptors |
| Thresholds de cobertura | 80% lines / 70% branches em `services/**` e `utils/**` — gate, não decoração |
| Test utils partilhados | Em `tests/utils/` |
| Testar comportamento | Não implementação |
| E2E dos fluxos críticos | Ver `25-e2e` (Playwright + axe) |
