---
name: 10-forms
description: >
  React Hook Form + Zod: schema, validação client-side não confiável, UX de erro.
  Use when: formulário, react-hook-form, validação, schema Zod.
metadata:
  stack: "react-web"
  scope: "ux"
  requires: "[]"
  related: "[06-patterns, 08-auth, 11-error-handling, 20-rules, 23-accessibility]"
  last-verified: "2026-07-25"
---
# FORMS - Formulários

> **Confiança zero no client:** a validação Zod no browser é UX (feedback imediato), **não é segurança** — qualquer schema client-side é trivialmente contornável via curl/DevTools. O backend revalida **sempre** todos os dados, sem exceção. O mesmo vale para permissões (`08-auth` §Regras).

## Padrão: Zod Schema → Type → Form

### 1. Definir Schema e Type

```typescript
// types/users/user.types.ts
import { z } from 'zod';

// Schema com mensagens i18n
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

// Types inferidos
export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
```

### 2. Criar Form Component

```typescript
// pages/Users/components/UserForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { createUserSchema, CreateUserDTO } from '@/types/users';
import { Button } from '@/UI/components/Button';
import { Input } from '@/UI/components/Input';

interface UserFormProps {
  onSubmit: (data: CreateUserDTO) => void;
  isLoading?: boolean | undefined;
  defaultValues?: Partial<CreateUserDTO>;
}

export const UserForm = ({ onSubmit, isLoading, defaultValues }: UserFormProps) => {
  const { t } = useTranslation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserDTO>({
    resolver: zodResolver(createUserSchema),
    ...(defaultValues ? { defaultValues } : {}),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={t('users.form.name')}
        error={errors.name?.message && t(errors.name.message, { count: 2 })}
        {...register('name')}
      />
      
      <Input
        label={t('users.form.email')}
        type="email"
        error={errors.email?.message && t(errors.email.message)}
        {...register('email')}
      />

      <Input label={t('users.form.role')} error={errors.role?.message && t(errors.role.message)} {...register('role')} />

      <Button type="submit" isLoading={isLoading}>
        {t('common.save')}
      </Button>
    </form>
  );
};
```

### 3. Usar na Page

```typescript
// pages/Users/CreateUser.tsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateUser } from '@/hooks/users';
import { useToast } from '@/context/ToastContext';
import type { CreateUserDTO } from '@/types/users';
import { UserForm } from './components/UserForm';

export const CreateUser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const createUser = useCreateUser();

  const handleSubmit = async (data: CreateUserDTO) => {
    try {
      await createUser.mutateAsync(data);
      addToast({ type: 'success', message: t('users.messages.created') });
      navigate('/users');
    } catch {
      addToast({ type: 'error', message: t('common.error') });
    }
  };

  return <UserForm onSubmit={handleSubmit} isLoading={createUser.isPending} />;
};
```

## Input Component Reutilizável

**Ver `23-accessibility` para a versão anotada.** O label liga-se ao input via `htmlFor`/`id` (com `useId()`), e o erro liga-se via `aria-describedby`/`aria-invalid` — sem isto, um leitor de ecrã não anuncia o label nem o erro ao focar o campo.

```typescript
// UI/components/Input/Input.tsx
import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            'w-full px-3 py-2 border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            error ? 'border-danger' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
```

## Erros do servidor → campos (422)

**Regra:** um 422 com erros por campo mapeia-se para `setError` do RHF — o utilizador vê o erro **no campo**, com foco; o toast genérico é só o fallback quando não há mapeamento.

\`\`\`typescript
// utils/applyServerErrors.ts
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import { AxiosError } from 'axios';
import { z } from 'zod';

const problemSchema = z.object({
  errors: z.array(z.object({ field: z.string() })).max(100),
});

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  allowedFields: readonly Path<T>[],
  translatedMessage: string
): boolean {
  if (!(error instanceof AxiosError) || error.response?.status !== 422) return false;
  const result = problemSchema.safeParse(error.response.data);
  if (!result.success) return false;
  const fields = allowedFields.filter((field) =>
    result.data.errors.some((entry) => entry.field === field));
  fields.forEach((field, index) =>
    setError(field, { type: 'server', message: translatedMessage }, { shouldFocus: index === 0 }));
  return fields.length > 0;
}
\`\`\`

Nao mostrar mensagens arbitrarias do servidor. O adapter acima aceita apenas o
contrato errors[].field; outros formatos exigem adapters validados. Para mensagens
especificas, mapear codigos conhecidos para chaves i18n locais.


> **Contrato com o backend (RFC 9457):** o backend FastAPI devolve todos os erros como Problem Details (`application/problem+json`) — ver o módulo de hardening do corpus FastAPI. O 422 traz `errors: [{field, message}]`; erros não-validação trazem `title`/`detail`/`status`. Os 401 chegam com `WWW-Authenticate: Bearer` (usado pelo interceptor de `08-auth`).

```typescript
// Uso na Page
catch (error) {
  if (!applyServerErrors(error, setError, ['name', 'email', 'role'], t('errors.generic'))) {
    addToast({ type: 'error', message: t(getErrorMessageKey(error)) }); // ver 11-error-handling
  }
}
```

> **Foco no primeiro erro (validação client):** o RHF já foca o primeiro campo inválido por defeito (`shouldFocusError: true`) — não desativar. O `shouldFocus` no `applyServerErrors` replica esse comportamento para erros vindos do servidor.

## Uploads de ficheiros

```typescript
// types/{domain}/{domain}.types.ts — validação client-side (UX; o backend revalida por magic bytes)
export const attachmentSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, 'validation.fileTooLarge')
  .refine((f) => ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type), 'validation.fileType');
```

```typescript
// Transporter — multipart + progresso visível (obrigatório acima de ~1s de upload)
upload: async (file: File, onProgress: (pct: number) => void): Promise<Attachment> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/files', form, {
    onUploadProgress: (e) => onProgress(Math.round((e.loaded / (e.total ?? 1)) * 100)),
  });
  return attachmentResponseSchema.parse(data); // fronteira validada como em 06-patterns
},
```

```tsx
// Input de ficheiro — accept espelha o schema (não substitui a validação, orienta o file picker)
<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleFile} />
{uploadPct !== null && <progress value={uploadPct} max={100} aria-label={t('common.uploading')} />}
```

Regras de upload: `accept` espelha o schema Zod; o MIME type do client é indicativo — **o backend revalida por conteúdo (magic bytes), nunca pela extensão**; progresso visível; erros de tamanho/tipo mostrados antes de submeter, não depois.

## Draft e privacidade

Por defeito, nao persistir formularios em localStorage ou sessionStorage: nomes,
emails e texto livre podem ser dados pessoais. Um draft opcional deve ter allowlist
de campos nao sensiveis, schema de validacao, TTL curto e chave de utilizador.
Preferir memoria e apagar em logout/troca de conta. Persistencia exige necessidade
explicita e avaliacao de privacidade; uma blacklist de passwords nao e suficiente.
O cliente de 08-auth nao emite auth:session-expired no window: integrar subscribe
ou estado do AuthProvider, sem assumir eventos globais inexistentes.


## Regras

| Regra | Descrição |
|-------|-----------|
| Schema em types/ | Junto com a entidade |
| Mensagens i18n | Usar keys de tradução |
| Type inferido | `z.infer<typeof schema>` |
| zodResolver | Sempre usar com RHF |
| defaultValues | Para edição |
| Validação client é UX, não segurança | O backend revalida SEMPRE todos os dados |
| 422 → `setError` por campo | `applyServerErrors` + foco no primeiro; toast só como fallback |
| `shouldFocusError` ligado | Default do RHF — nunca desativar |
| Uploads validados dos dois lados | Zod no client (tipo/tamanho) + magic bytes no backend; progresso visível |
| Draft opcional | Allowlist, schema, TTL e limpeza de sessao; nao prometer recuperacao garantida |
