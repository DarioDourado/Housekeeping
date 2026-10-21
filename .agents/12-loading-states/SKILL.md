---
name: 12-loading-states
description: >
  Os 4 estados obrigatórios de UI: loading, error, empty, success.
  Use when: loading, skeleton, spinner, empty state, estados de UI.
metadata:
  stack: "react-web"
  scope: "ux"
  requires: "[]"
  related: "[06-patterns]"
  last-verified: "2026-07-25"
---
# LOADING STATES - Estados de Loading

## 4 Estados Obrigatórios

Todo componente que consome dados DEVE tratar:

| Estado | Condição | UI |
|--------|----------|-----|
| **Loading** | `isLoading === true` | Skeleton ou Spinner |
| **Error** | `error !== null` | Mensagem + Retry |
| **Empty** | `data?.length === 0` | Empty state |
| **Success** | `data?.length > 0` | Renderizar dados |

## Padrão de Implementação

```typescript
const UsersList = () => {
  const { data: users, isLoading, error, refetch } = useGetUsers();
  const { t } = useTranslation();

  // 1. Loading
  if (isLoading) return <UsersListSkeleton />;
  
  // 2. Error
  if (error) return <ErrorState message={t('errors.generic')} onRetry={refetch} />;
  
  // 3. Empty
  if (!users?.length) return <EmptyState message={t('users.noResults')} />;

  // 4. Success
  return (
    <ul className="space-y-4">
      {users.map(user => <UserCard key={user.id} user={user} />)}
    </ul>
  );
};
```

## Spinner Component

```typescript
// UI/components/Spinner/Spinner.tsx
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const Spinner = ({ size = 'md', fullScreen }: SpinnerProps) => {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div
      role="status"
      aria-label={t('common.loading')}
      className={clsx(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary',
        sizeClasses[size]
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return spinner;
};
```

## Skeleton Component

```typescript
// UI/components/Skeleton/Skeleton.tsx
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ className, variant = 'text' }: SkeletonProps) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        {
          'h-4 rounded': variant === 'text',
          'rounded-full': variant === 'circular',
          'rounded-lg': variant === 'rectangular',
        },
        className
      )}
    />
  );
};

// Exemplo de uso em lista
export const UsersListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 border rounded-lg">
        <Skeleton className="w-1/3 mb-2" />
        <Skeleton className="w-2/3" />
      </div>
    ))}
  </div>
);
```

## Empty State Component

**Heurística 10 de Nielsen (Ajuda e documentação):** um empty state genérico ("Sem resultados") não ajuda o utilizador a agir. Sempre que fizer sentido, combinar a mensagem com uma ação (`action`) e/ou um link de ajuda (`helpHref`) — ver também `OnboardingHint` e `Tooltip` em `06-patterns` para dicas contextuais fora do empty state.

```typescript
// UI/components/EmptyState/EmptyState.tsx
interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  helpHref?: string;   // link para documentação/ajuda ("Saber mais")
  helpLabel?: string;
}

export const EmptyState = ({ message, action, helpHref, helpLabel }: EmptyStateProps) => {
  return (
    <div className="p-8 text-center">
      <div className="text-gray-400 mb-4">
        {/* Ícone ou ilustração */}
        <svg className="mx-auto h-12 w-12" /* ... */ />
      </div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-primary hover:underline"
        >
          {action.label}
        </button>
      )}
      {helpHref && (
        <a href={helpHref} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-primary hover:underline">
          {helpLabel ?? 'Saber mais'}
        </a>
      )}
    </div>
  );
};
```

```tsx
// Uso — primeira vez que a lista de users está vazia (onboarding, não erro)
<EmptyState
  message={t('users.noResults')}
  action={{ label: t('users.createFirst'), onClick: () => navigate('/users/new') }}
  helpHref="/docs/users"
  helpLabel={t('common.learnMore')}
/>
```

## Regras

| Regra | Descrição |
|-------|-----------|
| SEMPRE 4 estados | Nunca assumir que há dados |
| Skeleton > Spinner | Skeleton para listas, Spinner para acções |
| Retry em erros | Dar opção de tentar novamente |
| Empty state informativo | Explicar o que fazer; usar `action`/`helpHref` em vez de só texto |
| Dicas de onboarding dispensáveis | `OnboardingHint`/`Tooltip` (`06-patterns`) para contexto sem poluir a UI |
