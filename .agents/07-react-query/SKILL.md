---
name: 07-react-query
description: >
  Query keys, invalidação e paginação/infinite scroll com TanStack Query.
  Use when: query, mutation, cache, query keys, infinite scroll, staleTime.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[14-types, 22-performance]"
  last-verified: "2026-07-25"
---
# REACT QUERY - Gestão de Estado do Servidor

## Query Keys Pattern

```typescript
// services/transporters/_queryKeys.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    infinite: (filters?: Omit<UserFilters, 'page'>) => [...queryKeys.users.lists(), 'infinite', filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Adicionar novos domínios seguindo o mesmo padrão
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters?: ContactFilters) => [...queryKeys.contacts.lists(), filters] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },
};
```

## Quando Usar

| Operação | Hook | Método HTTP |
|----------|------|-------------|
| Buscar dados | `useQuery` | GET |
| Criar/Atualizar/Eliminar | `useMutation` | POST/PUT/DELETE |
| Lista infinita | `useInfiniteQuery` | GET paginado |

## useQuery

```typescript
export const useGetUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => usersTransporter.getAll(filters),
    // Opções comuns:
    // staleTime: 5 * 60 * 1000, // 5 minutos
    // enabled: !!filters.id, // condicional
  });
};
```

## useMutation com Invalidação

```typescript
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDTO) => usersTransporter.create(data),
    onSuccess: () => {
      // Invalida todas as listas do domínio
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    // Ou invalidar específico:
    // queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
  });
};
```

## Escrita concorrente — `ETag` / `If-Match`

Recursos editáveis por mais do que um utilizador têm versão no backend
(`fastapi-repositories` §Optimistic Locking). O cliente **tem** de participar, senão sobrescreve
em silêncio: guardar o `ETag` devolvido no GET e reenviá-lo em `If-Match` no update.

O transporter guarda o `ETag` da resposta no objeto editável (`entity.etag`) e aceita um
`ifMatch` explícito no update. O snapshot deve ser capturado quando o editor abre, não
quando a mutation é submetida: a cache pode ter sido actualizada entretanto.

```typescript
import { useCallback, useRef } from 'react';
import { AxiosError } from 'axios';

export const useUpdateReservation = (id: string) => {
  const queryClient = useQueryClient();
  const key = queryKeys.reservations.detail(id);
  const editSnapshot = useRef<{ id: string; etag: string | undefined }>({ id, etag: undefined });

  const beginEdit = useCallback((reservation: Reservation) => {
    editSnapshot.current = { id, etag: reservation.etag };
  }, [id]);

  const mutation = useMutation({
    mutationFn: (data: UpdateReservationDTO) =>
      reservationsTransporter.update(id, data, {
        ifMatch: editSnapshot.current.id === id ? editSnapshot.current.etag : undefined,
      }),

    onError: (error) => {
      // 412 = a nossa cópia é velha. Refazer o GET e deixar o utilizador reaplicar.
      // NUNCA repetir o PATCH às cegas — é reintroduzir o last-write-wins pela porta do lado.
      if (error instanceof AxiosError && error.response?.status === 412) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },

    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
  });

  // A Page calls beginEdit(entity) when opening the form and owns the translated toast.
  return { ...mutation, beginEdit };
};
```

The page that opens the editor calls `beginEdit(reservation)` and maps a `412` to a
localised message. Keeping the toast outside the hook prevents a data hook from owning
presentation or translation policy.

| Status | Significado | O que o cliente faz |
|---|---|---|
| `412` | `If-Match` não bate — a nossa versão é obsoleta | Invalida a query, mostra reconciliação, **não** repete |
| `428` | Faltou o `If-Match` | Bug do cliente: o transporter não guardou o `ETag` |
| `409` | Conflito de domínio, não de versão | Mensagem específica; repetir não resolve |

## Invalidação

| Cenário | Invalidar |
|---------|-----------|
| Criar item | `queryKeys.{domain}.all` |
| Actualizar item | `queryKeys.{domain}.all` ou `.detail(id)` |
| Eliminar item | `queryKeys.{domain}.all` |

## Optimistic updates — critério (a exceção, não a regra)

**Default deste sistema:** invalidate-after-success (exemplos acima). Otimista **só** quando as 3 condições se verificam: (1) taxa de sucesso ~100% (toggles, favoritos, reordenar); (2) rollback trivial (repor snapshot); (3) o utilizador beneficia de resposta instantânea. CRUD normal (create/update com validação de servidor) fica no default — um rollback de form submetido é pior UX do que 300ms de espera.

```typescript
// Exemplo canónico — toggle de favorito
import type { InfiniteData } from '@tanstack/react-query';
import type { PaginatedResponse } from '@/types/common';

type UsersListData =
  | User[]
  | PaginatedResponse<User>
  | InfiniteData<PaginatedResponse<User>>;

const toggleInUsersCache = (value: UsersListData | undefined, id: string): UsersListData | undefined => {
  if (!value) return value;
  const toggle = (user: User) => user.id === id ? { ...user, isFavorite: !user.isFavorite } : user;
  if (Array.isArray(value)) return value.map(toggle);
  if ('pages' in value) {
    return { ...value, pages: value.pages.map((page) => ({ ...page, data: page.data.map(toggle) })) };
  }
  return { ...value, data: value.data.map(toggle) };
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersTransporter.toggleFavorite(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all }); // não deixar refetch pisar o otimismo
      // Atualiza cada entrada filtrada que existe, sem colapsar caches por pesquisa/página.
      const previous = queryClient.getQueriesData<UsersListData>({ queryKey: queryKeys.users.lists() });
      previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, toggleInUsersCache(data, id));
      });
      return { previous }; // snapshot por chave para rollback
    },

    onError: (_err, _id, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all }); // reconciliar com o servidor
    },
  });
};
```

## Infinite query — listas paginadas grandes

Par natural da virtualização (`22-performance` §Virtualização): `useInfiniteQuery` traz as páginas, o virtualizer só renderiza as linhas visíveis. Usa o `PaginatedResponse<T>` de `14-types`:

```typescript
// hooks/users/useGetUsersInfinite.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import type { PaginatedResponse } from '@/types/common';

export const useGetUsersInfinite = (filters?: Omit<UserFilters, 'page'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.users.infinite(filters),
    queryFn: ({ pageParam }) => usersTransporter.getPage({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last: PaginatedResponse<User>) =>
      last.page < last.totalPages ? last.page + 1 : undefined, // undefined = fim da lista
  });
};

// Na page: data.pages.flatMap((p) => p.data) → alimenta o virtualizer;
// fetchNextPage() quando o último item virtual fica visível.
```

## Filtros na URL (`useSearchParams`) — fonte de verdade para listas

**Regra:** filtros e paginação de listas vivem na URL, não só em `useState` local. Sem isto, o botão "voltar" do browser, o refresh da página e a partilha de link não preservam o estado da lista.

```typescript
// pages/Users/Users.tsx
import { useSearchParams } from 'react-router-dom';
import { useGetUsers } from '@/hooks/users';
import type { UserFilters } from '@/types/users';
import { parseUserFilters } from '@/utils/parseUserFilters';

export const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = parseUserFilters(searchParams);

  // queryKeys.users.list(filters) já reflete os filtros da URL — cache correta por combinação
  const { data: users, isLoading, error } = useGetUsers(filters);

  const updateFilter = (patch: Partial<UserFilters>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    if (!('page' in patch)) next.delete('page'); // reset de paginação ao mudar filtro
    setSearchParams(next);
  };

  return (
    <UsersList
      users={users}
      isLoading={isLoading}
      error={error}
      onSearchChange={(search) => updateFilter({ search })}
      onPageChange={(page) => updateFilter({ page })}
    />
  );
};
```

The URL parser and the transporter must agree on the same paginated contract. Keep
`page`, `limit`, `sort` and `dir` typed in `UserFilters`; use a schema at the router
boundary rather than trusting `URLSearchParams` strings:

```typescript
import { z } from 'zod';
import type { UserFilters } from '@/types/users';

const userFiltersFromUrlSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(25),
  sort: z.enum(['name', 'email', 'createdAt']).catch('name'),
  dir: z.enum(['asc', 'desc']).catch('asc'),
});

export const parseUserFilters = (params: URLSearchParams): UserFilters =>
  userFiltersFromUrlSchema.parse({
    search: params.get('search') || undefined,
    role: params.get('role') || undefined,
    page: params.get('page') ?? undefined,
    limit: params.get('limit') ?? undefined,
    sort: params.get('sort') ?? undefined,
    dir: params.get('dir') ?? undefined,
  });
```

`usersTransporter.getPage(filters)` parses `PaginatedResponse<User>` and
`getAll(filters)` parses `User[]`; the infinite hook uses `getPage` and stores each
page under the infinite query key. Do not reuse the array schema for paginated data.

Combinar com debounce (ver `22-performance`): o input de pesquisa atualiza um estado local com `useDebounce` primeiro; só o valor "assentado" (~300ms) é escrito na URL, para não gerar uma entrada de histórico por cada tecla premida.

## Regras

| Regra | Descrição |
|-------|-----------|
| Query keys centralizadas | Sempre em `_queryKeys.ts` |
| Invalidar após mutation | Nunca esquecer |
| 1 hook = 1 operação | `useGetUsers`, `useCreateUser` separados |
| Filtros de lista na URL | `useSearchParams`, nunca só `useState` local |
| Otimista só com as 3 condições | Sucesso ~100% + rollback trivial + ganho real; senão, invalidate-after-success |
| Infinite query para listas grandes | Com `getNextPageParam` + virtualização (`22-performance`) |
