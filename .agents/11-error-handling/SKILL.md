---
name: 11-error-handling
description: >
  ErrorBoundary, Sentry com scrubbing de PII, toasts e mensagens de erro.
  Use when: erro, ErrorBoundary, Sentry, toast, mensagens de erro.
metadata:
  stack: "react-web"
  scope: "ux"
  requires: "[]"
  related: "[04-stack, 06-patterns, 20-rules, 24-ci-quality, 26-privacy]"
  last-verified: "2026-10-25"
---
# ERROR HANDLING - Tratamento de Erros

## Sentry — inicialização (obrigatória se o ErrorBoundary reporta)

`Sentry.captureException` no ErrorBoundary (abaixo) só funciona com `Sentry.init` no arranque. O `beforeSend` é **obrigatório** — sem scrubbing, um erro de request pode enviar headers `Authorization`, cookies ou PII para o Sentry (violação RGPD, ver `26-privacy`).

```typescript
// main.tsx — antes do render
import * as Sentry from '@sentry/react';
import { env } from '@/config/env';

Sentry.init({
  dsn: env.sentryDsn,        // VITE_SENTRY_DSN — o DSN é público por natureza, não é secret
  environment: env.appEnv,
  release: env.appVersion,   // liga aos sourcemaps enviados no CI (ver 24-ci-quality)
  sendDefaultPii: false,
  beforeSend(event) {
    // Defesa parcial: nao prova anonimato nem estabelece uma base legal.
    delete event.request?.headers;
    delete event.request?.cookies;
    delete event.user; // Um id interno tambem pode identificar uma pessoa.
    return event;
  },
});
```

Este scrubbing e apenas um ponto de partida: URLs, breadcrumbs, mensagens e extras
tambem podem conter dados pessoais. Aplicar uma allowlist do payload e verificar
eventos reais antes de ativar a integracao; consultar 26-privacy.

## Responsabilidade por Camada

| Camada | Responsabilidade |
|--------|------------------|
| **Transporter** | Lança erro (não trata) |
| **Hook** | Expõe `error` via React Query |
| **Page/Component** | Mostra feedback ao utilizador |

## ErrorBoundary

```typescript
// UI/components/ErrorBoundary/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react'; // npm install @sentry/react — ou o SDK de logging do projeto

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary:', error, errorInfo); // ❌12 de 20-rules: nunca em produção
    }

    // Exemplo mínimo real — trocar pelo SDK do projeto (Sentry, Datadog, etc.).
    // Nunca deixar só um comentário "enviar para X" sem chamada real: um ErrorBoundary
    // sem logging efetivo esconde erros de produção em vez de os reportar.
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// Fallback padrão — cores via design tokens (04-stack); texto via i18n (20-rules ❌4)
const DefaultErrorFallback = ({ onReset }: { onReset: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold text-danger">{t('errors.appFallback')}</h2>
      <p className="mt-2 text-gray-600">{t('errors.generic')}</p>
      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover"
      >
        {t('common.retry')}
      </button>
    </div>
  );
};
```

## Uso do ErrorBoundary

```typescript
// App.tsx ou Layout
import { ErrorBoundary } from '@/UI/components/ErrorBoundary';

<ErrorBoundary fallback={<CustomError />}>
  <App />
</ErrorBoundary>

// Por secção
<ErrorBoundary>
  <UsersList />
</ErrorBoundary>
```

## Toast/Notificações

```typescript
// context/ToastContext.tsx
import { createContext, useState, useContext, useCallback, ReactNode } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // addToast só adiciona à lista — o timer de auto-remove vive no ToastItem (abaixo),
  // nunca aqui. Um setTimeout solto no provider não é limpo se o toast for removido
  // manualmente antes do prazo, nem tem forma de cancelar por item.
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
```

## ToastItem — auto-dismiss com cleanup correto

**Regra:** o timer de auto-remove vive no componente do próprio toast, com `clearTimeout` no cleanup do `useEffect`. Assim, se o toast for removido manualmente (botão "fechar") ou a lista mudar antes do prazo, o timer pendente é cancelado — nunca fica um `setTimeout` órfão a tentar remover um toast que já não existe.

```typescript
// UI/components/Toast/ToastItem.tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Toast } from '@/context/ToastContext';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
  duration?: number;
}

export const ToastItem = ({ toast, onRemove, duration = 5000 }: ToastItemProps) => {
  const { t } = useTranslation();
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer); // cleanup — cancela se desmontar/remover antes do prazo
  }, [toast.id, onRemove, duration]);

  return (
    <div role="status" className="rounded-lg px-4 py-3 shadow-lg">
      <span>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} aria-label={t('common.close')}>✕</button>
    </div>
  );
};

// UI/components/Toast/ToastContainer.tsx
export const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {toasts.map((toast) => (
      <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
    ))}
  </div>
);
```

## Uso com Mutations

```typescript
const createUser = useCreateUser();
const { addToast } = useToast();
const { t } = useTranslation();

const handleSubmit = async (data: CreateUserDTO) => {
  try {
    await createUser.mutateAsync(data);
    addToast({ type: 'success', message: t('users.messages.created') });
  } catch (error) {
    addToast({ type: 'error', message: t('errors.generic') });
  }
};
```

## Erros de rede e offline

**Regra:** um `AxiosError` **sem** `error.response` é falha de rede/timeout, não erro da API — mostrar `t('errors.network')`, nunca a mensagem genérica (o utilizador precisa de saber que o problema é a ligação, não os dados).

```typescript
// utils/getErrorMessage.ts
import { AxiosError } from 'axios';

export const getErrorMessageKey = (error: unknown): string => {
  if (error instanceof AxiosError && !error.response) return 'errors.network'; // rede/timeout
  if (error instanceof AxiosError && error.response?.status === 404) return 'errors.notFound';
  return 'errors.generic';
};
```

```typescript
// hooks/common/useOnlineStatus.ts — deteção de offline para banner global
import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

export const useOnlineStatus = () => useSyncExternalStore(subscribe, () => navigator.onLine);
```

```tsx
// Layout — banner persistente enquanto offline (aria-live: leitores de ecrã anunciam)
const isOnline = useOnlineStatus();
{!isOnline && (
  <div role="status" aria-live="polite" className="bg-warning text-warning-foreground p-2 text-center text-sm">
    {t('errors.offline')}
  </div>
)}
```

Adicionar a `lang/*.json`: `"errors.offline": "Sem ligação à internet. As alterações não serão guardadas."`

## Undo pós-ação (Heurística 3 — controlo e liberdade)

O `ConfirmDialog` (`06-patterns`) previne o erro **antes**; o undo recupera **depois**. Para ações destrutivas frequentes, oferecer as duas camadas: toast de sucesso com ação de desfazer durante N segundos.

```typescript
// Toast com ação opcional — estender o type de ToastContext
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: { label: string; onClick: () => void }; // ex.: undo
}
```

```typescript
// Uso — delete com janela de undo (exige suporte do backend: soft-delete + restore)
const handleDelete = async (id: string) => {
  await deleteUser.mutateAsync(id); // backend faz soft-delete
  addToast({
    type: 'success',
    message: t('users.messages.deleted'),
    action: { label: t('common.undo'), onClick: () => restoreUser.mutate(id) },
  });
};
```

> Sem soft-delete no backend, o undo é impossível de garantir — nesse caso o `ConfirmDialog` é a única barreira e a mensagem de confirmação deve dizer explicitamente "esta ação não pode ser revertida".

## Error State Component

```typescript
// UI/components/ErrorState/ErrorState.tsx
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="p-6 text-center">
      <p className="text-danger">{message || t('errors.generic')}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-primary hover:underline">
          {t('common.retry')}
        </button>
      )}
    </div>
  );
};
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Não silenciar erros | Sempre mostrar feedback |
| i18n para mensagens | Nunca hardcoded |
| ErrorBoundary no root | Captura erros de render |
| Logging real no ErrorBoundary | `Sentry.captureException` (ou equivalente) — nunca só `console.error`/comentário |
| `Sentry.init` com `beforeSend` | Scrubbing de headers/cookies/PII obrigatório (RGPD, ver `26-privacy`) |
| Erro de rede ≠ erro genérico | `AxiosError` sem `response` → `errors.network`; offline → banner via `useOnlineStatus` |
| Undo quando o backend suporta | Toast com ação de desfazer (soft-delete); senão, ConfirmDialog diz "não pode ser revertida" |
| Toast para acções | Feedback de mutations |
| Timer de toast com cleanup | `clearTimeout` no `useEffect` do `ToastItem` — nunca `setTimeout` solto no provider |
| Retry quando possível | Dar opção ao utilizador |
