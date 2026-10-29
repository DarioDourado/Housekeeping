---
name: 27-data-table
description: >
  Padrão de tabela de dados para back-office: URL state, seleção, virtualização, export.
  Use when: tabela, data table, paginação, ordenação, seleção em lote, exportar CSV.
metadata:
  stack: "react-web"
  scope: "ux"
  requires: "[]"
  related: "[04-stack, 07-react-query, 12-loading-states, 23-accessibility]"
  last-verified: "2026-07-25"
---
# DATA TABLE - Tabelas de Dados (back-office)

## Objetivo

A tabela é o componente central de qualquer back-office e o sítio onde mais padrões se cruzam: ordenação/paginação na URL (`07`), seleção em lote (`23`), densidade (`04` §Hierarquia), virtualização (`22`), exportação. Este módulo junta as peças num padrão único — **não** introduz uma lib de tabelas por defeito; para tabelas muito complexas (column pinning, agrupamento), `@tanstack/react-table` é a extensão natural do stack.

## Ordenação e paginação na URL (extensão direta de `07`)

`ContactFilters` segue o mesmo molde de `14-types` §Filtros / `07-react-query` §parseUserFilters:
schema com enums `sort`/`dir`, coerção e defaults — nunca interface manual e nunca leitura
direta de `searchParams` sem schema. Diferença por domínio: apenas os identificadores de escopo
(aqui, `sort: z.enum(['name', 'email'])`).

**Regra:** `sort`, `dir` e `page` vivem na query string, como qualquer filtro — voltar atrás, refrescar e partilhar link preservam a vista.

```typescript
// types/contacts/contact.types.ts — mesmo molde de 14-types §Filtros e 99-example;
// aqui a única diferença por domínio é o enum de colunas de ordenação permitidas.
export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(25),
  sort: z.enum(['name', 'email']).catch('name'),
  dir: z.enum(['asc', 'desc']).catch('asc'),
});

export type ContactFilters = z.infer<typeof contactFiltersSchema>;
```

```typescript
// pages/Contacts/Contacts.tsx (excerto — mesmo updateFilter de 07-react-query)
const sort = searchParams.get('sort') === 'email' ? 'email' : 'name';
const dir = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';

const toggleSort = (column: 'name' | 'email') => {
  updateFilter({
    sort: column,
    dir: sort === column && dir === 'asc' ? 'desc' : 'asc', // 2.º clique inverte
  });
};
```

```tsx
// Cabeçalho ordenável — aria-sort para leitores de ecrã (23-accessibility)
<th aria-sort={sort === 'name' ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 font-medium">
    {t('contacts.table.name')}
    {sort === 'name' && <span aria-hidden="true">{dir === 'asc' ? '▲' : '▼'}</span>}
  </button>
</th>
```

A ordenação é feita **pelo backend** (`?sort=name&dir=asc` no transporter) — ordenar no client só é aceitável quando a lista completa já está no client (sem paginação).

## Seleção de linhas (integra bulk actions de `23`)

```tsx
// Checkbox de cabeçalho: seleciona a PÁGINA visível, não o dataset inteiro
const allVisibleSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

<th>
  <input
    type="checkbox"
    checked={allVisibleSelected}
    aria-label={t('common.selectAll')}
    onChange={() =>
      setSelectedIds(allVisibleSelected ? new Set() : new Set(rows.map((r) => r.id)))
    }
  />
</th>
```

A toolbar de ações em lote e o `ConfirmDialog` obrigatório para bulk delete estão em `23-accessibility` §Bulk actions — sem exceção.

## Densidade (toggle para quem vive na tabela)

```tsx
// Preferência de UI partilhada entre páginas → Zustand (critério de 04-stack)
const density = useUIStore((s) => s.tableDensity); // 'comfortable' | 'compact'

<td className={clsx('border-b', density === 'compact' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2')}>
```

## Estados e semântica

- Os 4 estados de `12-loading-states` aplicam-se à tabela inteira: skeleton de linhas no loading, `ErrorState` com retry, `EmptyState` com ação.
- `<table>`/`<th scope="col">`/`<td>` semânticos — nunca grid de `div`s (leitores de ecrã navegam tabelas por célula).
- Abaixo de `md:`: cards empilhados ou `overflow-x-auto` explícito (`04-stack` §Responsividade).
- Acima de ~100 linhas renderizadas de uma vez: virtualização (`22`) ou paginação real — nunca `.map()` do dataset completo.

## Exportação CSV

Copiar a [funcao testada](references/escapeCsvCell.ts) para utils/escapeCsvCell.ts.
A neutralizacao altera valores perigosos deliberadamente; para preservar tipos sem
interpretacao de formulas, preferir um formato com celulas explicitamente textuais.

```typescript
import { escapeCsvCell as escape } from '@/utils/escapeCsvCell';

// utils/exportCsv.ts — client-side para o dataset visível/filtrado; exports do dataset
// COMPLETO são um endpoint do backend (o client não deve paginar milhares de registos)
export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  const csv = [
    columns.map((c) => escape(c.label)).join(';'),
    ...rows.map((row) => columns.map((c) => escape(row[c.key])).join(';')),
  ].join('\r\n');

  // BOM UTF-8 — sem isto o Excel PT abre acentos corrompidos
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

```tsx
<Button variant="secondary" onClick={() => exportCsv(contacts, columns, 'contactos')}>
  {t('common.exportCsv')}
</Button>
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Sort/page na URL | `?sort=&dir=&page=` via `updateFilter` de `07` — nunca só useState |
| Ordenação no backend | Client só ordena listas completas não paginadas |
| `aria-sort` no `<th>` ativo | E botão real no cabeçalho (não `onClick` no `th`) |
| Seleção = página visível | "Selecionar todos" nunca seleciona registos que o utilizador não vê |
| Bulk delete com ConfirmDialog | `23-accessibility` — sem exceção |
| Densidade em Zustand | Preferência de UI partilhada (`04-stack` §critério) |
| Tabela semântica | `<table>/<th scope>/<td>` — nunca divs; cards/scroll abaixo de `md:` |
| CSV client só do que está visível | Dataset completo exporta-se no backend; BOM UTF-8 sempre |
| Tabelas complexas | `@tanstack/react-table` (mesma família do stack) — não reinventar |
