---
name: 99-example
description: >
  Exemplo canónico e validado empiricamente de um domínio completo (`contacts`).
  Use when: exemplo completo, referência, copiar domínio, dúvida entre regra e exemplo.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[03-domain-structure, 06-patterns, 07-react-query, 08-auth, 12-loading-states, 14-types, 16-tests, 20-rules, 27-data-table]"
  last-verified: "2026-10-25"
---
# EXAMPLE - Domínio Completo `contacts` (validado empiricamente)

## O que é isto

Exemplo documental de um dominio de ponta a ponta. Resultados historicos de julho
de 2026 nao certificam esta revisao. Os blocos Markdown abaixo nao sao compilados
pelo typecheck atual; nao prevalecem sobre regras criticas nem sobre evidencias
do projeto. A validacao executavel atual esta em tests/ e nos recursos incluidos
no tsconfig.json. Adaptar e testar este dominio num projeto real antes de o aprovar.

Ao criar um domínio novo, copiar esta estrutura e substituir `contact/contacts` pelo domínio (`03-domain-structure` §Checklist).

## 1. Types — entidade derivada do schema (`14-types`)

```typescript
// types/contacts/contact.types.ts
import { z } from 'zod';

// INPUT (forms) — mensagens como keys i18n
export const createContactSchema = z.object({
  name: z.string().min(2, 'validation.minLength').max(100, 'validation.maxLength'),
  email: z.string().min(1, 'validation.required').email('validation.email'),
  phone: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactDTO = z.infer<typeof createContactSchema>;
export type UpdateContactDTO = z.infer<typeof updateContactSchema>;

// OUTPUT (resposta da API — fronteira de confiança)
export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  phone: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const contactListSchema = z.array(contactSchema);

// Entidade DERIVADA do schema — nunca interface manual paralela.
// Validado: interface manual com opcionais NÃO compila com exactOptionalPropertyTypes.
export type Contact = z.infer<typeof contactSchema>;

// FILTROS — mesmo molde de `14-types` §Filtros: schema com enums sort/dir,
// coerção e defaults; nunca interface manual.
export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(25),
  sort: z.enum(['name', 'email', 'createdAt']).catch('name'),
  dir: z.enum(['asc', 'desc']).catch('asc'),
});

export type ContactFilters = z.infer<typeof contactFiltersSchema>;
```

```typescript
// types/contacts/index.ts
export * from './contact.types';
```

## 2. Query keys (`07-react-query`)

```typescript
// services/transporters/_queryKeys.ts (excerto — adicionar ao objeto existente)
contacts: {
  all: ['contacts'] as const,
  lists: () => [...queryKeys.contacts.all, 'list'] as const,
  list: (filters?: ContactFilters) => [...queryKeys.contacts.lists(), filters] as const,
  details: () => [...queryKeys.contacts.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
},
```

## 3. Transporter — `schema.parse` sempre (`06-patterns`)

```typescript
// services/transporters/contacts/contactsTransporter.ts
import api from '@/lib/axios';
import { contactSchema, contactListSchema } from '@/types/contacts';
import type { Contact, CreateContactDTO, UpdateContactDTO, ContactFilters } from '@/types/contacts';

export const contactsTransporter = {
  getAll: async (filters?: ContactFilters): Promise<Contact[]> => {
    const { data } = await api.get('/contacts', { params: filters });
    return contactListSchema.parse(data); // nunca `return data` direto
  },

  getById: async (id: string): Promise<Contact> => {
    const { data } = await api.get(`/contacts/${id}`);
    return contactSchema.parse(data);
  },

  create: async (payload: CreateContactDTO): Promise<Contact> => {
    const { data } = await api.post('/contacts', payload);
    return contactSchema.parse(data);
  },

  update: async (id: string, payload: UpdateContactDTO): Promise<Contact> => {
    const { data } = await api.put(`/contacts/${id}`, payload);
    return contactSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },
};
```

## 4. Hooks — 1 hook = 1 operação (`03`/`07`)

```typescript
// hooks/contacts/useGetContacts.ts
import { useQuery } from '@tanstack/react-query';
import { contactsTransporter } from '@/services/transporters/contacts';
import { queryKeys } from '@/services/transporters/_queryKeys';
import type { ContactFilters } from '@/types/contacts';

export const useGetContacts = (filters?: ContactFilters) => {
  return useQuery({
    queryKey: queryKeys.contacts.list(filters),
    queryFn: () => contactsTransporter.getAll(filters),
  });
};
```

```typescript
// hooks/contacts/useCreateContact.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsTransporter } from '@/services/transporters/contacts';
import { queryKeys } from '@/services/transporters/_queryKeys';
import type { CreateContactDTO } from '@/types/contacts';

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactDTO) => contactsTransporter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};
```

(`useGetContact`, `useUpdateContact`, `useDeleteContact` seguem o mesmo molde; delete só dispara via `ConfirmDialog` — `20-rules` ✅16.)

## 5. Page — filtros na URL + 4 estados (`07`/`12`)

```typescript
// utils/parseContactFilters.ts — mesmo padrão de `07-react-query` §parseUserFilters:
// o schema vive em types/contacts; o parser só mapeia os params da URL.
import { contactFiltersSchema, type ContactFilters } from '@/types/contacts';

export const parseContactFilters = (params: URLSearchParams): ContactFilters =>
  contactFiltersSchema.parse({
    search: params.get('search') || undefined,
    page: params.get('page') ?? undefined,
    limit: params.get('limit') ?? undefined,
    sort: params.get('sort') ?? undefined,
    dir: params.get('dir') ?? undefined,
  });
```

```typescript
// pages/Contacts/Contacts.tsx
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '@/UI/containers/PageWrapper';
import { useGetContacts } from '@/hooks/contacts';
import { parseContactFilters } from '@/utils/parseContactFilters';
import { ContactsList } from './components/ContactsList';

export const Contacts = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // A URL é fronteira de confiança — parsing schematizado (mesmo padrão de
  // `07-react-query`; NUNCA `Number(searchParams.get('page'))` direto).
  const filters = parseContactFilters(searchParams);

  const { data: contacts, isLoading, error, refetch } = useGetContacts(filters);

  const updateFilter = (patch: Partial<ContactFilters>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  return (
    <PageWrapper title={t('contacts.title')}>
      <ContactsList
        contacts={contacts}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onSearchChange={(search) => updateFilter({ search })}
      />
    </PageWrapper>
  );
};
```

(A `ContactsList` trata os 4 estados — skeleton/erro+retry/empty com ação/dados — exatamente como `12-loading-states`; com `27-data-table` para a variante tabela.)

## 6. Testes — os dois níveis (`16-tests`)

```typescript
// hooks/contacts/useGetContacts.test.tsx — nível 2 (MSW, transporter real)
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/../tests/msw/server';
import { useGetContacts } from './useGetContacts';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

it('should fetch and validate contacts through the real transporter', async () => {
  const { result } = renderHook(() => useGetContacts(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.[0]?.name).toBe('Ana Silva');
});

it('should surface a ZodError when the API response is malformed', async () => {
  server.use(
    http.get('*/contacts', () => HttpResponse.json([{ id: 1, nome: 'errado' }]), { once: true })
  );
  const { result } = renderHook(() => useGetContacts(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error?.name).toBe('ZodError'); // a fronteira apanhou a resposta inválida
});
```

O teste executavel do single-flight esta em tests/auth.test.ts no repositorio fonte;
o exemplo documental de 16-tests necessita adaptacao ao cliente atual de 08-auth.

## 7. Checklist de fecho (de `20-rules`, aplicado)

```
✓ hooks/contacts + transporters/contacts + types/contacts (estrutura espelhada)
✓ Keys em _queryKeys.ts
✓ Entidade derivada do schema (z.infer) — nunca interface paralela
✓ schema.parse em toda a resposta do transporter
✓ Filtros/paginação na URL
✓ 4 estados na lista
✓ i18n em todos os textos (contacts.* em pt.json/en.json)
✓ Delete só via ConfirmDialog
✓ Testes: unit (vi.mock) + integração (MSW) + entrada no fluxo E2E (25-e2e)
```

## Resultados historicos, nao revalidados nesta revisao (2026-07-03)

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) | ✅ limpo |
| Vitest (6 testes: Button ×2, single-flight ×2, MSW/Zod ×2) | ✅ 6/6 |
| `vite build` (sourcemap `hidden`) | ✅ 69.9 kB gzip (orçamento: <250 kB) |
| Achado corrigido durante a validação | Interface manual de entidade não compila com `exactOptionalPropertyTypes` → regra de `14-types` atualizada para `z.infer` |
