---
name: 06-patterns
description: >
  Padrões de código para componentes, hooks e transporters (Button, CRUD).
  Use when: padrão de componente, padrão de hook, padrão de transporter, exemplo de código.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[04-stack, 11-error-handling, 12-loading-states, 14-types, 19-solid, 20-rules, 23-accessibility]"
  last-verified: "2026-07-25"
---
# PATTERNS - Padrões de Código

## Page Pattern

```typescript
// pages/Users/Users.tsx
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '@/UI/containers/PageWrapper';
import { useGetUsers } from '@/hooks/users';
import { UsersList } from './components/UsersList';

export const Users = () => {
  const { t } = useTranslation();
  const { data: users, isLoading, error } = useGetUsers();

  return (
    <PageWrapper title={t('users.title')}>
      <UsersList users={users} isLoading={isLoading} error={error} />
    </PageWrapper>
  );
};
```

## Hook Pattern (Query)

```typescript
// hooks/users/useGetUsers.ts
import { useQuery } from '@tanstack/react-query';
import { usersTransporter } from '@/services/transporters/users';
import { queryKeys } from '@/services/transporters/_queryKeys';
import type { UserFilters } from '@/types/users';

export const useGetUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => usersTransporter.getAll(filters),
  });
};
```

## Hook Pattern (Mutation)

```typescript
// hooks/users/useCreateUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersTransporter } from '@/services/transporters/users';
import { queryKeys } from '@/services/transporters/_queryKeys';
import type { CreateUserDTO } from '@/types/users';

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDTO) => usersTransporter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
```

## Transporter Pattern

**Regra:** toda a resposta que sai do transporter passa por `schema.parse()` antes de ser devolvida — nunca `return data` direto do axios. O `Promise<User>` do TypeScript é só uma promessa em compile-time; o `userSchema.parse()` é a garantia em runtime. Ver `14-types` para os schemas de entidade (`userSchema`, `userListSchema`).

```typescript
// services/transporters/users/usersTransporter.ts
import api from '@/lib/axios';
import { userSchema, userListSchema } from '@/types/users';
import type { User, CreateUserDTO, UpdateUserDTO, UserFilters } from '@/types/users';

export const usersTransporter = {
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const { data } = await api.get('/users', { params: filters });
    return userListSchema.parse(data); // valida a resposta em runtime
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return userSchema.parse(data);
  },

  create: async (payload: CreateUserDTO): Promise<User> => {
    const { data } = await api.post('/users', payload);
    return userSchema.parse(data);
  },

  update: async (id: string, payload: UpdateUserDTO): Promise<User> => {
    const { data } = await api.put(`/users/${id}`, payload);
    return userSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
```

`.parse()` lança `ZodError` se a resposta não corresponder ao schema — esse erro segue o fluxo normal já documentado em `11-error-handling` (Transporter lança, Hook expõe via React Query, Page mostra feedback). Usar `.safeParse()` apenas quando o caller precisa de tratar uma resposta malformada de forma diferente de um erro de rede (ex.: fallback silencioso num widget não crítico).

## Component Pattern

```typescript
// UI/components/Button/Button.tsx
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        // Cores via design tokens (04-stack) — nunca bg-blue-600/bg-red-600 diretos
        'rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
        {
          'bg-primary text-primary-foreground hover:bg-primary-hover': variant === 'primary',
          'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary',
          'bg-danger text-danger-foreground hover:bg-danger-hover': variant === 'danger',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || isLoading,
        },
        className
      )}
      {...props}
    >
      {isLoading ? <span className="animate-spin">⏳</span> : children}
    </button>
  );
};
```

## Container Pattern

```typescript
// UI/containers/PageWrapper/PageWrapper.tsx
import type { ReactNode } from 'react';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const PageWrapper = ({ title, subtitle, actions, children }: PageWrapperProps) => {
  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      <main>{children}</main>
    </div>
  );
};
```

## ConfirmDialog Pattern (ações destrutivas — obrigatório antes de qualquer `delete`)

**Regra:** nenhuma mutation destrutiva (`useDelete{Domain}` e equivalentes) é chamada diretamente a partir de um clique. Passa sempre por confirmação explícita do utilizador — ver `20-rules`.

```typescript
// UI/components/ConfirmDialog/ConfirmDialog.tsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/UI/components/Button';
import { useFocusTrap } from '@/hooks/common/useFocusTrap'; // ver 23-accessibility

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  error?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen, title, message, confirmLabel, cancelLabel,
  isDangerous = true, isLoading = false, error, onConfirm, onCancel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  // O hook também trata foco inicial, elementos disabled/hidden e restauração — ver 23.
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-lg bg-white p-6 outline-none dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button
            variant={isDangerous ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel || t('common.confirm')}
          </Button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    </div>,
    document.body
  );
};
```

### Uso com mutation de eliminação

```typescript
// pages/Users/Users.tsx (excerto)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteUser } from '@/hooks/users';
import { ConfirmDialog } from '@/UI/components/ConfirmDialog';

const UsersList = () => {
  const { t } = useTranslation();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const deleteUser = useDeleteUser();

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser.mutateAsync(userToDelete);
      setUserToDelete(null);
    } catch {
      // A failed mutation leaves the dialog open; the page owns the toast/i18n feedback.
    }
  };

  return (
    <>
      {/* cada item da lista chama setUserToDelete(user.id) no botão "Eliminar" — nunca deleteUser.mutate() direto */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        title={t('users.deleteConfirm.title')}
        message={t('users.deleteConfirm.message')}
        isDangerous
        isLoading={deleteUser.isPending}
        error={deleteUser.isError ? t('errors.generic') : undefined}
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </>
  );
};
```

## Modal Pattern (generico; alternativa documental ao dialogo de confirmacao)

**ISP na prática (`19-solid`):** o `Modal` é genérico (abrir/fechar/conteúdo); props de confirmação (`onConfirm`, `isDangerous`) pertencem ao `ConfirmDialog`, que **compõe** o Modal — nunca ao Modal em si.

```typescript
// UI/components/Modal/Modal.tsx
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '@/hooks/common/useFocusTrap'; // 23-accessibility

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, title, onClose, children }: ModalProps) => {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg rounded-lg bg-white p-6 outline-none dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};
```

Uso típico: formulários em modal (`<Modal><UserForm ... /></Modal>`), detalhe rápido, seleção. Ao fechar, o foco volta ao elemento que abriu (comportamento do `useFocusTrap`). Modais de confirmação usam sempre o `ConfirmDialog` acima — não recriar botões de confirmar/cancelar sobre o `Modal` cru.

## Tooltip Pattern (ajuda contextual — ver `12-loading-states` para empty states e `20-rules` checklist)

```typescript
// UI/components/Tooltip/Tooltip.tsx
import { useState, useId, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {/* aria-describedby aponta para o tooltip só quando visível — funciona com foco por teclado, não só hover */}
      <span aria-describedby={isVisible ? tooltipId : undefined} tabIndex={0} className="inline-block">
        {children}
      </span>
      {isVisible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={clsx(
            'absolute z-10 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white',
            position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
};
```

```tsx
// Uso — explica uma ação não óbvia sem poluir a UI com texto permanente
<Tooltip content={t('common.deletePermanently')}>
  <Button variant="danger" onClick={() => setUserToDelete(user.id)}>{t('common.delete')}</Button>
</Tooltip>
```

## OnboardingHint Pattern (dica dispensável, 1ª visita)

```typescript
// UI/components/OnboardingHint/OnboardingHint.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingHintProps {
  id: string;      // chave única por dica, ex.: 'users-list-intro'
  message: string;
}

// localStorage aqui guarda só a flag "visto/não visto" de uma dica de UI — não é
// dado sensível nem token (ver 20-rules ❌1, que se aplica a autenticação, não a isto).
export const OnboardingHint = ({ id, message }: OnboardingHintProps) => {
  const { t } = useTranslation();
  const storageKey = `onboarding-dismissed-${id}`;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === 'true');

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  return (
    <div role="note" className="flex items-start justify-between gap-4 rounded-lg bg-primary/10 p-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
      <button onClick={handleDismiss} aria-label={t('common.dismiss')}>✕</button>
    </div>
  );
};
```
