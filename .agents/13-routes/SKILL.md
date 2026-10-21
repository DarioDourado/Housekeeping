---
name: 13-routes
description: >
  Configuração de rotas com React Router, layout responsivo e proteção de rota.
  Use when: rotas, React Router, ProtectedRoute, layout, sidebar.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[20-rules]"
  last-verified: "2026-07-25"
---
# ROUTES - Configuração de Rotas

## Estrutura Base

```typescript
// routes/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes.config';

const router = createBrowserRouter(routes);

export const AppRouter = () => <RouterProvider router={router} />;
```

## Configuração de Rotas

```typescript
// routes/routes.config.tsx
import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '@/UI/containers/Layout';
import { Spinner } from '@/UI/components/Spinner';

// Lazy loading
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Users = lazy(() => import('@/pages/Users').then((m) => ({ default: m.Users })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));
const Unauthorized = lazy(() => import('@/pages/Unauthorized').then((m) => ({ default: m.Unauthorized })));

// Helper para Suspense — sem `any` (ver 20-rules ❌3): páginas lazy não recebem props
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<Spinner fullScreen />}>
    <Component />
  </Suspense>
);

export const routes = [
  // ==================
  // ROTAS PÚBLICAS
  // ==================
  { 
    path: '/login', 
    element: withSuspense(Login) 
  },
  { 
    path: '/unauthorized', 
    element: withSuspense(Unauthorized) 
  },
  
  // ==================
  // ROTAS PROTEGIDAS
  // ==================
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect root para dashboard
      { 
        index: true, 
        element: <Navigate to="/dashboard" replace /> 
      },
      
      // Qualquer utilizador autenticado
      { 
        path: 'dashboard', 
        element: withSuspense(Dashboard) 
      },
      
      // Rotas com roles específicos (definidos no Context Prompt)
      { 
        path: 'users', 
        element: (
          <ProtectedRoute roles={['admin', 'manager']}>
            {withSuspense(Users)}
          </ProtectedRoute>
        )
      },
      
      // Adicionar mais rotas conforme Context Prompt
    ],
  },
  
  // ==================
  // 404
  // ==================
  { 
    path: '*', 
    element: withSuspense(NotFound) 
  },
];
```

## Protected Route

```typescript
// routes/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/UI/components/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

## Public Route (opcional)

```typescript
// routes/PublicRoute.tsx
// Redireciona para dashboard se já estiver autenticado
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
```

## Navegação ativa e breadcrumbs (Heurística 6 — reconhecimento, não memorização)

O utilizador deve saber **onde está** sem memorizar o caminho: item de menu ativo destacado + breadcrumbs em hierarquias com profundidade.

```tsx
// UI/containers/Sidebar — NavLink dá o estado ativo de graça
import { NavLink } from 'react-router-dom';

<NavLink
  to="/users"
  className={({ isActive }) =>
    clsx('block rounded px-3 py-2', isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100')
  }
>
  {t('nav.users')}
</NavLink>
// aria-current="page" é adicionado automaticamente pelo NavLink quando ativo (a11y grátis)
```

```tsx
// UI/components/Breadcrumbs — derivado das rotas via useMatches (handle.crumb por rota)
// routes.config: { path: 'users', handle: { crumb: 'nav.users' }, ... }
import { useMatches, Link } from 'react-router-dom';

export const Breadcrumbs = () => {
  const { t } = useTranslation();
  const crumbs = useMatches().filter((m) => (m.handle as { crumb?: string })?.crumb);

  return (
    <nav aria-label={t('nav.breadcrumbs')}>
      <ol className="flex gap-2 text-sm text-text-muted">
        {crumbs.map((m, i) => (
          <li key={m.id}>
            {i < crumbs.length - 1
              ? <Link to={m.pathname} className="hover:underline">{t((m.handle as { crumb: string }).crumb)}</Link>
              : <span aria-current="page">{t((m.handle as { crumb: string }).crumb)}</span>}
            {i < crumbs.length - 1 && <span aria-hidden="true"> / </span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};
```

## Layout com Outlet

```typescript
// UI/containers/Layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';

export const Layout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet /> {/* Renderiza rotas filhas */}
        </main>
      </div>
    </div>
  );
};
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Lazy loading | Todas as pages com `lazy()` |
| Suspense | Spinner enquanto carrega |
| ProtectedRoute | Envolve rotas autenticadas |
| Roles no Context Prompt | Não hardcoded |
| Layout com Outlet | Para rotas aninhadas |
| `NavLink` para itens de menu | Estado ativo + `aria-current` automáticos |
| Breadcrumbs em hierarquias com profundidade | Via `useMatches` + `handle.crumb` |
