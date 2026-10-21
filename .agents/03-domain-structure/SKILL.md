---
name: 03-domain-structure
description: >
  Padrão hooks + transporters + types por domínio, espelhados 1:1.
  Use when: novo domínio, CRUD, transporter, hook de domínio, query keys.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[]"
  last-verified: "2026-07-25"
---
# DOMAIN STRUCTURE - Estrutura de Domínios

## Regra Principal

> **1 Domínio = 1 Pasta em hooks + 1 Pasta em transporters + 1 Pasta em types**

## Estrutura Espelhada

```
src/
├── hooks/
│   ├── auth/
│   │   ├── useAuth.ts
│   │   ├── useLogin.ts
│   │   ├── useLogout.ts
│   │   └── index.ts
│   │
│   ├── {domain}/              # Ex: users, contacts, equipment
│   │   ├── useGet{Domain}s.ts    # Lista
│   │   ├── useGet{Domain}.ts     # Detalhe
│   │   ├── useCreate{Domain}.ts  # Criar
│   │   ├── useUpdate{Domain}.ts  # Actualizar
│   │   ├── useDelete{Domain}.ts  # Eliminar
│   │   └── index.ts
│   │
│   └── common/                # Hooks genéricos
│       ├── useDebounce.ts
│       ├── useMediaQuery.ts
│       └── index.ts
│
├── services/
│   └── transporters/
│       ├── auth/
│       │   ├── authTransporter.ts
│       │   └── index.ts
│       │
│       ├── {domain}/
│       │   ├── {domain}Transporter.ts
│       │   └── index.ts
│       │
│       └── _queryKeys.ts          # Query keys centralizadas
│
└── types/
    ├── auth/
    │   ├── auth.types.ts
    │   └── index.ts
    │
    ├── {domain}/
    │   ├── {domain}.types.ts
    │   └── index.ts
    │
    └── common/
        ├── api.types.ts
        └── index.ts
```

## Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Hook GET lista | `useGet{Domain}s.ts` | `useGetUsers.ts` |
| Hook GET detalhe | `useGet{Domain}.ts` | `useGetUser.ts` |
| Hook CREATE | `useCreate{Domain}.ts` | `useCreateUser.ts` |
| Hook UPDATE | `useUpdate{Domain}.ts` | `useUpdateUser.ts` |
| Hook DELETE | `useDelete{Domain}.ts` | `useDeleteUser.ts` |
| Transporter | `{domain}Transporter.ts` | `usersTransporter.ts` |
| Types | `{domain}.types.ts` | `user.types.ts` |

## Checklist: Novo Domínio

```
□ src/hooks/{domain}/
□ src/services/transporters/{domain}/
□ src/types/{domain}/
□ Adicionar keys em _queryKeys.ts
```

## Regras

| Regra | Descrição |
|-------|-----------|
| 1 hook = 1 ficheiro | Não agrupar múltiplos hooks |
| 1 transporter = todas as operações | Agrupar CRUD no mesmo ficheiro |
| common/ | Apenas hooks/types não ligados a domínio |
| index.ts | Re-exporta tudo da pasta |
