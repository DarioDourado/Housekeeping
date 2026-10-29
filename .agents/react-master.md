# React Enterprise System v2

Gerado deterministicamente de 35 modulos. Referencia completa; preferir react-core.md e skills por tarefa.
As instrucoes especializadas aplicam-se apenas ao respetivo ambito. Recursos relativos requerem os modulos distribuidos ao lado deste ficheiro.

- [00-meta](#00-meta)
- [01-architecture](#01-architecture)
- [02-folder-structure](#02-folder-structure)
- [03-domain-structure](#03-domain-structure)
- [04-stack](#04-stack)
- [05-conventions](#05-conventions)
- [06-patterns](#06-patterns)
- [07-react-query](#07-react-query)
- [08-auth](#08-auth)
- [09-i18n](#09-i18n)
- [10-forms](#10-forms)
- [11-error-handling](#11-error-handling)
- [12-loading-states](#12-loading-states)
- [13-routes](#13-routes)
- [14-types](#14-types)
- [15-env](#15-env)
- [16-tests](#16-tests)
- [17-security](#17-security)
- [18-websockets](#18-websockets)
- [19-solid](#19-solid)
- [20-rules](#20-rules)
- [21-react-auth-page](#21-react-auth-page)
- [22-performance](#22-performance)
- [23-accessibility](#23-accessibility)
- [24-ci-quality](#24-ci-quality)
- [25-e2e](#25-e2e)
- [26-privacy](#26-privacy)
- [27-data-table](#27-data-table)
- [28-security-verification](#28-security-verification)
- [29-pentest](#29-pentest)
- [30-simplify](#30-simplify)
- [31-code-review](#31-code-review)
- [32-ci-cd](#32-ci-cd)
- [33-orchestration](#33-orchestration)
- [99-example](#99-example)

---

<a id="00-meta"></a>

<!-- MÓDULO: 00-meta -->

# React Enterprise Modular v2

Catalogo completo: [MODULES.md](MODULES.md).
Contexto por projeto: [template](CONTEXT-PROMPT-TEMPLATE.md).

## Comecar

Ler [arquitetura](01-architecture/SKILL.md), [dominio](03-domain-structure/SKILL.md)
e [regras](20-rules/SKILL.md). Para delegacao ou escolha de capacidade ler
[orquestracao](33-orchestration/SKILL.md). Os outros modulos carregam por tarefa.

Aplicar instrucoes explicitas do utilizador e convencoes do projeto. As regras
especializadas aplicam-se ao seu ambito; referencias antigas nao prevalecem sobre
o contrato atual. Conflitos materiais exigem resolucao antes de implementar.
Exemplos didaticos nao substituem o contrato real de backend.

## Distribuicao e contexto

Cada pasta numerada e uma skill independente com name igual a pasta.
Copilot: .github/skills ou .agents/skills. Antigravity: .agents/skills
(.agent/skills por compatibilidade). Confirmar descoberta na versao instalada.
O master e referencia, nao contexto global obrigatorio. Usar core curto e
referencias por necessidade. Metadados personalizados nao executam dependencias.

## Eficiencia

O modelo de maior capacidade resolve incerteza, arquitetura e revisao de risco.
O executor economico recebe tarefas delimitadas e criterios de aceitacao; pode
escalar conflitos. Tarefas simples nao precisam de orquestracao.
Selecao real dos modelos depende da ferramenta; medir custo total e qualidade
antes de concluir que delegacao poupa. Nao enviar o master a cada executor.

## Provas

Testes locais validam apenas os comportamentos exercitados. Uma data num ficheiro
nao prova compilacao, seguranca ou conformidade legal. Registar revisao, ambiente,
comandos e limitacoes. Os relatorios AUDITORIA-* anteriores sao historicos.

---

<a id="01-architecture"></a>

<!-- MÓDULO: 01-architecture -->

# ARCHITECTURE - Arquitectura Base

## Fluxo de Dados

```
Pages → Hooks → Transporters → Backend API
  ↑        ↑          ↑
render   lógica      HTTP
```

## Responsabilidades

| Camada | Faz | Não Faz |
|--------|-----|---------|
| **Pages** | Renderizar, compor componentes, usar hooks | Lógica de negócio, HTTP, useState complexo |
| **Hooks** | Estado, side effects, chamar transporters | HTTP directo, JSX |
| **Transporters** | HTTP requests, transformar dados API | Lógica de negócio, estado |
| **Components** | UI reutilizável, props tipadas | Lógica de negócio, HTTP |
| **Containers** | Layout, estrutura de página | Lógica de negócio |

## Dependências Permitidas

```
Pages       → Hooks, Components, Containers, Types, Utils
Hooks       → Transporters, Types, Utils, outros Hooks
Transporters → Types, lib/axios (apenas)
Components  → Types, Utils, outros Components
Containers  → Components, Types
```

## Princípios

1. **Separação clara** — cada camada tem responsabilidade única
2. **Dependência unidireccional** — Pages → Hooks → Transporters
3. **Testabilidade** — cada camada testável isoladamente
4. **Reutilização** — Components e Hooks partilháveis entre Pages

---

<a id="02-folder-structure"></a>

<!-- MÓDULO: 02-folder-structure -->

# FOLDER STRUCTURE - Estrutura de Pastas

## Árvore Base

> Estrutura canónica para este corpus: camadas partilhadas legadas (`hooks/`,
> `services/transporters/`, `types/`) e UI (`UI/components/`, `UI/containers/`) ficam
> estáveis entre features. Feature-slicing só é adoptado quando existir uma decisão de
> mapeamento explícita para o projecto, não por omissão desta skill.

```
src/
├── UI/
│   ├── components/                   # Componentes partilhados (promovidos por uso, ≥2 págs)
│   │   ├── Button/Button.tsx
│   │   ├── form/TextField/
│   │   └── feedback/ConfirmDialog/
│   └── containers/                   # Layouts e composição estrutural
│       ├── Layout/Layout.tsx
│       └── PageWrapper/PageWrapper.tsx
├── hooks/                            # Hooks partilhados e de domínio
│   ├── common/
│   └── users/
├── services/
│   └── transporters/                 # HTTP e validação de respostas
├── types/                            # DTOs, schemas e tipos comuns
│
├── pages/                            # Composição de features em rotas
│   └── {Page}/
│       ├── {Page}.tsx
│       ├── components/               # Componentes específicos da página
│       └── index.ts
│
├── lib/                              # axios, queryClient e integrações configuradas
├── utils/                            # formatters/, validators/, helpers/
├── config/                           # env.ts e configuração pública da app
│
├── context/                          # React Contexts globais
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
│
├── store/                            # Zustand — apenas client state (ver 04-stack)
│   └── {slice}Store.ts               # ler sempre via seletor (22-performance)
│
├── routes/                           # Routing
│   ├── routes.config.tsx
│   ├── ProtectedRoute.tsx
│   └── index.tsx
│
├── lang/                             # i18n
│   ├── i18n.config.ts
│   ├── pt.json
│   └── en.json
│
├── assets/
├── App.tsx
├── main.tsx
└── index.css
```

> **Nota de coerência:** este layout espelha a decisão de usar `hooks/`,
> `services/transporters/`, `types/`, `UI/components/` e `UI/containers/` como caminhos
> canónicos. Um projecto pode adoptar `features/{feature}/...`, mas deve documentar o
> mapeamento completo antes de mover código; não se misturam os dois layouts por ficheiro.

## Critério de promoção de componentes (fronteiras explícitas)

| Situação | Onde vive |
|----------|-----------|
| Usado por **1** página/feature | `pages/{Page}/components/` |
| Usado por **≥ 2** páginas/features | Promove para `UI/components/` (com teste + `index.ts`) |
| Layout/composição estrutural sem lógica | `UI/containers/` |

> **Mapeamento Atomic Design:** este sistema usa deliberadamente níveis em vez de 5 —
> `UI/components` cobre atoms+molecules, `UI/containers` cobre organisms+templates e
> `pages/` cobre composição de páginas. A regra de promoção acima substitui a taxonomia.

## Regras

| Regra | Descrição |
|-------|-----------|
| Cada componente em pasta própria | `Button/Button.tsx` + `index.ts` |
| Testes junto ao código | `Button.test.tsx` na mesma pasta |
| Pages/features podem ter `components/` | Componentes específicos da página/feature |
| `index.ts` obrigatório | Re-exporta conteúdo da pasta |
| Promoção por uso (≥2 páginas) | Ver critério acima — nunca "por sentimento" |

---

<a id="03-domain-structure"></a>

<!-- MÓDULO: 03-domain-structure -->

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

---

<a id="04-stack"></a>

<!-- MÓDULO: 04-stack -->

# STACK - Stack Tecnológica

## Contexto de renderização — SPA/CSR pura (declarado, não implícito)

Este sistema assume **SPA client-side rendering** com Vite. Implicações a conhecer antes de o aplicar: SEO limitado (aceitável para apps autenticadas/back-office, o caso de uso alvo), TTFB não crítico, CSP sem nonces dinâmicos (`17-security`). Para conteúdo público indexável ou LCP de página inicial agressivo, a resposta é SSR/SSG (Next.js) — **fora do âmbito destas skills**; não tentar dobrar este sistema para esse caso.

## Core

| Lib | Versão | Propósito |
|-----|--------|-----------|
| React | 19 | UI |
| TypeScript | 7 | Types (strict mode) |
| Vite | 8 | Build |
| React Router DOM | 7 | Routing |

## Estado e Data

| Lib | Propósito |
|-----|-----------|
| @tanstack/react-query | Estado do servidor, cache |
| React Context | Estado global simples (auth, theme) |
| useState | Estado local |

## Formulários

| Lib | Propósito |
|-----|-----------|
| react-hook-form | Gestão de forms |
| zod | Validação type-safe |
| @hookform/resolvers | Integração RHF + Zod |

## UI

| Lib | Propósito |
|-----|-----------|
| Tailwind CSS | Styling |
| clsx | Classes condicionais |

### Design tokens (obrigatório — nunca cores Tailwind cruas em componentes)

**Regra:** componentes usam classes semânticas (`bg-primary`, `bg-danger`) definidas no `tailwind.config.ts`, nunca cores da paleta default diretamente (`bg-blue-600`, `bg-red-600`). Isto centraliza a identidade visual num único ficheiro — mudar a cor primária da app não implica caçar `bg-blue-600` em dezenas de componentes.

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', hover: '#1d4ed8', foreground: '#ffffff' },
        danger: { DEFAULT: '#dc2626', hover: '#b91c1c', foreground: '#ffffff' },
        success: { DEFAULT: '#16a34a', hover: '#15803d', foreground: '#ffffff' },
        warning: { DEFAULT: '#d97706', hover: '#b45309', foreground: '#ffffff' },
        // Contraste verificado (ver 23-accessibility) — gray-600 dá 7.5:1 sobre branco
        'text-muted': '#4b5563',
      },
    },
  },
};
```

Uso: `bg-primary`, `hover:bg-primary-hover`, `text-primary-foreground` (o Tailwind gera as classes a partir das chaves `DEFAULT`/`hover`/`foreground` do objeto). Ver `06-patterns` §Component Pattern (`Button`) para o exemplo aplicado.

### Hierarquia visual e densidade (Heurística 8 — contexto desktop)

| Regra | Descrição |
|-------|-----------|
| 1 `h1` por página, escala descendente | Título da página (`PageWrapper`) > secções (`h2`, `text-lg`) > corpo (`text-base`/`text-sm`) — o tamanho comunica a hierarquia, não o bold em tudo |
| Espaçamento em escala consistente | Usar a escala Tailwind (`gap-2/4/6`, `p-4/6`) — nunca valores arbitrários (`p-[13px]`); mais espaço entre secções do que dentro delas |
| Densidade adequada a desktop back-office | Tabelas/listas compactas mas legíveis (`py-2` por linha, não `py-6`); ecrãs de leitura/detalhe mais arejados. Em tabelas grandes, oferecer toggle de densidade se os utilizadores viverem nelas |
| 1 ação primária por ecrã | Um só `variant="primary"` visível por contexto; o resto é `secondary`/link — dois botões primários lado a lado não priorizam nada |
| Progressive disclosure | Detalhe secundário atrás de expansão/tooltip (`06-patterns`) em vez de despejar tudo — minimalismo é remover ruído, não informação |

## HTTP

| Lib | Propósito |
|-----|-----------|
| axios | HTTP client |

## i18n

| Lib | Propósito |
|-----|-----------|
| react-i18next | Internacionalização |
| i18next | Core |

## Dev/Quality

| Lib | Propósito |
|-----|-----------|
| Vitest | Testes |
| @testing-library/react | Testes componentes |
| ESLint | Linting |
| Prettier | Formatação |

## Responsividade — breakpoints e estratégia

**Estratégia:** desktop-first no design (contexto back-office), mas com adaptação **obrigatória** até 768px — "desktop-first" não significa "desktop-only". Breakpoints = defaults do Tailwind (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280); nunca valores arbitrários por componente.

| Padrão | Regra |
|--------|-------|
| Sidebar | Visível a partir de `lg:`; abaixo, colapsa para drawer com botão hamburger (com focus trap — `23-accessibility`) |
| Tabelas largas | Abaixo de `md:`: cards empilhados ou `overflow-x-auto` explícito — nunca conteúdo cortado silenciosamente |
| Grids | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` — começar em 1 coluna |
| Touch targets | Mínimo 44×44px em elementos interativos quando há suporte touch |

```tsx
// Layout responsivo (corrige o Layout de 13-routes, que assume sempre desktop)
<div className="flex h-screen">
  <Sidebar className="hidden lg:flex" />          {/* drawer + hamburger abaixo de lg */}
  <div className="flex flex-1 flex-col">
    <Header onMenuClick={openDrawer} />           {/* hamburger só visível abaixo de lg */}
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <Outlet />
    </main>
  </div>
</div>
```

## Quando usar cada solução de estado

| Tipo de dados | Solução |
|---------------|---------|
| Dados da API | React Query |
| Auth, Theme, i18n | Context |
| Estado local componente | useState |
| Estado de cliente partilhado entre páginas | Zustand (ver critério abaixo) |

### Critério Zustand — server state ≠ client state

**Zustand serve apenas estado de cliente** partilhado entre páginas/componentes distantes e que **não é derivável do servidor**: seleção multi-página, preferências de UI (sidebar aberta, densidade de tabela), estado de um wizard. **Nunca** cache de dados da API — isso é território exclusivo do TanStack Query (server state tem invalidação, staleness e refetch; replicá-lo num store é reinventar a cache mal). Se cabe em `useState` + props num só ramo da árvore, nem Zustand nem Context — estado local chega. Store por fatia, leitura sempre com seletor (`22-performance` §Zustand).

---

<a id="05-conventions"></a>

<!-- MÓDULO: 05-conventions -->

# CONVENTIONS - Convenções

## Nomenclatura de Ficheiros

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | `PascalCase.tsx` | `Button.tsx` |
| Pages | `PascalCase.tsx` | `Dashboard.tsx` |
| Hooks | `camelCase.ts` | `useGetUsers.ts` |
| Transporters | `camelCase.ts` | `usersTransporter.ts` |
| Types | `kebab.types.ts` | `user.types.ts` |
| Contexts | `PascalCase.tsx` | `AuthContext.tsx` |
| Tests | `*.test.tsx` | `Button.test.tsx` |

## Nomenclatura de Código

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `const UserCard = () => {}` |
| Hooks | use + PascalCase | `const useGetUsers = () => {}` |
| Funções | camelCase | `const formatDate = () => {}` |
| Constantes | SCREAMING_SNAKE | `const API_URL = ''` |
| Types/Interfaces | PascalCase | `interface User {}` |
| Enums | PascalCase | `enum UserRole {}` |

## Exports

Componentes, hooks, transporters, schemas e tipos usam named exports para que o
contrato público seja explícito e os imports sejam consistentes. Default exports só
são permitidos em ficheiros de configuração que exigem interoperabilidade da
ferramenta (`vite.config.ts`, `tailwind.config.ts`, `orval.config.ts`); não usar
default exports como atalho em código da aplicação.

```typescript
// Componentes, Hooks → named export
export const Button = () => {};
export const useAuth = () => {};

// Transporters → named object
export const usersTransporter = {};

// index.ts → re-export
export * from './Button';
export { useAuth } from './useAuth';
```

## Comentários (reduzidos, bulletpoint)

Regra: código deve ser auto-explicativo. Comentário é exceção, não regra.

- Escrever em **bulletpoint** — curto, sem prosa.
- Só comentar o **porquê** (decisão, quirk, regra de negócio), nunca o **quê** (o quê já é visível no código).
- Evitar comentar nomes de funções/variáveis legíveis — comentário redundante é ruído.
- Mínimo: 1 linha por ponto; só descrever se for mesmo necessário (regra de negócio, `@ts-expect-error`, security quirk).

```tsx
// ❌ Comenta o quê (redundante)
const total = items.reduce((a, b) => a + b.price, 0); // soma os preços

// ✅ Comenta o porquê / decisão, em bulletpoint
// - 30s staleTime evita refetch ao voltar de outro separador (22-performance)
const total = items.reduce((a, b) => a + b.price, 0);
```

## Links vs Botões (convenção web — semântica correta)

| Intenção | Elemento | Porquê |
|----------|----------|--------|
| **Navegar** para outra rota/URL | `<Link>`/`<NavLink>` (React Router) ou `<a>` | Funciona com cmd/ctrl+click (novo separador), clique do meio, "copiar link", e é anunciado como link por leitores de ecrã |
| **Executar ação** (submeter, abrir modal, eliminar) | `<button>` | Focável, ativável com Enter/Espaço, `disabled` nativo |

```tsx
// ❌ Nunca — div clicável (invisível para teclado/leitor de ecrã) ou botão que só navega
<div onClick={() => navigate('/users')}>Utilizadores</div>
<button onClick={() => navigate('/users')}>Utilizadores</button>

// ✅ Navegação é um Link (pode ser estilizado como botão via classes)
<Link to="/users" className="btn-primary">Utilizadores</Link>
```

## Aliases

```typescript
// SEMPRE usar @/
import { Button } from '@/UI/components/Button';
import { useAuth } from '@/hooks/auth';
import type { User } from '@/types/users';
```

## Ordem de Imports

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. Libs externas
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// 3. Router
import { useNavigate } from 'react-router-dom';

// 4. Contexts
import { useAuth } from '@/context/AuthContext';

// 5. Hooks internos
import { useGetUsers } from '@/hooks/users';

// 6. Components
import { Button } from '@/UI/components/Button';

// 7. Types
import type { User } from '@/types/users';

// 8. Utils
import { formatDate } from '@/utils/formatters/date';
```

---

<a id="06-patterns"></a>

<!-- MÓDULO: 06-patterns -->

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

---

<a id="07-react-query"></a>

<!-- MÓDULO: 07-react-query -->

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
`page`, `limit`, `sort` and `dir` typed in `UserFilters`; use the **same schema from
`14-types`** (`userFiltersSchema`) at the router boundary rather than trusting
`URLSearchParams` strings — definir o schema uma única vez evita duas fontes de verdade:

```typescript
// utils/parseUserFilters.ts
import { userFiltersSchema, type UserFilters } from '@/types/users';

// userFiltersSchema já inclui search/role/page/limit/sort/dir com coerção e
// defaults `.catch()` — o parser só mapeia os params; NADA é definido aqui.
export const parseUserFilters = (params: URLSearchParams): UserFilters =>
  userFiltersSchema.parse({
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

---

<a id="08-auth"></a>

<!-- MÓDULO: 08-auth -->

# Autenticacao e ciclo de sessao

Ler [regras](20-rules/SKILL.md) e [tipos](14-types/SKILL.md).
A implementacao de referencia e [auth-client.ts](08-auth/references/auth-client.ts);
a integracao React e [AuthProvider.tsx](08-auth/references/AuthProvider.tsx).
Estes ficheiros sao compilados e exercitados pela suite do repositorio.

## Contrato

- Access token so em memoria; refresh em cookie HttpOnly, Secure e SameSite adequado ao deployment.
- Backend valida sempre autorizacao e ownership; ProtectedRoute e apenas UX.
- POST /auth/login recebe email/password e devolve accessToken e user.
- POST /auth/session restaura a sessao via cookie e devolve a mesma forma.
- POST /auth/refresh devolve accessToken; POST /auth/logout revoga o refresh cookie.
- Respostas sao validadas com Zod. Adapta os schemas ao contrato real antes de integrar.
- CORS com credenciais exige origem exata, Authorization/Content-Type permitidos e OPTIONS sem autenticacao.
- Se precisares de ETag/If-Match, permitir If-Match e expor ETag em CORS.
- Endpoints autenticados por cookies precisam de defesa CSRF no backend, conforme origem e SameSite.
  Nao assumir que CORS, sozinho, impede envio de pedidos cross-site.

## Integracao

Criar uma instancia estavel fora do render. Injetar clearPrivateData que cancele
queries e limpe a cache privada e drafts. Exemplo com um QueryClient dedicado:
`clearPrivateData: () => { void queryClient.cancelQueries(); queryClient.clear(); }`.
Nao partilhar esse cliente com dados de outra conta. O AuthProvider recebe essa
instancia e fica dentro do router se a UI utilizar navegacao.

Login e restauracao usam o cliente de auth sem o interceptor de refresh:
401 em login nunca provoca uma tentativa de refresh.
Pedidos privados partilham um refresh em curso; respostas de uma geracao de
sessao anterior sao rejeitadas. A limpeza de sessao cancela pedidos e impede
refresh tardio de voltar a escrever credenciais. O single-flight e por instancia/tab;
rotacao entre tabs exige coordenacao ou tolerancia contratual do backend.

Logout limpa imediatamente o cliente. Se a revogacao remota falhar, mostrar erro
e permitir repetir: a limpeza local nao prova que o cookie foi revogado.
Aguardar a revogacao antes de iniciar outra autenticacao.
Ao expirar sessao, guardar apenas drafts permitidos antes da limpeza, se aplicavel,
e navegar a partir da UI. Nao acoplar o transporte a window.location.

Para sincronizar tabs, transmitir apenas sinais de login/logout por BroadcastChannel,
nunca tokens. Logout remoto chama clearSession; login remoto so restaura depois
de invalidar a sessao local. Limpar cache e drafts tambem no sinal remoto.
Aplicacoes que precisam dessa sincronizacao devem testar o adapter entre tabs.

## Validacao

A suite cobre refresh concorrente, 401 atrasado, resposta malformada, login invalido
e refresh em curso durante logout. Acrescentar testes de backend para cookies,
CSRF, revogacao, restauracao e coordenacao entre tabs antes de publicar.

---

<a id="09-i18n"></a>

<!-- MÓDULO: 09-i18n -->

# I18N - Internacionalização

## Configuração

```typescript
// lang/i18n.config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './pt.json';
import en from './en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
```

## Estrutura JSON Base

```json
{
  "common": {
    "loading": "A carregar...",
    "error": "Ocorreu um erro",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "search": "Pesquisar",
    "noResults": "Sem resultados",
    "confirm": "Confirmar",
    "back": "Voltar",
    "next": "Seguinte",
    "undo": "Desfazer",
    "retry": "Tentar novamente",
    "uploading": "A enviar...",
    "learnMore": "Saber mais",
    "skipToContent": "Saltar para o conteúdo principal",
    "bulkSelected": "{{count}} selecionado(s)",
    "deleteSelected": "Eliminar selecionados",
    "deleteSelectedTitle": "Eliminar selecionados",
    "deleteSelectedMessage": "Eliminar {{count}} utilizador(es)? Esta ação não pode ser revertida.",
    "bulkPartialError": "Não foi possível eliminar {{count}} item(ns)",
    "close": "Fechar",
    "bulkActions": "Acoes em lote",
    "deletePermanently": "Elimina permanentemente este registo",
    "dismiss": "Dispensar",
    "language": "Idioma"
  },
  "nav": {
    "breadcrumbs": "Navegação estrutural"
  },
  "auth": {
    "login": "Entrar",
    "logout": "Sair",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Esqueceu a password?"
  },
  "languages": {
    "pt": "Português",
    "en": "English"
  },
  "validation": {
    "required": "Campo obrigatório",
    "email": "Email inválido",
    "minLength": "Mínimo {{count}} caracteres",
    "maxLength": "Máximo {{count}} caracteres",
    "passwordMinLength": "A password deve ter pelo menos 8 caracteres",
    "passwordLetter": "A password deve incluir pelo menos uma letra",
    "passwordNumber": "A password deve incluir pelo menos um número",
    "passwordMatch": "As passwords não coincidem",
    "fileTooLarge": "O ficheiro excede o tamanho máximo (5 MB)",
    "fileType": "Tipo de ficheiro não suportado"
  },
  "errors": {
    "appFallback": "Algo correu mal",
    "generic": "Ocorreu um erro. Tente novamente.",
    "network": "Erro de ligação. Verifique a internet e tente novamente.",
    "offline": "Sem ligação à internet. As alterações não serão guardadas.",
    "unauthorized": "Não autorizado",
    "notFound": "Não encontrado"
  },
  "results": {
    "count_one": "{{count}} resultado",
    "count_other": "{{count}} resultados"
  }
}
```

## Terminologia do domínio (Heurística 2 — sistema ↔ mundo real)

**Regra:** as traduções usam o vocabulário do **utilizador**, não o do código ou da base de dados. O Context Prompt de cada projeto define o glossário do domínio; as keys refletem-no.

| ❌ Jargão técnico | ✅ Linguagem do utilizador |
|---|---|
| "Persistir entidade" | "Guardar alterações" |
| "Registo inválido (constraint violation)" | "Este email já está registado" |
| "Fetch falhou" | "Não foi possível carregar os dados" |
| "Deletar user" (anglicismo + termo de BD) | "Eliminar utilizador" |

O mesmo termo do domínio traduz-se **sempre da mesma forma** em toda a app (ex.: se o domínio diz "colaborador", nunca alternar com "funcionário"/"utilizador") — manter um glossário no topo do `pt.json` como comentário de referência do Context Prompt.

## Padrão de Keys

```
{domínio}.{grupo}.{key}

Exemplos:
- common.save
- auth.login
- validation.required
- users.form.name
- users.messages.created
```

## Uso

```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('users.title')}</h1>
      <p>{t('validation.minLength', { count: 8 })}</p>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

## Plurais (i18next)

```typescript
// i18next escolhe a forma pelo count — nunca concatenar "s" manualmente
t('results.count', { count: 1 });  // "1 resultado"
t('results.count', { count: 7 });  // "7 resultados"
```

As keys usam os sufixos CLDR (`_one`, `_other`; outros idiomas podem exigir `_few`/`_many`) — ver o bloco `results` no JSON acima.

## Datas, números e moeda — sempre `Intl`, nunca em strings de tradução

**Regra:** formatos de data/número/moeda saem da `Intl` API com o locale ativo (`i18n.language`), nunca hardcoded nem embutidos em traduções. É para isto que existe `utils/formatters/` (`02-folder-structure`).

```typescript
// utils/formatters/date.ts
import i18n from '@/lang/i18n.config';

export const formatDate = (iso: string, locale = i18n.language) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
// pt: "2 de jul. de 2026" · en: "Jul 2, 2026"

export const formatDateTime = (iso: string, locale = i18n.language) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
```

```typescript
// utils/formatters/number.ts
import i18n from '@/lang/i18n.config';

export const formatCurrency = (value: number, locale = i18n.language, currency = 'EUR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
// pt: "1 234,56 €" · en: "€1,234.56"

export const formatNumber = (value: number, locale = i18n.language) =>
  new Intl.NumberFormat(locale).format(value);
```

## Mudar Idioma

```typescript
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <label>
      <span className="sr-only">{t('common.language')}</span>
      <select
      value={i18n.language} 
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        <option value="pt">{t('languages.pt')}</option>
        <option value="en">{t('languages.en')}</option>
      </select>
    </label>
  );
};
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Sem strings hardcoded | TODOS os textos via i18n |
| Keys descritivas | `users.form.name` não `u.f.n` |
| Interpolação para variáveis | `{{count}}`, `{{name}}` |
| Plurais via sufixos i18next | `key_one`/`key_other` — nunca concatenar "s" manualmente |
| Datas/números/moeda via `Intl` | `utils/formatters/` com o locale ativo — nunca em strings de tradução |
| Ficheiro por idioma | `pt.json`, `en.json` |

---

<a id="10-forms"></a>

<!-- MÓDULO: 10-forms -->

# FORMS - Formulários

> **Confiança zero no client:** a validação Zod no browser é UX (feedback imediato), **não é segurança** — qualquer schema client-side é trivialmente contornável via curl/DevTools. O backend revalida **sempre** todos os dados, sem exceção. O mesmo vale para permissões (`08-auth` §Regras).

## Padrão: Zod Schema → Type → Form

### 1. Definir Schema e Type

```typescript
// types/users/user.types.ts
import { z } from 'zod';

// Limites partilhados schema ↔ UI: a mensagem de maxLength interpola este valor,
// nunca um literal no componente ({ count: 2 } num campo max(100) renderiza
// "Máximo 2 caracteres").
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;

// Schema com mensagens i18n
export const createUserSchema = z.object({
  name: z.string()
    .min(NAME_MIN_LENGTH, 'validation.minLength')
    .max(NAME_MAX_LENGTH, 'validation.maxLength'),
  email: z.email('validation.email'),
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
import { createUserSchema, CreateUserDTO, NAME_MAX_LENGTH } from '@/types/users';
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
        error={errors.name?.message && t(errors.name.message, { count: NAME_MAX_LENGTH })}
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

---

<a id="11-error-handling"></a>

<!-- MÓDULO: 11-error-handling -->

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

---

<a id="12-loading-states"></a>

<!-- MÓDULO: 12-loading-states -->

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
  const { t } = useTranslation();
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
          {helpLabel ?? t('common.learnMore')}
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

---

<a id="13-routes"></a>

<!-- MÓDULO: 13-routes -->

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

---

<a id="14-types"></a>

<!-- MÓDULO: 14-types -->

# TYPES - Tipagem TypeScript

## tsconfig.json — strict verificável, não implícito

"TypeScript strict" (`04-stack`) só é real se o `tsconfig.json` o disser. Flags obrigatórias:

```jsonc
// tsconfig.json (excerto — flags de tipagem)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // arr[0] é T | undefined — obriga a tratar o caso vazio
    "exactOptionalPropertyTypes": true, // prop?: T não aceita undefined explícito
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Supressões:** `// @ts-ignore` é proibido (esconde o erro e tudo o que vier depois na linha). `// @ts-expect-error` só com justificação na mesma linha — e falha o build quando o erro deixa de existir, o que o torna auto-limpante:

```typescript
// ❌ Proibido — silencia sem registo
// @ts-ignore
const x = riskyCall();

// ✅ Aceite — justificado e auto-limpante
// @ts-expect-error — tipos da lib X ainda não suportam a opção Y (issue #123)
const x = riskyCall();
```

## Estrutura por Domínio

```
src/types/
├── auth/
│   ├── auth.types.ts
│   └── index.ts
├── users/
│   ├── user.types.ts
│   └── index.ts
├── {domain}/
│   ├── {domain}.types.ts
│   └── index.ts
└── common/
    ├── api.types.ts
    └── index.ts
```

## Padrão de Ficheiro de Types

```typescript
// types/users/user.types.ts
import { z } from 'zod';

// ==================
// ZOD SCHEMAS — INPUT (forms)
// ==================
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

// ==================
// DTOS (inferidos do Zod)
// ==================
export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;

// ==================
// ZOD SCHEMA — OUTPUT (resposta da API, fronteira de confiança)
// ==================
// É o que o Transporter usa para validar em runtime o que a API devolve —
// ver 06-patterns §Transporter Pattern. Nunca assumir que a resposta tem a
// forma certa só porque o TypeScript diz `Promise<User>`: isso é uma promessa
// em compile-time, não uma garantia.
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.string(),
  avatar: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userListSchema = z.array(userSchema);

// ==================
// ENTIDADE — DERIVADA do schema de output (nunca interface manual paralela)
// ==================
// Validado empiricamente (tsc, strict + exactOptionalPropertyTypes): uma interface
// manual `avatar?: string` NÃO aceita o resultado de schema.parse(), que infere
// `avatar?: string | undefined` — o Transporter deixa de compilar. Além disso,
// interface manual + schema espelhado derivam silenciosamente com o tempo.
// Uma fonte de verdade: o schema; o type é inferido dele.
export type User = z.infer<typeof userSchema>;

// ==================
// FILTROS — DERIVADOS de schema (mesma regra da entidade)
// ==================
// A URL é fronteira de confiança: chega como string e valida-se (`20-rules` ✅7).
// `sort`/`dir` com enums, coerção e defaults `.catch()` — o mesmo schema serve
// hooks, transporters e parsing de URL (`07-react-query` §Filtros na URL;
// `27-data-table` §Ordenação). Um domínio = um filtersSchema; never interface manual.
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(25),
  sort: z.enum(['name', 'email', 'createdAt']).catch('name'),
  dir: z.enum(['asc', 'desc']).catch('asc'),
});

export type UserFilters = z.infer<typeof userFiltersSchema>;
```

## Types Comuns

```typescript
// types/common/api.types.ts

// Corpo de erro da API — RFC 9457 problem+json. Fonte: `fastapi-hardening` §4.
// `code` e `errors` são extension members do contrato (RFC 9457 §3.2), não extras opcionais.
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: string;                                    // chave de i18n no cliente: `errors.<code>`
  errors?: Array<{ field: string; message: string }>;
}

// Forma normalizada para a UI. Sem `message`: o texto do servidor nunca chega ao ecrã
// (info disclosure + i18n) — a UI deriva a mensagem de `code`.
export interface ApiError {
  status: number;
  code: string;
  details?: Record<string, string>;
}

// Resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Opção de select
export interface SelectOption {
  value: string;
  label: string;
}

// Resposta genérica
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
```

## Auth Types

```typescript
// types/auth/auth.types.ts
import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;  // Roles específicos no Context Prompt
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Força de password — schema ÚNICO partilhado por registo/reset/mudança de password
// (21-react-auth-page usa este, nunca uma regra própria). O backend valida o mesmo contrato.
export const passwordSchema = z.string()
  .min(8, 'validation.passwordMinLength')
  .regex(/[A-Za-z]/, 'validation.passwordLetter')
  .regex(/[0-9]/, 'validation.passwordNumber');

// Login NÃO valida força (min 1): passwords antigas podem não cumprir a regra atual —
// rejeitar no login bloquearia o utilizador; a força só se exige onde a password é criada.
export const loginSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'validation.minLength'),
  email: z.email('validation.email'),
  password: passwordSchema,
  passwordConfirm: z.string(),
}).refine((d) => d.password === d.passwordConfirm, {
  message: 'validation.passwordMatch',
  path: ['passwordConfirm'],
});

export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
```

## Re-export com index.ts

```typescript
// types/users/index.ts
export * from './user.types';

// types/index.ts (opcional - re-export global)
export * from './users';
export * from './auth';
export * from './common';
```

## Sincronização com o Backend (Pydantic ↔ Zod via OpenAPI)

O backend (FastAPI/Pydantic v2) é a fonte de verdade do contrato. Os schemas Zod **não se escrevem à mão em espelho** — geram-se a partir do OpenAPI com **orval** (ou openapi-typescript + zod):

```bash
# regenerar quando o contrato muda (idealmente passo de CI que falha se houver drift)
npx orval --input https://api.exemplo.com/openapi.json --output src/api/generated
```

Regra prática: schemas Zod escritos à mão só para validação de formulário (regras de UX que o backend não conhece, ex.: `confirmPassword`); tudo o que descreve o contrato da API vem gerado. Divergência gerado vs. manual detetada em CI = build falha.

## Regras

| Regra | Descrição |
|-------|-----------|
| **Contrato da API gerado do OpenAPI (orval)** | Nunca schemas Zod espelhados à mão; drift detetado em CI |
| **Entidade = `z.infer` do schema de output** | Nunca interface manual paralela — não compila com `exactOptionalPropertyTypes` e deriva do schema com o tempo (validado empiricamente) |
| Zod para DTOs (input) | Schema → `z.infer` |
| **Zod para entidade (output)** | `userSchema` é a fonte de verdade — usado pelo Transporter para validar a resposta da API em runtime |
| Mensagens i18n | `'validation.minLength'` |
| Filtros tipados | `userFiltersSchema` → `z.infer` (nunca interface manual; ver §Filtros) |
| Sem `any` | NUNCA usar |
| `tsconfig` com flags strict explícitas | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` (ver topo) |
| `@ts-ignore` proibido | `@ts-expect-error` só com justificação na mesma linha |
| `type` para inferidos | `type DTO = z.infer<>` |
| `interface` para objectos | Extensível |

---

<a id="15-env"></a>

<!-- MÓDULO: 15-env -->

# ENV - Variáveis de Ambiente

## Estrutura de Ficheiros

```
project-root/
├── .env.example        # Template (commitar)
├── .env.development    # Dev (não commitar)
├── .env.production     # Prod (não commitar)
└── .env.local          # Override local (não commitar)
```

## .env.example

```bash
# API
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws

# App
VITE_APP_NAME=MyApp
VITE_APP_ENV=development

# Observabilidade (ver 11-error-handling — DSN é público por natureza, não é secret)
VITE_SENTRY_DSN=
VITE_APP_VERSION=

# Features (opcional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_MOCK=false
```

## Config Tipada

```typescript
// config/env.ts
const requiredEnvVars = ['VITE_API_URL', 'VITE_APP_NAME'] as const;

// Validar variáveis obrigatórias
requiredEnvVars.forEach((key) => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
});

export const env = {
  // API
  apiUrl: import.meta.env.VITE_API_URL as string,
  wsUrl: import.meta.env.VITE_WS_URL as string, // ver 18-websockets
  
  // App
  appName: import.meta.env.VITE_APP_NAME as string,
  appEnv: import.meta.env.VITE_APP_ENV as string || 'development',

  // Observabilidade (11-error-handling)
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  appVersion: import.meta.env.VITE_APP_VERSION as string | undefined, // injetado no CI (SHA/tag)
  
  // Flags
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // Features
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
} as const;

// Type para autocomplete
export type Env = typeof env;
```

## Uso

```typescript
import { env } from '@/config/env';

// API URL
const api = axios.create({
  baseURL: env.apiUrl,
});

// Condicional
if (env.isDev) {
  console.log('Dev mode');
}

if (env.enableAnalytics) {
  initAnalytics();
}
```

## .gitignore

```gitignore
# Env files
.env
.env.local
.env.development
.env.production

# Manter exemplo
!.env.example
```

## Segurança de build (produção)

| Item | Regra |
|------|-------|
| Sourcemaps | Nunca `sourcemap: true` em produção (expõe o código-fonte). Sem error tracking: `false`. Com Sentry/equivalente: `'hidden'` + upload dos `.map` no CI + apagar antes do deploy — ver `24-ci-quality` §Sourcemaps. Sem isto, os stack traces no Sentry chegam minificados e ilegíveis |
| HTTPS | `VITE_API_URL` em produção tem de começar por `https://` — falhar o build se não começar (ver validação abaixo) |
| Variáveis `VITE_*` | **Ficam em texto simples no bundle JS final**, visíveis a qualquer visitante que inspecione o código — nunca colocar aqui secrets/API keys privadas, mesmo que o `.env` não seja commitado. `VITE_` não significa "seguro", significa "público" |
| CSP / SRI / clickjacking | Ver secção "React/SPA-specific" no topo de `17-security` |

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // NUNCA true em produção. Sem error tracking: false.
    // Com Sentry: 'hidden' + upload no CI + apagar .map antes do deploy (ver 24-ci-quality)
    sourcemap: 'hidden',
  },
});
```

```typescript
// config/env.ts — reforçar a validação existente com o check de HTTPS
if (env.isProd && !env.apiUrl.startsWith('https://')) {
  throw new Error('VITE_API_URL deve usar HTTPS em produção');
}
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Prefixo `VITE_` | Obrigatório para expor no client — mas fica público, nunca secrets |
| .env.example | Sempre commitar como template |
| Validar obrigatórias | Falhar cedo se faltarem |
| Config tipada | Usar `env.apiUrl` não `import.meta.env` |
| Não commitar secrets | Usar .gitignore |
| HTTPS obrigatório em produção | Build falha se `VITE_API_URL` não for `https://` |
| Sourcemaps nunca `true` em produção | `false`, ou `'hidden'` + upload Sentry no CI (ver secção acima e `24-ci-quality`) |

---

<a id="16-tests"></a>

<!-- MÓDULO: 16-tests -->

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

---

<a id="17-security"></a>

<!-- MÓDULO: 17-security -->

# PROMPT MASTER — AGENTE AUDITOR DE SEGURANÇA DE SOFTWARE
> Versão 2.0 | Compatível com Claude Code, GitHub Copilot, Cursor
> Referência: OWASP Top 10 2025 · OWASP ASVS 5.0 · CWE/SANS Top 25 · NIST SP 800-115 · CVSS v3.1

---

## PARTE 1 — IDENTIDADE E MISSÃO DO ORQUESTRADOR

```
Atua como SecAuditAgent, um orquestrador especializado em auditoria de segurança de software.
A tua missão é receber código-fonte, snippets, ficheiros de configuração ou descrições de
arquitetura, e coordenar 9 skills de análise especializadas para identificar vulnerabilidades.

PRINCÍPIOS DE OPERAÇÃO:
- Analisa com mentalidade de adversário (red team thinking): pergunta sempre "como um atacante
  exploraria este código?"
- Fundamenta cada achado com evidência reproduzível e referência CWE/CVE quando aplicável; só calcula CVSS quando os dados permitem uma avaliação defensável
- Nunca fabricas vulnerabilidades — reporta apenas o que é detetável no código fornecido
- Apresenta sempre o risco em contexto de negócio: impacto para o utilizador final e para a
  organização
- Prioriza pela combinação de explorabilidade, impacto, exposição e contexto de negócio; um score CVSS é apoio, não substituto para essa análise
- Termina sempre com um Plano de Remediação ordenado por prioridade e esforço estimado

FORMATO DE RESPOSTA:
1. Executive Summary (3–5 linhas para gestão não técnica)
2. Resultados por Skill (ver Parte 2)
3. Relatório Consolidado de Achados e Risco
4. Plano de Remediação Priorizado
5. Recursos de Referência
```

---

## ADENDA — SEGURANÇA ESPECÍFICA REACT/SPA (ler primeiro para projetos deste sistema)

```
As 9 skills da Parte 2 são genéricas e cross-stack (PHP/Node/Python/Java) — cobrem o
backend e infraestrutura. Para o frontend React deste sistema (Vite + React Router,
ver 04-stack), os pontos abaixo são os que a auditoria genérica tipicamente NÃO cobre
com exemplos React reais. Aplicar esta adenda ANTES de invocar as 9 skills genéricas
para o código de frontend, e usar as 9 skills para tudo o resto (backend, infra,
dependências, CI/CD).
```

### XSS via `dangerouslySetInnerHTML` (complementa a Skill 1)

```
JSX escapa valores interpolados em texto, mas XSS também pode surgir de outros sinks DOM,
URLs/atributos construídos com dados não confiáveis, bibliotecas de terceiros ou código fora
do React. `dangerouslySetInnerHTML` é um sink de alto risco que exige revisão explícita.

// ❌ HTML de utilizador injetado sem sanitização
<div dangerouslySetInnerHTML={{ __html: comment.body }} />

// ✅ Sanitizar sempre com DOMPurify antes de usar dangerouslySetInnerHTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }} />

// ✅ Preferir sempre texto simples quando não há necessidade real de HTML
<div>{comment.body}</div>

REGRA: trate `dangerouslySetInnerHTML` sem sanitização verificável como um achado potencial.
Confirme a origem, o fluxo de dados, o contexto de renderização e a exploração antes de
atribuir severidade; uma chamada de sanitização próxima, por si só, não prova segurança.
```

### CSP para SPA servida como ficheiros estáticos (complementa a Skill 5)

```
Numa SPA (Vite) não há servidor de aplicação a adicionar headers por rota — a CSP
define-se no hosting (nginx/Vercel/Netlify/CloudFront) ou via <meta> no index.html.

<!-- index.html — mínimo viável se não houver controlo do servidor de hosting -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.exemplo.com" />

<!-- Preferível: header real no hosting (não via <meta>, que não cobre frame-ancestors) -->
Content-Security-Policy: default-src 'self'; script-src 'self'; frame-ancestors 'none';
X-Frame-Options: SAMEORIGIN
```

### SRI para scripts/fontes de terceiros carregados pela SPA (complementa a Skill 7)

```
<!-- ❌ Google Fonts/CDN scripts sem integridade verificada -->
<script src="https://cdn.jsdelivr.net/npm/algumapkg@1.2.3/dist/lib.min.js"></script>

<!-- ✅ SRI sempre que o script não é servido pelo próprio build -->
<script
  src="https://cdn.jsdelivr.net/npm/algumapkg@1.2.3/dist/lib.min.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous"></script>

Preferir sempre importar via npm + bundle (Vite) a carregar via <script> externo — SRI
só é necessária quando não há alternativa (ex.: SDK de terceiros que exige <script> tag).
```

### Clickjacking em hosting estático (complementa a Skill 5)

```
frame-ancestors na CSP (acima) já cobre a maioria dos casos. Onde o hosting não suporta
headers customizados, X-Frame-Options via configuração da plataforma (ex.: vercel.json,
netlify.toml, nginx.conf) é o fallback.
```

---

## PARTE 2 — AS 9 SKILLS ESPECIALIZADAS

### SKILL 1 · XSS — Cross-Site Scripting
```
OBJETIVO: Identificar todos os pontos onde dados de utilizador são refletidos no DOM sem
sanitização adequada, incluindo XSS refletido, armazenado e baseado em DOM.

ANALISA:
- Concatenação direta de $_GET/$_POST/$_REQUEST em HTML (PHP)
- innerHTML / document.write / eval() com dados externos (JavaScript)
- Templates sem auto-escape (Twig sem {{ }}, Blade sem {!! !!} intencional)
- Atributos HTML construídos dinamicamente (href, src, onclick, style)
- Cabeçalhos Content-Type incorretos que permitam MIME sniffing
- Ausência de Content-Security-Policy

EXEMPLOS DE VULNERABILIDADE:
  // PHP — Crítico
  echo "Bem-vindo, " . $_GET['name'];  // XSS refletido direto

  // JavaScript — Alto
  document.getElementById('msg').innerHTML = userInput;  // DOM XSS

  // Template Jinja2 — Alto
  return render_template_string("<p>" + user_data + "</p>")  // sem Markup()

CORREÇÕES ESPERADAS:
  // PHP
  echo "Bem-vindo, " . htmlspecialchars($_GET['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8');

  // JavaScript — usar textContent em vez de innerHTML
  document.getElementById('msg').textContent = userInput;

  // JavaScript — sanitização com DOMPurify quando HTML é necessário
  element.innerHTML = DOMPurify.sanitize(userInput);

  // CSP Header
  Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}';

REFERÊNCIAS: CWE-79 | OWASP A05:2025 (Injection)
```

---

### SKILL 2 · SSRF — Server-Side Request Forgery
```
OBJETIVO: Detetar situações em que a aplicação faz pedidos HTTP/HTTPS a endereços controlados
pelo utilizador, podendo expor a rede interna, metadados cloud ou serviços locais.

ANALISA:
- Funções de fetch com URL proveniente de input: file_get_contents($url), curl($url),
  requests.get(url), fetch(url), axios.get(url)
- Webhooks, importadores de URL, proxies de imagem, leitores de RSS
- Redirecionamentos que preservam o destino final sem validação
- Ausência de allowlist de domínios/IPs
- Não bloqueio de RFC 1918 (10.x, 172.16.x, 192.168.x) e 169.254.169.254 (metadados AWS/GCP)

EXEMPLOS DE VULNERABILIDADE:
  // Python — Crítico
  import requests
  url = request.args.get('webhook_url')
  r = requests.get(url)  # atacante envia http://169.254.169.254/latest/meta-data/

  // Node.js — Crítico
  const url = req.query.target;
  const response = await axios.get(url);  // sem validação

CORREÇÕES ESPERADAS:
  // Python — validação robusta
  from urllib.parse import urlparse
  import ipaddress

  ALLOWED_HOSTS = {'api.parceiro.com', 'cdn.empresa.com'}

  def validate_url(url: str) -> bool:
      parsed = urlparse(url)
      if parsed.scheme not in ('http', 'https'):
          return False
      if parsed.hostname in ALLOWED_HOSTS:
          return True
      try:
          ip = ipaddress.ip_address(parsed.hostname)
          if ip.is_private or ip.is_loopback or ip.is_link_local:
              return False
      except ValueError:
          pass
      return False

REFERÊNCIAS: CWE-918 | OWASP A01:2025 (SSRF consolidado em Broken Access Control na edição 2025)
```

---

### SKILL 3 · IDOR / Controlo de Acesso Falho
```
OBJETIVO: Identificar falhas que permitam a um utilizador autenticado aceder ou modificar
recursos de outros utilizadores (IDOR), escalar privilégios ou contornar controlos de acesso.

ANALISA:
- IDs sequenciais ou previsíveis em URLs/parâmetros sem verificação de ownership
  (GET /api/invoices/1042, DELETE /users/5)
- Falta de verificação de papel (role) antes de operações sensíveis
- Endpoints admin acessíveis sem verificação de autorização
- JWT com claims de role manipuláveis (alg:none, weak secret)
- Acesso horizontal: user A acede a dados do user B com o mesmo papel
- Acesso vertical: user normal acede a funções de administrador

EXEMPLOS DE VULNERABILIDADE:
  // Laravel — Crítico (IDOR)
  public function show($orderId) {
      $order = Order::find($orderId);  // sem verificar se pertence ao utilizador atual
      return response()->json($order);
  }

  // Express — Alto (escalada vertical)
  app.delete('/admin/users/:id', isAuthenticated, (req, res) => {
      // falta: isAdmin middleware
      User.destroy({ where: { id: req.params.id } });
  });

CORREÇÕES ESPERADAS:
  // Laravel — verificação de ownership
  public function show($orderId) {
      $order = Order::where('id', $orderId)
                    ->where('user_id', auth()->id())  // scoped ao user atual
                    ->firstOrFail();
      return response()->json($order);
  }

  // Express — middleware de autorização
  app.delete('/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
      await User.destroy({ where: { id: req.params.id } });
      res.json({ message: 'Utilizador removido' });
  });

  // Política recomendada: UUID v4 em vez de IDs sequenciais
  // Implementar RBAC com bibliotecas: Casbin, Laravel Gates/Policies, Spring Security

REFERÊNCIAS: CWE-639, CWE-284 | OWASP A01:2025 (Broken Access Control)
```

---

### SKILL 4 · Falhas Criptográficas
```
OBJETIVO: Identificar dados sensíveis expostos, algoritmos criptográficos fracos ou
obsoletos, e transmissão de dados sem proteção adequada.

ANALISA:
- Hashing de passwords com MD5, SHA-1, SHA-256 sem salt (insuficiente para passwords)
- Encriptação com DES, 3DES, RC4, ECB mode
- Chaves hardcoded no código-fonte
- Dados sensíveis em logs, URLs, localStorage, sessionStorage
- Falta de HTTPS / HSTS
- Cookies sem flags Secure e HttpOnly
- Tokens JWT com algoritmo 'none' ou secret fraco
- Dados PII em texto claro em base de dados

EXEMPLOS DE VULNERABILIDADE:
  // PHP — Crítico
  $hashedPassword = md5($password);  // quebrável com rainbow tables

  // Python — Alto
  SECRET_KEY = "mysecretkey123"  // hardcoded, vai para o git
  token = base64.encode(user_data)  // não é encriptação!

  // Node.js — Alto
  const cipher = crypto.createCipheriv('des', key, iv);  // DES obsoleto

CORREÇÕES ESPERADAS:
  // PHP — Argon2id (recomendado NIST 2024)
  $hashedPassword = password_hash($password, PASSWORD_ARGON2ID, [
      'memory_cost' => 65536,
      'time_cost'   => 4,
      'threads'     => 2,
  ]);
  // Verificar:
  password_verify($password, $hashedPassword);

  // Python — variáveis de ambiente + Fernet (AES-128-CBC + HMAC)
  from cryptography.fernet import Fernet
  import os
  key = os.environ.get('ENCRYPTION_KEY').encode()
  f = Fernet(key)
  encrypted = f.encrypt(sensitive_data.encode())

  // Cabeçalhos HTTP obrigatórios
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Set-Cookie: session=xxx; Secure; HttpOnly; SameSite=Strict

REFERÊNCIAS: CWE-327, CWE-798 | OWASP A04:2025 (Cryptographic Failures); ASVS 5.0 §6
```

---

### SKILL 5 · Configuração Incorreta de Segurança
```
OBJETIVO: Detetar configurações por omissão inseguras, headers HTTP em falta, mensagens
de erro excessivamente detalhadas e contas/credenciais padrão.

ANALISA:
- APP_DEBUG=true ou equivalente em produção (stack traces expostos)
- Credenciais padrão em bases de dados, admin panels (admin/admin, root/root)
- Cabeçalhos de segurança HTTP em falta (CSP, HSTS, X-Frame-Options, etc.)
- CORS configurado com '*' sem restrição
- Directory listing ativo no servidor web
- Serviços de debug expostos (phpinfo(), /.env, /actuator, /_debug_toolbar)
- Permissões de ficheiros incorretas (777 em uploads, .git exposto)

EXEMPLOS DE VULNERABILIDADE:
  # .env exposto — Crítico
  APP_DEBUG=true
  DB_PASSWORD=root
  AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI...

  # nginx.conf — Alto
  location / {
      autoindex on;  # directory listing ativo
  }

  # Express — Alto
  app.use(cors());  // permite qualquer origem

CORREÇÕES ESPERADAS:
  # Cabeçalhos de segurança completos (nginx)
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
  add_header Content-Security-Policy "default-src 'self'; ..." always;

  # CORS restrito (Express)
  app.use(cors({
      origin: ['https://app.empresa.com', 'https://admin.empresa.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
  }));

  # Verificação com ferramentas
  # securityheaders.com | observatory.mozilla.org | SSL Labs

REFERÊNCIAS: CWE-16, CWE-209 | OWASP A02:2025 (Security Misconfiguration); ASVS 5.0 §14
```

---

### SKILL 6 · Componentes Vulneráveis e Desatualizados
```
OBJETIVO: Identificar dependências com CVEs conhecidos, versões obsoletas de frameworks
e bibliotecas, e ausência de processos de atualização automática.

ANALISA:
- package.json, composer.json, requirements.txt, pom.xml, Cargo.toml
- Versões de runtime (Node.js EOL, Python 2.x, PHP 7.x)
- CVEs críticos conhecidos (Log4Shell, Text4Shell, Spring4Shell, etc.)
- Ausência de lock files (package-lock.json, composer.lock)
- Dependências transitivas vulneráveis

COMANDOS DE AUDITORIA:
  # Node.js
  npm audit --audit-level=high
  npx snyk test

  # PHP / Composer
  composer audit
  local-php-security-checker

  # Python
  pip-audit
  safety check

  # Java / Maven
  mvn org.owasp:dependency-check-maven:check

  # Multi-plataforma
  trivy fs .
  grype .

CVEs CRÍTICOS DE REFERÊNCIA (verificar sempre):
  - CVE-2021-44228 (Log4Shell) — Apache Log4j 2.x < 2.17.1
  - CVE-2022-22965 (Spring4Shell) — Spring Framework < 5.3.18
  - CVE-2022-42889 (Text4Shell) — Apache Commons Text < 1.10.0
  - CVE-2021-41773 (Path Traversal) — Apache HTTP Server 2.4.49

AUTOMAÇÃO RECOMENDADA:
  # GitHub Actions — Dependabot + CodeQL
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
        interval: "weekly"
      open-pull-requests-limit: 10

REFERÊNCIAS: CWE-1035 | OWASP A03:2025 (Software Supply Chain Failures) | CVSS variável por CVE
```

---

### SKILL 7 · Integridade de Software e Dados
```
OBJETIVO: Verificar se o processo de build, deploy e atualizações garante que código
malicioso não pode ser inserido na cadeia de fornecimento (supply chain).

ANALISA:
- Ausência de verificação de checksums/hashes em dependências
- Scripts de CI/CD que executam código de fontes não verificadas
- Ausência de assinatura de artefactos (code signing)
- Deserialização insegura de dados não confiáveis
- CDN scripts sem Subresource Integrity (SRI)
- Pipelines com secrets expostos em logs

EXEMPLOS DE VULNERABILIDADE:
  <!-- HTML — Alto: CDN sem SRI -->
  <script src="https://cdn.jquery.com/jquery.min.js"></script>

  // Node.js — Crítico: deserialização insegura
  const obj = eval('(' + userInput + ')');  // RCE potencial
  const obj = require('serialize-javascript').unserialize(input);  // se não validado

  # CI/CD — Alto: script externo não verificado
  curl https://external-site.com/install.sh | bash

CORREÇÕES ESPERADAS:
  <!-- SRI correto -->
  <script
    src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"
    integrity="sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs"
    crossorigin="anonymous">
  </script>

  // Deserialização segura — JSON apenas com schema validation
  import Joi from 'joi';
  const schema = Joi.object({ id: Joi.number(), name: Joi.string().max(100) });
  const { error, value } = schema.validate(JSON.parse(input));

  # CI/CD seguro — verificar hash antes de executar
  curl -fsSL https://example.com/install.sh -o install.sh
  echo "SHA256_ESPERADO  install.sh" | sha256sum --check
  bash install.sh

  # Frameworks SLSA Level 3+
  # SBOM com: syft, cyclonedx-cli
  # Assinatura com: cosign (Sigstore)

REFERÊNCIAS: CWE-494, CWE-502 | OWASP A08:2025 (Software or Data Integrity Failures)
```

---

### SKILL 8 · Testes de Segurança Automatizados
```
OBJETIVO: Avaliar e recomendar a integração de testes de segurança no ciclo de
desenvolvimento (DevSecOps), incluindo SAST, DAST, IAST e análise de secrets.

AVALIA:
- Presença de pipeline CI/CD e se inclui etapas de segurança
- Cobertura de SAST (análise estática do código)
- Cobertura de DAST (análise dinâmica da aplicação em execução)
- Análise de secrets/credenciais em commits e histórico git
- Testes de regressão de segurança para vulnerabilidades corrigidas

FERRAMENTAS POR CATEGORIA:
  SAST (análise estática):
    - Semgrep (multi-linguagem, regras OWASP) — open source
    - SonarQube / SonarCloud — integração IDE + CI
    - Bandit (Python) | ESLint Security (JS) | PHPCS Security Audit

  DAST (análise dinâmica):
    - OWASP ZAP (Zed Attack Proxy) — open source, API disponível
    - Burp Suite Professional — manual + automação
    - Nuclei — templates CVE, rápido

  Secrets scanning:
    - GitLeaks | TruffleHog — histórico git + pre-commit hooks
    - GitHub Advanced Security Secret Scanning

  SCA (Software Composition Analysis):
    - OWASP Dependency-Check | Snyk | Socket.dev

EXEMPLO PIPELINE CI/CD COMPLETO (GitHub Actions):
  # .github/workflows/security.yml
  name: Security Audit

  on: [push, pull_request]

  jobs:
    sast:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        - name: Semgrep SAST
          uses: semgrep/semgrep-action@713efdd345f3035192eaa63f56867b88e63e4e5d # v1
          with:
            config: "p/owasp-top-ten p/php p/javascript"

    secrets:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
          with: { fetch-depth: 0 }
        - name: GitLeaks
          uses: gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7 # v2

    deps:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        - name: OWASP Dependency-Check
          uses: dependency-check/Dependency-Check_Action@1e54355a8b4c8abaa8cc7d0b70aa655a3bb15a6c # main pin 2026-10-25
          with:
            project: 'MyApp'
            path: '.'
            format: 'HTML'
            args: '--failOnCVSS 7'

    dast:
      runs-on: ubuntu-latest
      needs: [sast]
      steps:
        - name: ZAP Baseline Scan
          uses: zaproxy/action-baseline@66042c8e7e24680119199a017e5b0e8603bf4dae # v0.12.0
          with:
            target: 'https://staging.empresa.com'
            rules_file_name: '.zap/rules.tsv'

REFERÊNCIAS: OWASP DevSecOps Guideline | NIST SP 800-204D
```

---

### SKILL 9 · Segurança de Micro APIs
```
OBJETIVO: Verificar se a comunicação entre microserviços é autenticada, autorizada e
protegida contra ataques específicos a arquiteturas distribuídas.

ANALISA:
- Autenticação service-to-service (mTLS, JWT com claims de serviço, API keys rotativas)
- Autorização granular por endpoint (não apenas autenticação global)
- Rate limiting por serviço chamador (não apenas por IP global)
- Validação e sanitização de input em cada microserviço individualmente
- Exposição de endpoints internos na rede pública
- Segurança do service mesh (Istio, Linkerd, Consul Connect)
- Gestão de secrets (Vault, AWS Secrets Manager, Kubernetes Secrets encriptados)

EXEMPLOS DE VULNERABILIDADE:
  // Express Microservice — Crítico: sem autenticação interna
  app.get('/internal/users/all', (req, res) => {
      // acessível sem token — qualquer serviço (ou atacante) pode chamar
      User.findAll().then(users => res.json(users));
  });

  // gRPC — Alto: sem TLS
  const server = new grpc.Server();
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), ...);

  // REST Gateway — Alto: sem rate limiting por consumer
  app.use('/api/', proxyMiddleware);  // sem throttle

CORREÇÕES ESPERADAS:
  // JWT service-to-service (Node.js)
  const verifyServiceToken = (req, res, next) => {
      const token = req.headers['x-service-token'];
      if (!token) return res.status(401).json({ error: 'Token obrigatório' });

      try {
          const payload = jwt.verify(token, process.env.SERVICE_SECRET, {
              audience: 'users-service',
              issuer: 'auth-service',
          });
          if (!['orders-service', 'billing-service'].includes(payload.sub)) {
              return res.status(403).json({ error: 'Serviço não autorizado' });
          }
          req.caller = payload.sub;
          next();
      } catch (err) {
          return res.status(401).json({ error: 'Token inválido' });
      }
  };

  app.get('/internal/users/all', verifyServiceToken, requireRole('admin'), (req, res) => {
      User.findAll().then(users => res.json(users));
  });

  // Rate limiting granular por consumer (express-rate-limit)
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      keyGenerator: (req) => req.caller || req.ip,  // por serviço chamador
      standardHeaders: true,
      legacyHeaders: false,
  });

  // mTLS com gRPC
  const credentials = grpc.ServerCredentials.createSsl(
      fs.readFileSync('ca.crt'),
      [{ private_key: fs.readFileSync('server.key'), cert_chain: fs.readFileSync('server.crt') }],
      true  // requireClientCert
  );

  // Checklist API Gateway:
  // [✓] Autenticação: OAuth2 / JWT / mTLS
  // [✓] Autorização: OPA (Open Policy Agent) por endpoint
  // [✓] Rate limiting: por consumer, por IP, por tenant
  // [✓] Input validation: JSON Schema / Zod / Joi em cada serviço
  // [✓] Secrets: nunca hardcoded — usar Vault / env vars encriptadas
  // [✓] Observabilidade: logs estruturados + distributed tracing (OpenTelemetry)

REFERÊNCIAS: CWE-306, CWE-345 | OWASP API Security Top 10 2023
```

---

## PARTE 3 — FORMATO DO RELATÓRIO FINAL CONSOLIDADO

```
Quando todas as skills tiverem sido executadas, consolida os resultados no seguinte formato:

═══════════════════════════════════════════════════════
  RELATÓRIO DE AUDITORIA DE SEGURANÇA
  Gerado por: SecAuditAgent v2.0
  Referência: OWASP Top 10 2021 · CVSS v3.1
═══════════════════════════════════════════════════════

## 1. EXECUTIVE SUMMARY
[3–5 linhas em linguagem de negócio. Ex: "Foram identificadas X vulnerabilidades, sendo Y
de nível Crítico. A principal ameaça é [nome] que pode resultar em [impacto de negócio].
Recomenda-se ação imediata nas issues #1 e #2 antes do próximo deploy."]

## 2. RESUMO ESTATÍSTICO
| Nível    | Count | Skills Afetadas             |
|----------|-------|-----------------------------|
| Crítico  | X     | XSS, IDOR, SSRF, MicroAPIs  |
| Alto     | X     | Crypto, Config, Deps        |
| Médio    | X     | Integrity, Tests            |
| Baixo    | X     | -                           |
| Total    | X     |                             |

## 3. VULNERABILIDADES POR SKILL
[Para cada vulnerabilidade encontrada:]

### [ID] [NÍVEL] — [Título descritivo]
- **CWE:** CWE-XXX — [Nome]
- **Localização:** ficheiro.php linha 42 / endpoint /api/v1/users
- **Descrição:** [O que está errado e porquê é perigoso]
- **Prova de Conceito:** [Payload ou passo-a-passo para reproduzir]
- **Impacto:** [O que um atacante pode fazer]
- **Risco e confiança:** [explorabilidade, impacto, exposição e limitações da evidência; incluir CVSS apenas se calculado com dados suficientes]
- **Remediação:** [Como corrigir com exemplo de código]
- **Referências:** [OWASP, CVE, documentação]

## 4. PLANO DE REMEDIAÇÃO PRIORIZADO
| # | Vulnerabilidade | Prioridade | Esforço | Responsável | Prazo |
|---|-----------------|------------|---------|-------------|-------|
| 1 | [Nome]          | Crítica    | 2h      | Dev Backend | 24h   |
| 2 | [Nome]          | Crítica    | 4h      | DevOps      | 48h   |
| 3 | [Nome]          | Alto       | 1 dia   | Dev Frontend| 1 sem |

## 5. MELHORIAS ESTRUTURAIS (LONGO PRAZO)
- [ ] Implementar pipeline DevSecOps com SAST/DAST
- [ ] Adotar política de Least Privilege em todos os serviços
- [ ] Estabelecer processo de gestão de dependências (Dependabot)
- [ ] Formação da equipa em OWASP Top 10
- [ ] Pentest externo semestral

## 6. RECURSOS E REFERÊNCIAS
- OWASP Top 10 2021: https://owasp.org/Top10/
- OWASP API Security Top 10: https://owasp.org/API-Security/
- CVSS Calculator: https://www.first.org/cvss/calculator/3.1
- CWE List: https://cwe.mitre.org/top25/archive/2023/
- NIST NVD: https://nvd.nist.gov/
```

---

## PARTE 4 — INSTRUÇÕES DE USO NO CLAUDE CODE / COPILOT

### Uso básico
```
# Auditar um ficheiro específico
"Usa o SecAuditAgent para analisar o ficheiro auth.php e executar todas as 9 skills"

# Auditar um endpoint
"Analisa este endpoint Express com foco nas Skills 3 (IDOR) e 9 (Micro APIs)"

# Modo rápido — só riscos críticos
"Executa apenas as skills que possam revelar risco crítico neste código; justifica cada inclusão"

# Auditar configuração
"Analisa o docker-compose.yml e nginx.conf com a Skill 5 (Configuração Incorreta)"
```

### Prompts avançados para Claude Code
```
# Análise de PR/diff
"Atua como SecAuditAgent. Analisa este diff de Pull Request e identifica vulnerabilidades
introduzidas, referenciando as skills relevantes e a evidência, impacto e confiança de cada uma."

# Modo fix automático
"Atua como SecAuditAgent. Analisa o ficheiro [nome], identifica vulnerabilidades com as
9 skills e gera automaticamente o código corrigido para cada issue encontrada, mantendo
a lógica de negócio intacta."

# Relatório para gestão
"Corre o SecAuditAgent em modo Executive: foco no Executive Summary e Plano de Remediação.
Técnico mínimo, impacto de negócio máximo."

# Integração CI/CD
"Gera um script bash que usa o SecAuditAgent como step de CI/CD, falhando o build se
encontrar vulnerabilidades de nível Crítico ou Alto."
```

Não presumas que existe uma integração automática, um `CLAUDE.md` ou um limiar de CI só por
usar esta skill. Liga auditorias e gates apenas quando houver scripts, configuração e evidência
real no repositório; documenta esses mecanismos fora desta skill.

---

<a id="18-websockets"></a>

<!-- MÓDULO: 18-websockets -->

# WebSocket ligado a sessao

Ler [auth](08-auth/SKILL.md) e [query](07-react-query/SKILL.md).
Usar [socket-client.ts](18-websockets/references/socket-client.ts) e
[SocketProvider.tsx](18-websockets/references/SocketProvider.tsx) como base testavel.

## Protocolo e ciclo de vida

- O provider so liga depois de restaurar a sessao. Mudanca de utilizador ou logout desliga.
- Token enviado na primeira mensagem, nunca na URL. Producao exige wss://.
- O servidor responde auth:ok ou auth:error. So emitir connected e permitir mensagens
  de negocio depois de auth:ok. Validar payloads por evento com schemas do projeto.
- Reconexao com backoff e jitter, maximo de tentativas. disconnect cancela timers,
  remove callbacks antigos e fecha a ligacao. Chamar connect novamente permite reinicio explicito.
- A autenticacao e reavaliada em cada ligacao. O backend deve definir como expira
  e revalida autorizacao durante sockets longos; auth:error exige recuperar a sessao
  ou apresentar erro, sem loop automatico ilimitado.

## Subscricoes e cache

Montar uma subscricao por evento, devolver o unsubscribe no cleanup do useEffect.
Eventos de alteracao invalidam a query correspondente. Usar tipos readonly:
`Record<string, ReadonlyArray<readonly unknown[]>>`.

Para rooms, registar um listener de connected que volta a enviar join-room apos
cada autenticacao/reconexao. Devolver cleanup que remove o listener e envia leave-room
se a ligacao estiver autenticada. Nao depender apenas da identidade do objeto socket.

Chat e cotacoes podem atualizar estado diretamente quando refetch por evento seria
excessivo; validar o payload, definir limites de memoria e reconciliacao apos reconnect.
Nao assumir que o generico TypeScript valida JSON recebido.

## Testes

A suite verifica cancelamento de reconexao, callbacks antigos, autenticacao antes de
mensagens e limite de tentativas. Testar tambem expiracao de sessao no servidor,
reentrada em rooms e recuperacao apos perda de eventos na aplicacao integrada.
React Native necessita de adapters de credenciais e ciclo de vida proprios;
esta referencia e React web e nao promete compatibilidade automatica.

---

<a id="19-solid"></a>

<!-- MÓDULO: 19-solid -->

# SOLID Principles — Aplicado a React (Page → Hook → Transporter)

## Objetivo

Garantir que a arquitetura definida em `01-architecture` (Pages → Hooks → Transporters → Backend API) se mantém limpa, escalável, testável e fácil de manter através da aplicação rigorosa dos princípios SOLID às camadas reais deste sistema — **não a um backend Python/FastAPI**. Este módulo é 100% frontend, consistente com o resto do sistema.

## 1. Single Responsibility Principle (SRP)

> *Um módulo deve ter apenas uma razão para mudar.*

| Camada | Responsabilidade única |
|--------|------------------------|
| **Pages** | Renderizar, compor componentes, ler hooks. Nunca lógica de negócio nem HTTP. |
| **Hooks** | Estado, side effects, chamar 1 transporter. `1 hook = 1 operação` (já é regra em `03-domain-structure`). |
| **Transporters** | HTTP + validar a forma da resposta (Zod, ver `06-patterns`). Nunca lógica de negócio. |
| **Components** | UI reutilizável e sem estado de negócio. |

```typescript
// ❌ Viola SRP — o hook decide navegação E mostra toast (não é "estado do domínio")
export const useCreateUser = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: usersTransporter.create,
    onSuccess: () => {
      addToast({ type: 'success', message: 'Criado!' });
      navigate('/users');
    },
  });
};

// ✅ Cumpre SRP — o hook só trata do estado da mutation; navegação/toast ficam na Page
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersTransporter.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
};
```

## 2. Open-Closed Principle (OCP)

> *Aberto para extensão, fechado para modificação.*

- Estender comportamento via **props/composição**, nunca via `if/else`/`switch` crescente dentro de um componente ou hook já existente.
- Um novo domínio (`03-domain-structure`) adiciona ficheiros novos (`useCreateContact.ts`, `contactsTransporter.ts`) — nunca modifica os hooks/transporters de `users` para "também servir" contacts.

```typescript
// ❌ Viola OCP — cada novo tipo de notificação exige editar esta função
const notify = (type: string, msg: string) => {
  if (type === 'email') sendEmail(msg);
  else if (type === 'sms') sendSms(msg);
  else if (type === 'push') sendPush(msg);
};

// ✅ Cumpre OCP — novo canal = nova implementação, sem tocar nas existentes
interface NotificationChannel { send: (msg: string) => Promise<void>; }
const channels: Record<string, NotificationChannel> = { email, sms, push };
const notify = (type: string, msg: string) => {
  const channel = channels[type];
  if (!channel) throw new Error('Unknown notification channel');
  return channel.send(msg);
};
```

- No UI, o `Button` de `06-patterns` já segue OCP: novas variantes (`variant="primary" | "secondary" | "danger"`) estendem o componente via prop, sem criar `PrimaryButton`/`DangerButton` duplicados.

## 3. Liskov Substitution Principle (LSP)

> *Uma implementação deve poder substituir outra da mesma família sem quebrar quem a usa.*

- Todos os hooks `useGet{Domain}s` devolvem o mesmo "contrato" (`data`, `isLoading`, `error`, `refetch`) porque envolvem `useQuery` — um componente de lista (`UsersList`, `ContactsList`) pode assumir sempre essa forma, seja qual for o domínio.
- Componentes de formulário que partilham a mesma interface de props (`label`, `error`, `...rest`) — `Input`, `Select`, `Textarea` — devem poder ser trocados dentro de um `<UserForm>` sem alterar a lógica do formulário.

```typescript
// Contrato comum que qualquer useGet{Domain} deve respeitar
interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
// UsersList e ContactsList podem partilhar o mesmo componente de loading/error/empty
// (ver 12-loading-states) precisamente porque o contrato é consistente entre domínios.
```

## 4. Interface Segregation Principle (ISP)

> *Várias interfaces pequenas e coesas são melhores que uma interface geral.*

- Types por domínio em ficheiros separados (`user.types.ts`, `contact.types.ts` — ver `14-types`), nunca um `types/index.ts` com um único type gigante que mistura tudo.
- Props de componentes segregadas: um `Modal` genérico não deve receber props específicas de `ConfirmDialog` (`onConfirm`, `confirmLabel`) — essas ficam no componente que compõe o `Modal`, não no `Modal` em si.

```typescript
// ❌ Viola ISP — força todo o consumidor de Modal a conhecer props de confirmação
interface ModalProps {
  isOpen: boolean; onClose: () => void;
  onConfirm?: () => void; confirmLabel?: string; isDangerous?: boolean; // só usado por 1 caso
}

// ✅ Cumpre ISP — Modal fica genérico; ConfirmDialog compõe Modal e adiciona o que é seu
interface ModalProps { isOpen: boolean; onClose: () => void; children: ReactNode; }
interface ConfirmDialogProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; message: string; }
const ConfirmDialog = (props: ConfirmDialogProps) => <Modal isOpen={props.isOpen} onClose={props.onClose}>...</Modal>;
```

## 5. Dependency Inversion Principle (DIP)

> *Módulos de alto nível não devem depender de módulos de baixo nível — ambos dependem de abstrações.*

- **Hooks dependem da assinatura do Transporter (a abstração), nunca do `axios` diretamente.** É isto que torna o mock em `16-tests` possível (`vi.mock('@/services/transporters/users', ...)`) — se o hook chamasse `axios.get` diretamente, o mock teria de intercetar a rede em vez do módulo.

```typescript
// ✅ Hook depende da abstração "usersTransporter", não de axios
export const useGetUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => usersTransporter.getAll(filters), // abstração
  });
};

// Em teste (16-tests), a abstração é trocada por um mock sem tocar no hook:
vi.mock('@/services/transporters/users', () => ({
  usersTransporter: { getAll: vi.fn() },
}));
```

- O mesmo vale para o `AuthContext` (`08-auth`): o `login()` do contexto depende de `authTransporter.login`, não de `axios.post('/auth/login')` embutido no componente.

## Checklist SOLID por camada

```
□ Pages nunca chamam axios/transporter diretamente (sempre via Hook) — SRP + DIP
□ Hooks fazem 1 operação cada, sem lógica de UI (toast/navigate) misturada — SRP
□ Novo domínio = novos ficheiros, nunca editar hooks/transporters de outro domínio — OCP
□ Hooks da mesma família (useGet*, useCreate*) devolvem sempre o mesmo formato — LSP
□ Types e props segregados por domínio/componente, sem "interfaces gigantes" — ISP
□ Hooks importam o Transporter (abstração), nunca axios diretamente — DIP
```

---

<a id="20-rules"></a>

<!-- MÓDULO: 20-rules -->

# RULES - Regras Absolutas

## ✅ SEMPRE

| # | Regra |
|---|-------|
| 1 | Tipar TUDO (sem `any`) |
| 2 | React Query para dados do servidor |
| 3 | Lógica nos hooks, não nas pages |
| 4 | Aliases `@/` para imports |
| 5 | i18n para TODOS os textos |
| 6 | Tratar 4 estados: loading, error, empty, success |
| 7 | Validar forms **e respostas de API** com Zod (`schema.parse` no transporter — ver `06-patterns`/`14-types`) |
| 8 | Access token em memória (não localStorage) |
| 9 | `withCredentials: true` no Axios **só** para origens autorizadas (baseURL fixa no transporte; cookies/credenciais nunca devem poder ir para um host arbitrário — ver `17-security` §CORS) |
| 10 | `index.ts` em cada pasta |
| 11 | 1 hook = 1 ficheiro |
| 12 | 1 domínio = estrutura espelhada (hooks/transporters/types) |
| 13 | Named exports (não default) |
| 14 | Invalidar queries após mutations |
| 15 | ErrorBoundary no root |
| 16 | Confirmar ações destrutivas (delete) com `ConfirmDialog` antes de disparar a mutation |

## ❌ NUNCA

| # | Regra |
|---|-------|
| 1 | Tokens em localStorage/sessionStorage |
| 2 | HTTP directo nas pages |
| 3 | Usar `any` |
| 4 | Strings hardcoded (usar i18n) |
| 5 | Lógica de negócio em components |
| 6 | Esquecer invalidar queries após mutations |
| 7 | Imports relativos longos (`../../../`) |
| 8 | Components > 200 linhas |
| 9 | Hooks > 100 linhas |
| 10 | Misturar responsabilidades entre camadas |
| 11 | Default exports |
| 12 | Console.log em produção |
| 13 | Silenciar erros sem feedback |
| 14 | Hardcoded roles (definir no Context) |
| 15 | Chamar `useDelete{Domain}.mutate()` direto num `onClick` sem `ConfirmDialog` |
| 16 | `dangerouslySetInnerHTML` sem sanitizacao adequada; rever tambem URLs perigosas, sinks DOM e bibliotecas de terceiros (ver `17-security`) |
| 17 | `// @ts-ignore` — usar `@ts-expect-error` com justificação na mesma linha (ver `14-types`) |
| 18 | Analytics/tracking a carregar antes do opt-in de consentimento (ver `26-privacy`) |

## Checklist de Implementação

Antes de considerar código completo, verificar:

```
□ Estrutura de pastas correcta
□ Types definidos com Zod (input de forms E schema de entidade/output)
□ Transporter valida a resposta da API com `schema.parse()` — nunca `return data` direto
□ i18n para todos os textos
□ React Query para dados
□ 4 estados UI tratados
□ Auth com memory + httpOnly
□ Formulários com RHF + Zod
□ @/ imports
□ index.ts exports
□ Domínio espelhado (hooks/transporters/types)
□ ErrorBoundary presente
□ Lazy loading nas routes
□ Ações destrutivas (delete) passam por ConfirmDialog
□ dangerouslySetInnerHTML só com DOMPurify (idealmente: nenhum)
□ Analytics só após consentimento (26-privacy)
```

## Checklist: Novo Domínio

```
□ src/hooks/{domain}/
□ src/services/transporters/{domain}/
□ src/types/{domain}/
□ Query keys em _queryKeys.ts
□ Traduções em lang/*.json
```

## Checklist: Nova Page

```
□ pages/{Page}/{Page}.tsx
□ Hook(s) correspondente(s)
□ Rota em routes.config.tsx
□ Traduções
□ 4 estados (loading/error/empty/success)
```

## Checklist: Novo Component

```
□ UI/components/{Component}/{Component}.tsx
□ UI/components/{Component}/index.ts
□ Props tipadas com interface
□ Tailwind para estilos
□ Acessibilidade básica (aria, roles)
```

---

<a id="21-react-auth-page"></a>

<!-- MÓDULO: 21-react-auth-page -->

# Pagina de autenticacao

Aplicar [08-auth](08-auth/SKILL.md), [10-forms](10-forms/SKILL.md),
[09-i18n](09-i18n/SKILL.md) e [23-accessibility](23-accessibility/SKILL.md).

A [referencia compilada](21-react-auth-page/references/AuthPage.template.tsx) implementa apenas login,
com React Hook Form, Zod, labels associados e mensagens traduzidas. O callback
login deve chamar o cliente de 08-auth; nao existe sucesso simulado nem persistencia
de tokens. Injetar traducoes reais e integrar os tokens Tailwind do projeto.

Registo e recuperacao sao extensoes, nao funcionalidades prontas do template:
confirmar endpoints, schemas, politica de password e respostas neutras anti-enumeracao.
Nao inventar OAuth, backend PHP, endpoints ou ficheiros ausentes.
Reutilizar o unico AuthProvider do projeto. Restore usa /auth/session para obter
utilizador e token; /auth/refresh devolve apenas token. O interceptor reage a 401,
nao e um temporizador preventivo de expiracao.

Antes de entregar: testar validacao, submissao unica, erro generico sem texto
do servidor, estado pendente, teclado, traducoes e contrato real do backend.
Esta referencia SPA nao implica suporte pronto a SSR/Next.js.

---

<a id="22-performance"></a>

<!-- MÓDULO: 22-performance -->

# PERFORMANCE - Core Web Vitals e Otimização

## Core Web Vitals — metas

| Métrica | O que mede | Meta ("Good") | Como medir |
|---------|------------|----------------|------------|
| **LCP** (Largest Contentful Paint) | Tempo até o maior elemento visível renderizar | < 2.5s | `web-vitals` lib, Lighthouse CI, Chrome DevTools |
| **INP** (Interaction to Next Paint) | Responsividade a interações (substituiu o FID) | < 200ms | `web-vitals` lib, Chrome UX Report |
| **CLS** (Cumulative Layout Shift) | Estabilidade visual (elementos a saltar) | < 0.1 | `web-vitals` lib, Lighthouse |

```typescript
// main.tsx — reportar métricas reais (RUM)
import { onLCP, onINP, onCLS } from 'web-vitals';

const reportVital = (metric: { name: string; value: number }) => {
  if (env.isDev) return;
  // enviar para analytics/observability (ex.: Sentry, Datadog, endpoint próprio)
  navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
};

onLCP(reportVital);
onINP(reportVital);
onCLS(reportVital);
```

Gate recomendado em CI: `lighthouse-ci` com `assertions` de LCP/CLS/INP no build de produção, falhando o pipeline se regredir acima da meta.

## QueryClient — defaults globais (não deixar implícito)

**Regra:** `lib/queryClient.ts` define sempre `defaultOptions` explícitos — nunca depender dos defaults do TanStack Query (`staleTime: 0`, `refetchOnWindowFocus: true`), que geram refetch excessivo em apps com muitas queries visíveis ao mesmo tempo.

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

import type { AxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30s — dados "frescos" sem refetch automático
      gcTime: 5 * 60 * 1000,      // 5min — tempo em cache após deixar de ter observers
      refetchOnWindowFocus: false, // evita refetch ao trocar de separador em apps internas

      // Retry CLASSIFICADO — repetir um 400/404 é inútil (o pedido está errado);
      // um erro de rede ou 5xx é transitório e merece nova tentativa com backoff.
      retry: (failureCount, error) => {
        const status = (error as AxiosError).response?.status;
        if (status && status >= 400 && status < 500) return false; // 4xx: nunca repetir
        return failureCount < 2;                                    // rede/5xx: 2 tentativas
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000), // backoff exponencial, teto 8s
    },
    mutations: {
      retry: 0, // mutations nunca se repetem automaticamente (risco de duplicar escrita)
    },
  },
});
```

Overrides específicos (ex.: `staleTime: 0` para dados que mudam a cada segundo) continuam a poder ser passados por hook — isto é só a base sensata.

## Re-renders — quando usar memo/useCallback/useMemo

| Situação | Usar | Não usar quando |
|----------|------|------------------|
| Componente de item de lista (`UserCard`) renderizado dezenas/centenas de vezes | `React.memo` | Lista pequena (<20 itens) — o custo de comparação de props supera o ganho |
| Função passada como prop para um componente memoizado | `useCallback` | Função só usada localmente, nunca passada como prop |
| Cálculo custoso derivado de props/estado (ordenação, agregação) | `useMemo` | Cálculo trivial — `useMemo` tem o seu próprio overhead |

```typescript
// UI/components/UserCard/UserCard.tsx
import { memo } from 'react';

interface UserCardProps { user: User; onSelect: (id: string) => void; }

export const UserCard = memo(({ user, onSelect }: UserCardProps) => {
  return <div onClick={() => onSelect(user.id)}>{user.name}</div>;
});
```

```typescript
// Page que renderiza a lista — onSelect estável entre renders para o memo funcionar
const handleSelect = useCallback((id: string) => setSelectedId(id), []);
```

## Zustand — seletores (evitar subscrição ao store inteiro)

**Regra:** ler sempre uma fatia do store via seletor, nunca o store completo — subscrever tudo re-renderiza o componente sempre que qualquer campo muda, mesmo os que não usa.

```typescript
// store/uiStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

```typescript
// ❌ Subscreve o store inteiro — re-renderiza em qualquer mudança (ex.: mudar tema re-renderiza a Sidebar)
const { sidebarOpen, toggleSidebar } = useUIStore();

// ✅ Seletor — só re-renderiza quando sidebarOpen muda
const sidebarOpen = useUIStore((s) => s.sidebarOpen);
const toggleSidebar = useUIStore((s) => s.toggleSidebar);
```

## Debounce — implementação de referência

`hooks/common/useDebounce.ts` é referido por nome em `03-domain-structure` — esta é a implementação:

```typescript
// hooks/common/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

```typescript
// Uso em pesquisa (combinar com filtros na URL — ver 07-react-query)
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);

useEffect(() => {
  updateFilter({ search: debouncedSearch }); // só escreve na URL após 300ms de silêncio
}, [debouncedSearch]);
```

O mesmo padrão aplica-se a `throttle` em `scroll`/`resize` (ex.: `useThrottle` ou uma lib como `lodash.throttle`), evitando handlers custosos a disparar a cada pixel.

## Imagens

```tsx
// ❌ Sem dimensões explícitas — causa Cumulative Layout Shift ao carregar
<img src={user.avatar} alt={user.name} />

// ✅ Dimensões explícitas + lazy loading nativo + formato moderno com fallback
<img
  src={user.avatar}
  alt={user.name}
  width={48}
  height={48}
  loading="lazy"
  decoding="async"
/>

// Para imagens acima da dobra (LCP candidate) — nunca lazy, carregar prioritário
<img src={heroImage} alt="" width={1200} height={600} fetchPriority="high" />
```

```html
<!-- Formatos modernos com fallback -->
<picture>
  <source srcSet="/banner.avif" type="image/avif" />
  <source srcSet="/banner.webp" type="image/webp" />
  <img src="/banner.jpg" alt="Banner" width={1200} height={400} loading="lazy" />
</picture>

<!-- Responsive: o browser escolhe o tamanho certo — nunca servir 1200px a um ecrã de 400 -->
<img
  src="/banner-800.webp"
  srcSet="/banner-400.webp 400w, /banner-800.webp 800w, /banner-1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, 800px"
  alt="Banner" width={800} height={300} loading="lazy"
/>
```

## Web fonts — sem FOIT/CLS

**Regra:** fontes self-hosted via npm (`@fontsource/*`), nunca via CDN de terceiros (`fonts.googleapis.com`) — alinha com a preferência npm+bundle de `17-security` §SRI, elimina um request third-party e o risco de FOIT quando o CDN está lento.

```typescript
// main.tsx — importa só os pesos usados, não a família inteira
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
```

```html
<!-- index.html — preload da fonte do texto acima da dobra (candidata a LCP) -->
<link rel="preload" href="/assets/inter-400.woff2" as="font" type="font/woff2" crossorigin />
```

- `@fontsource` já usa `font-display: swap` — o texto renderiza logo com a fonte de fallback (sem FOIT).
- Para eliminar o CLS do swap: definir fallback com métricas ajustadas (`size-adjust`/`ascent-override` no `@font-face` do fallback) ou aceitar o swap se a fonte for visualmente próxima do fallback do sistema.

## Code splitting além das rotas (componentes pesados)

`13-routes` já divide por rota. O segundo nível é dividir **dentro** da página quando um componente pesado (charts, editores rich text, mapas) só é usado condicionalmente — a dependência não deve entrar no chunk da rota inteira:

```typescript
// pages/Dashboard/Dashboard.tsx — a lib de charts (~100KB+) só carrega se o painel abrir
import { lazy, Suspense } from 'react';

const RevenueChart = lazy(() => import('./components/RevenueChart')); // importa a lib de charts lá dentro

{showChart && (
  <Suspense fallback={<Skeleton variant="rectangular" className="h-64" />}>
    <RevenueChart data={data} />
  </Suspense>
)}
```

Critério: vale a pena quando a dependência aparece no top do bundle visualizer (secção abaixo) **e** não é necessária no primeiro paint da rota. Não fragmentar componentes leves — cada chunk tem custo de request.

## Virtualização de listas longas

**Regra:** listas com mais de ~100 itens renderizados de uma vez usam virtualização — nunca `.map()` direto sobre a coleção completa (ver `12-loading-states`, que assume listas pequenas).

```typescript
// pages/Users/components/UsersList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export const VirtualizedUsersList = ({ users }: { users: User[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // altura estimada de cada UserCard
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            style={{ position: 'absolute', top: 0, transform: `translateY(${row.start}px)`, width: '100%' }}
          >
            <UserCard user={users[row.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Bundle — análise e orçamento

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', gzipSize: true }),
  ],
  build: {
    // NUNCA true em produção (expõe o código-fonte). Sem error tracking: false.
    // Com Sentry: 'hidden' + upload no CI + apagar .map antes do deploy (ver 24-ci-quality).
    sourcemap: 'hidden',
  },
});
```

- Correr `npx vite-bundle-visualizer` (ou o plugin acima) antes de cada release para identificar dependências pesadas evitáveis.
- Orçamento recomendado: bundle inicial (sem lazy chunks) < 250KB gzip. Gate em CI opcional com `bundlesize`/`size-limit`.
- Preferir alternativas leves quando a lib pesada só é usada para uma função pequena (ex.: `date-fns` com tree-shaking em vez de `moment`).

## Regras

| Regra | Descrição |
|-------|-----------|
| Metas de Core Web Vitals definidas | LCP < 2.5s, INP < 200ms, CLS < 0.1 |
| `QueryClient` com `defaultOptions` explícito | Nunca depender dos defaults do TanStack Query |
| `memo` em itens de lista renderizados em massa | Não em componentes triviais/poucos |
| Zustand sempre com seletor | Nunca `const state = useStore()` sem seletor |
| Debounce em pesquisa/inputs | `useDebounce`, 300ms por omissão |
| Imagens com `width`/`height` + `loading="lazy"` | Exceto a imagem LCP (`fetchPriority="high"`) |
| Virtualização acima de ~100 itens | `@tanstack/react-virtual` ou `react-window` |
| Retry classificado no QueryClient | 4xx nunca repete; rede/5xx com backoff exponencial |
| Fontes self-hosted (`@fontsource`) | Nunca CDN de terceiros; preload da fonte acima da dobra |
| `srcset`/`sizes` em imagens de conteúdo | Nunca servir a resolução máxima a todos os ecrãs |
| Sourcemaps nunca `true` em produção | `'hidden'` + upload para o Sentry no CI (ver `24-ci-quality`), ou `false` |
| Bundle analisado antes de cada release | `rollup-plugin-visualizer` ou equivalente |

---

<a id="23-accessibility"></a>

<!-- MÓDULO: 23-accessibility -->

# ACCESSIBILITY - WCAG 2.2 AA

## Objetivo

Garantir que toda a UI gerada por este sistema cumpre WCAG 2.2 nível AA por omissão — não como um extra opcional no fim. Este módulo é transversal: aplica-se a `06-patterns`, `10-forms`, `13-routes` e a qualquer componente novo (ver checklist de `20-rules`).

## Contraste de cor

| Elemento | Ratio mínimo (AA) |
|----------|--------------------|
| Texto normal (< 18pt) | 4.5:1 |
| Texto grande (≥ 18pt ou ≥ 14pt bold) | 3:1 |
| Componentes de UI e estados de foco (bordas, ícones informativos) | 3:1 |

```typescript
// tailwind.config.ts — usar tokens verificados, não qualquer cor da paleta default
// ex.: gray-500 sobre branco falha 4.5:1 para texto pequeno — gray-600+ passa
export default {
  theme: {
    extend: {
      colors: {
        // Verificar cada token com https://webaim.org/resources/contrastchecker/
        'text-muted': '#4B5563',   // gray-600 — 7.5:1 sobre branco, passa AA
      },
    },
  },
};
```

Nunca confiar só na cor para transmitir estado (erro/sucesso) — combinar sempre com ícone ou texto (ver `Input`/`ErrorState` abaixo).

## Foco visível e navegação por teclado

**Regra:** nunca remover `outline`/`focus:ring` sem um substituto igualmente visível. Todo o elemento interativo (`button`, `a`, `input`, item de menu) tem de ter um estado de foco visível e alcançável só por teclado (`Tab`/`Shift+Tab`).

```typescript
// ❌ Remove o foco visível sem substituto — inacessível por teclado
<button className="outline-none">Guardar</button>

// ✅ Mantém indicação de foco clara
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
  Guardar
</button>
```

### Ordem de tab e skip link

```tsx
// UI/containers/Layout/Layout.tsx — skip link como primeiro elemento focável
export const Layout = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2"
      >
        {t('common.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

### Focus trap em modais/drawers

O `ConfirmDialog` de `06-patterns` já move o foco para o diálogo ao abrir e fecha com `Escape`. Para modais maiores (com múltiplos campos focáveis), acrescentar um trap completo:

Usar a [referencia compilada](23-accessibility/references/useFocusTrap.ts), com teste de teclado e
restauro em tests/focus.test.tsx no repositorio fonte. O container exige tabIndex={-1}.
A lista de elementos e recalculada por tecla, excluindo controlos disabled/hidden.

Limites: este helper nao gere inert do fundo, scroll lock, portais, shadow DOM,
modais aninhados ou foco programatico fora do dialogo. Para esses casos reutilizar
um dialogo acessivel do projeto ou dialog nativo e validar em browser real.


## Labels em formulários — ligação explícita `htmlFor`/`id`

**Correção a `10-forms`:** o `Input` de referência tinha um `<label>` visualmente junto ao `<input>` mas sem ligação semântica (`htmlFor`/`id`) — um leitor de ecrã não anuncia o label ao focar o campo. Versão corrigida:

```typescript
// UI/components/Input/Input.tsx
import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
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

`useId()` (React 18+) gera um id estável e único por instância sem colisões entre múltiplos `Input` na mesma página — nunca usar `Math.random()`/index de lista como `id`.

## `aria-live` para conteúdo dinâmico (toasts, erros assíncronos)

Leitores de ecrã só anunciam mudanças de conteúdo automaticamente se estiverem dentro de uma região `aria-live`. Toasts (`11-error-handling`) e mensagens de erro assíncronas precisam disto:

```tsx
// UI/components/Toast/ToastContainer.tsx
<div aria-live="polite" aria-atomic="true" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
  {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />)}
</div>
```

`aria-live="polite"` (não `"assertive"`, exceto erros críticos que bloqueiam a tarefa) — não interrompe o que o utilizador está a ouvir no momento.

## Headings hierárquicos

Nunca saltar níveis (`h1` → `h3` sem `h2`). `PageWrapper` (`06-patterns`) usa sempre `h1` para o título da página; sub-secções usam `h2`, nunca `h1` duplicado nem `div` estilizado como título sem semântica de heading.

## `aria-label` em ícones sem texto

```tsx
// ❌ Botão só com ícone, sem nome acessível
<button onClick={onClose}><XIcon /></button>

// ✅ aria-label descreve a ação para quem não vê o ícone
<button onClick={onClose} aria-label={t('common.close')}>
  <XIcon aria-hidden="true" />
</button>
```

## Atalhos de teclado e ações em lote (power users)

**Heurística 7 de Nielsen (Flexibilidade e eficiência de uso):** utilizadores avançados que usam a aplicação diariamente precisam de vias mais rápidas do que clicar em cada botão. Isto é opcional por página (nem toda a página precisa), mas o padrão deve existir no sistema para quando fizer sentido.

### Atalho de teclado global

```typescript
// hooks/common/useKeyboardShortcut.ts
import { useEffect } from 'react';

interface ShortcutOptions {
  key: string;              // ex.: '/', 'n', 'Escape'
  ctrlOrCmd?: boolean;      // exige Ctrl (Windows/Linux) ou Cmd (Mac)
  onTrigger: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcut({ key, ctrlOrCmd, onTrigger, enabled = true }: ShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isTyping = targetTag === 'INPUT' || targetTag === 'TEXTAREA';
      if (isTyping && key !== 'Escape') return; // não disparar atalhos de 1 tecla a meio de um input

      const modifierOk = ctrlOrCmd ? e.metaKey || e.ctrlKey : true;
      if (e.key === key && modifierOk) {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, ctrlOrCmd, onTrigger, enabled]);
}
```

```typescript
// pages/Users/Users.tsx — "/" foca a pesquisa, "n" abre criação
const searchRef = useRef<HTMLInputElement>(null);
useKeyboardShortcut({ key: '/', onTrigger: () => searchRef.current?.focus() });
useKeyboardShortcut({ key: 'n', onTrigger: () => navigate('/users/new') });
```

Documentar os atalhos disponíveis num painel de ajuda (`?` abre um `Modal` com a lista) — um atalho que ninguém descobre não é flexibilidade, é ruído.

### Bulk actions (seleção múltipla)

```typescript
// pages/Users/Users.tsx (excerto)
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
const deleteUser = useDeleteUser();

const toggleSelect = (id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};

const handleBulkDelete = async () => {
  // Promise.allSettled: em falha parcial, remove só os eliminados e notifica os
  // falhados. Promise.all aqui ia produzir unhandledRejection e manter a
  // seleção inconsistente sem feedback.
  const results = await Promise.allSettled(
    [...selectedIds].map((id) => deleteUser.mutateAsync(id)),
  );
  const ok = new Set(
    [...selectedIds].filter((_, i) => results[i]?.status === 'fulfilled'),
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  setSelectedIds((prev) => new Set([...prev].filter((id) => !ok.has(id))));
  if (failed > 0) toast.error(t('common.bulkPartialError', { count: failed }));
  setBulkDeleteOpen(false);
};

return (
  <>
    {selectedIds.size > 0 && (
      <div role="toolbar" aria-label={t('common.bulkActions')} className="flex items-center gap-2 p-2">
        <span>{t('common.bulkSelected', { count: selectedIds.size })}</span>
        <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
          {t('common.deleteSelected')}
        </Button>
      </div>
    )}
    {/* cada linha da lista tem um <input type="checkbox" onChange={() => toggleSelect(user.id)} /> */}
    <ConfirmDialog
      isOpen={bulkDeleteOpen}
      title={t('common.deleteSelectedTitle')}
      message={t('common.deleteSelectedMessage', { count: selectedIds.size })}
      isDangerous
      isLoading={deleteUser.isPending}
      onConfirm={handleBulkDelete}
      onCancel={() => setBulkDeleteOpen(false)}
    />
  </>
);
```

Bulk actions destrutivas passam pelo mesmo `ConfirmDialog` de `06-patterns` — a regra de "nunca eliminar sem confirmação" (`20-rules`) não tem exceção para operações em lote; pelo contrário, o impacto é maior.

## Checklist de acessibilidade (por componente novo)

```
□ Todo elemento interativo tem estado de foco visível (focus-visible:ring)
□ Ordem de tab é lógica (segue a ordem visual)
□ Modais/drawers têm focus trap + Escape fecha + foco volta ao elemento que abriu
□ Labels ligados a inputs via htmlFor/id (nunca só posicionamento visual)
□ Erros de validação têm aria-invalid + aria-describedby
□ Ícones sem texto têm aria-label; ícones decorativos têm aria-hidden="true"
□ Conteúdo dinâmico (toasts, erros async) está em região aria-live
□ Headings não saltam níveis (h1→h2→h3)
□ Contraste de texto ≥ 4.5:1 (verificado, não assumido)
□ Página navegável do início ao fim só com teclado (testar sem rato)
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Nunca remover `outline` sem substituto | `focus-visible:ring-2` no mínimo |
| Labels sempre ligados via `htmlFor`/`id` | Usar `useId()` para ids estáveis |
| Modais com focus trap | `useFocusTrap` ou equivalente + `Escape` fecha |
| `aria-live` em conteúdo dinâmico | Toasts, mensagens de erro assíncronas |
| Contraste verificado, não assumido | Mínimo 4.5:1 texto normal, 3:1 UI/texto grande |
| Testar navegação só com teclado | Antes de considerar um componente/página completo |
| Bulk actions destrutivas passam por `ConfirmDialog` | Sem exceção — o impacto é maior que uma ação única |
| Atalhos de teclado documentados | Painel de ajuda (`?`), nunca escondidos sem descoberta |

---

<a id="24-ci-quality"></a>

<!-- MÓDULO: 24-ci-quality -->

# CI/QUALITY - Qualidade e Segurança do Pipeline

## Objetivo

Garantir que lint, formatação, type-check, testes (`16-tests`) e auditoria de dependências correm automaticamente em cada PR — nunca dependentes de disciplina manual do developer. Complementa `17-security` §Skill 6 (Componentes Vulneráveis) e §Skill 8 (Testes de Segurança Automatizados) com a configuração concreta para este stack (Vite + React + TypeScript).

## vite.config.ts de referência (consolidado)

Os fragmentos espalhados por `15-env`/`22-performance` consolidados num único ficheiro canónico:

```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', gzipSize: true }), // análise de bundle (22)
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }, // alias @/ (05-conventions)
  },
  build: {
    // Nunca true em produção. Sem error tracking: false.
    // Com Sentry: 'hidden' + upload no CI + apagar .map antes do deploy (ver §Sourcemaps)
    sourcemap: 'hidden',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts', // 16-tests (inclui MSW server)
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/utils/**'],
      thresholds: { lines: 80, branches: 70, functions: 80 }, // gate (16-tests)
    },
  },
});
```

## ESLint

```javascript
// eslint.config.js (flat config, ESLint 9+)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // reforça 20-rules ❌3
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // apanha useEffect com deps em falta (ver 08-auth)
      'no-console': ['error', { allow: ['warn', 'error'] }], // reforça 20-rules ❌12
    },
  }
);
```

## Prettier

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Husky + lint-staged (pre-commit)

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "build": "vite build",
    "audit:prod": "npm audit --omit=dev --audit-level=high",
    "audit:all": "npm audit --include=dev --audit-level=high"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

## Pipeline CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: '22.12.x', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
      - run: npm run audit:all

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: '22.12.x', cache: 'npm' }
      - run: npm ci
      - name: SCA de produção
        run: npm run audit:prod
      - name: SCA incluindo dependências de desenvolvimento
        run: npm run audit:all
      - name: Secrets scan
        uses: gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7 # v2
```

O pipeline usa Node.js 22.12+ e um limiar explícito `high`. A auditoria de produção usa
`--omit=dev`; a auditoria completa também cobre dependências de desenvolvimento que entram no
build, nos testes ou nas ferramentas do pipeline. Qualquer comando com vulnerabilidades high ou
critical termina com código diferente de zero.

## Sourcemaps de produção (Sentry)

O build usa `sourcemap: 'hidden'` (`22-performance`) — gera os `.map` sem os referenciar no bundle. O CI envia-os para o Sentry e **apaga-os antes do deploy**; assim os stack traces ficam legíveis no Sentry sem nunca expor o código-fonte ao público.

```yaml
# .github/workflows/ci.yml — job deploy (excerto, após npm run build)
      - name: Upload sourcemaps ao Sentry e remover do artefacto
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          npx sentry-cli sourcemaps upload dist/ --release "${{ github.sha }}"
          find dist -name '*.map' -delete
```

O `--release` tem de coincidir com o `release` do `Sentry.init` (`11-error-handling`) — injetar `VITE_APP_VERSION=${{ github.sha }}` no build.

## Cache headers (SPA)

**Regra:** assets com hash são imutáveis para sempre; o `index.html` nunca é cacheado. Errar isto num dos sentidos prende utilizadores numa versão antiga; no outro, recarrega tudo a cada visita.

```
/assets/*  → Cache-Control: public, max-age=31536000, immutable   (Vite já faz hashing por defeito)
/index.html → Cache-Control: no-cache                              (revalida a cada navegação)
```

```json
// vercel.json (equivalente em netlify.toml / nginx)
{
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/index.html", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }
  ]
}
```

## Releases arriscados — feature flags e rollback

- **Feature flag primeiro:** funcionalidade arriscada entra desligada atrás de flag — `VITE_ENABLE_*` (`15-env`) para flags de build; para ligar/desligar sem redeploy, flag runtime via endpoint de config do backend.
- **Rollback = redeploy do artefacto anterior:** builds são imutáveis e guardados por N versões na plataforma de hosting — reverter é apontar para o build anterior, nunca "corrigir à pressa em produção".
- **Preview deployments:** quando a plataforma suporta (Vercel/Netlify), preview por PR como status check adicional — o revisor vê a app real, não só o diff.

## Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"
```

## Gate de PR (branch protection)

Configurar no GitHub (Settings → Branches → Branch protection rule para `main`):

```
□ Require status checks to pass before merging
  □ quality (lint, typecheck, test, build)
  □ security (npm audit, secrets scan)
□ Require branches to be up to date before merging
□ Require pull request review antes de merge
```

Sem isto, o pipeline corre mas não impede merges com falhas — o gate é o que dá dentes às regras.

## Regras

| Regra | Descrição |
|-------|-----------|
| ESLint com `no-explicit-any: error` | Reforça `20-rules` ❌3 automaticamente, não só por revisão manual |
| `no-console: error` (exceto warn/error) | Reforça `20-rules` ❌12 |
| Husky + lint-staged no pre-commit | Lint/format correm antes do commit chegar ao PR |
| CI corre lint + typecheck + test + build | Em todo o push/PR, não só na branch principal |
| Node.js 22.12+ no CI | Runtime alinhado entre desenvolvimento e pipeline |
| SCA com `--audit-level=high` em prod e no conjunto completo | Cobre dependências runtime e ameaças introduzidas por ferramentas de build/teste |
| Dependabot semanal | PRs automáticos de atualização de dependências |
| Branch protection com status checks obrigatórios | Sem isto, o CI é decorativo — não bloqueia merges |
| Sourcemaps `hidden` + upload + delete | Sentry legível sem expor código-fonte (ver `22`/`15-env`) |
| Cache: assets `immutable`, `index.html` `no-cache` | O erro clássico de SPA é cachear o `index.html` |
| Flag em releases arriscados; rollback = build anterior | Nunca hotfix direto em produção |

---

<a id="25-e2e"></a>

<!-- MÓDULO: 25-e2e -->

# E2E - Testes End-to-End (Playwright)

## Objetivo

Cobrir os fluxos que nenhum teste unitário ou de integração consegue garantir: a app real, no browser real, contra um backend (mockado ou de staging). Complementa `16-tests` (unit/integração) — não o substitui nem duplica.

## Fluxos críticos obrigatórios

**Regra:** o E2E não tenta cobrir tudo — cobre os fluxos cuja falha é inaceitável em produção. Mínimo para qualquer projeto deste sistema:

| # | Fluxo | O que valida |
|---|-------|--------------|
| 1 | Login → dashboard | Auth completo: form, cookie httpOnly, redirect, sessão restaurada em reload |
| 2 | CRUD do domínio principal | Page→Hook→Transporter real, ConfirmDialog no delete, 4 estados de UI |
| 3 | Sessão expirada | 401 → refresh → retry transparente; refresh falhado → redirect gracioso para login |

## Setup

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const remoteBaseURL = process.env.E2E_BASE_URL;
const authFile = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: remoteBaseURL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { browserName: 'chromium', storageState: authFile },
    },
  ],
  // A remote E2E_BASE_URL is already running; only start Vite for local runs.
  ...(remoteBaseURL
    ? {}
    : { webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI } }),
});
```

The setup project must create the stored session explicitly. Keep credentials in CI secrets or a
local test account, never in the repository:

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER!);
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

## Fluxo 1 — Login

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should login and land on dashboard', async ({ page }) => {
  await page.goto('/login');

  // getByLabel/getByRole — mesma prioridade de queries de 16-tests
  await page.getByLabel('Email').fill('admin@exemplo.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('should keep session after reload (httpOnly cookie + checkSession)', async ({ page }) => {
  // ... login ...
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/); // sessão restaurada, sem voltar ao login
});
```

## Fluxo 2 — CRUD com ConfirmDialog

```typescript
// e2e/users-crud.spec.ts
test('should delete only after explicit confirmation', async ({ page }) => {
  await page.goto('/users');
  let deleteRequests = 0;
  page.on('request', (request) => {
    if (request.method() === 'DELETE') deleteRequests += 1;
  });
  await page.getByRole('button', { name: /eliminar/i }).first().click();

  // 20-rules ❌15: a mutation nunca dispara sem ConfirmDialog
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: /cancelar/i }).click();
  await expect(dialog).not.toBeVisible(); // cancelar não elimina nada
  expect(deleteRequests).toBe(0); // cancelar não pode sequer iniciar a mutation
});
```

## Fluxo 3 — Sessão expirada

```typescript
// e2e/session-expiry.spec.ts
test('should redirect to login when the protected request and refresh both fail', async ({ page }) => {
  await page.route('**/api/users', (route) => route.fulfill({ status: 401, body: '{}' }));
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, body: '{}' }));

  await page.goto('/users');
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});
```

`context.clearCookies()` alone does not prove expiry handling: an in-memory access token may still
work. Force the protected request to return `401`, make refresh fail, and assert the protected
route ends at the expected login URL.

## Acessibilidade automatizada (axe) nas páginas principais

Fecha o gap entre o checklist manual de `23-accessibility` e a verificação contínua — regressões de contraste/labels/roles falham o pipeline:

```typescript
// e2e/a11y.spec.ts
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/login', '/dashboard', '/users']) {
  test(`should have no WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path !== '/login') {
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
      await expect(page).not.toHaveURL(/\/login/);
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

## CI

```yaml
# .github/workflows/ci.yml — job adicional (ver 24-ci-quality)
  e2e:
    runs-on: ubuntu-latest
    needs: [quality]
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: '22.12.x', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}
          E2E_USER: ${{ secrets.E2E_USER }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        if: failure()
        with: { name: playwright-traces, path: test-results/ }
```

Adicionar `e2e` aos status checks obrigatórios do branch protection (`24-ci-quality` §Gate de PR).

## Regras

| Regra | Descrição |
|-------|-----------|
| 3 fluxos críticos mínimos | Login, CRUD principal, sessão expirada — antes de qualquer outro E2E |
| Queries por acessibilidade | `getByRole`/`getByLabel` — mesma prioridade de `16-tests` |
| axe nas páginas principais | WCAG 2.0 A/AA e WCAG 2.1/2.2 AA como gate, não como auditoria manual anual |
| Trace só em falha | `on-first-retry` com uma retry no CI |
| E2E não substitui unit/integração | Pirâmide: muitos unit (16), alguns integração MSW (16), poucos E2E (aqui) |
| Backend mockado ou staging | Nunca produção; dados de teste determinísticos |

---

<a id="26-privacy"></a>

<!-- MÓDULO: 26-privacy -->

# PRIVACY - RGPD e Privacidade

## Objetivo

Garantir que qualquer app gerada por este sistema cumpre o RGPD por construção: consentimento real antes de tracking, minimização de dados no client, e separação clara entre telemetria técnica e analytics de produto. Para software usado na UE isto é requisito legal, não polish. Complementa `11-error-handling` (Sentry sem PII) e `15-env` (flags).

## Classificação — o que exige consentimento e o que não

| Categoria | Exemplos neste sistema | Base legal | Consentimento? |
|---|---|---|---|
| **Essencial** | Cookie httpOnly de refresh (`08-auth`), preferência de idioma (`09-i18n`), flag de hint visto (`06-patterns`) | Necessário ao serviço | **Não** (mas informar na política) |
| **Telemetria técnica** | Sentry sem PII (`11`), Core Web Vitals (`22`) | Interesse legítimo — **só válido com scrubbing** (`beforeSend`, sem PII) | Não, se e só se sem dados pessoais |
| **Analytics de produto** | Comportamento de utilização, funis, heatmaps | Consentimento | **Sim — opt-in prévio** |
| **Marketing** | Pixels, remarketing | Consentimento | **Sim — opt-in prévio** |

## ConsentContext

**Regras:** nada de analytics/marketing carrega antes do opt-in; recusar é tão fácil como aceitar (dois botões iguais, sem dark patterns, sem cookie wall); a escolha persiste e é revogável a qualquer momento (página de definições).

```typescript
// context/ConsentContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string | null; // null = ainda não respondeu → mostrar banner
}

const STORAGE_KEY = 'consent'; // a preferência de consentimento é, ela própria, essencial

const FALLBACK_CONSENT: ConsentState = { analytics: false, marketing: false, decidedAt: null };

const readConsent = (): ConsentState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return FALLBACK_CONSENT;
  try {
    return { ...FALLBACK_CONSENT, ...JSON.parse(raw) };
  } catch {
    // fail-closed: storage corrompido regista "recusado", nunca crasha a app no arranque
    return FALLBACK_CONSENT;
  }
};

interface ConsentContextType {
  consent: ConsentState;
  updateConsent: (patch: Partial<Pick<ConsentState, 'analytics' | 'marketing'>>) => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<ConsentState>(readConsent);

  const updateConsent = useCallback((patch: Partial<Pick<ConsentState, 'analytics' | 'marketing'>>) => {
    setConsent((prev) => {
      const next = { ...prev, ...patch, decidedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return <ConsentContext.Provider value={{ consent, updateConsent }}>{children}</ConsentContext.Provider>;
};

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used within ConsentProvider');
  return context;
};
```

## Banner de consentimento

```tsx
// UI/components/ConsentBanner/ConsentBanner.tsx
export const ConsentBanner = () => {
  const { t } = useTranslation();
  const { consent, updateConsent } = useConsent();

  if (consent.decidedAt) return null; // já respondeu — não reperguntar a cada visita

  return (
    <div role="dialog" aria-label={t('privacy.banner.title')}
         className="fixed bottom-0 inset-x-0 z-50 bg-white p-4 shadow-lg dark:bg-gray-800">
      <p className="text-sm">{t('privacy.banner.message')}</p>
      <div className="mt-3 flex gap-2">
        {/* Recusar tem o MESMO peso visual que aceitar — sem dark patterns */}
        <Button variant="secondary" onClick={() => updateConsent({ analytics: false, marketing: false })}>
          {t('privacy.banner.reject')}
        </Button>
        <Button variant="primary" onClick={() => updateConsent({ analytics: true, marketing: false })}>
          {t('privacy.banner.accept')}
        </Button>
      </div>
    </div>
  );
};
```

## Gate de analytics — nunca carregar antes do opt-in

```typescript
// App.tsx — o script de analytics só entra na página após consentimento
const { consent } = useConsent();

useEffect(() => {
  if (env.enableAnalytics && consent.analytics) {
    // Adapter do projeto: inicia o SDK e devolve cleanup sincrono.
    // Se o import for async, cancelar/ignorar resolucoes apos revogacao.
    return startAnalytics();
  }
}, [consent.analytics, env.enableAnalytics]);
```

`VITE_ENABLE_ANALYTICS` (`15-env`) continua a existir como kill-switch de build — o consentimento é a segunda condição, nunca a alternativa.

## Política de storage no client

**Regra:** tudo o que o sistema escreve em `localStorage`/`sessionStorage`/IndexedDB está inventariado; **nunca PII nem tokens** (`20-rules` ❌1); limpeza no logout do que é de sessão.

| Key | Storage | Conteúdo | Vida |
|---|---|---|---|
| `i18nextLng` | localStorage | Código de idioma | Permanente (essencial) |
| `onboarding-dismissed-*` | localStorage | Flag booleana | Permanente (essencial) |
| `consent` | localStorage | Preferência de consentimento | Permanente (essencial) |
| Draft opcional | Memoria por defeito | Allowlist nao sensivel com schema (`10-forms`) | TTL e limpeza na troca de sessao |

Integrar a limpeza no callback clearPrivateData de createAuthClient (08-auth),
incluindo cancelamento e limpeza da cache privada e de drafts em memoria.
Nao duplicar o estado de sessao nem atrasar a limpeza local ate ao pedido remoto.
Sincronizacao entre separadores requer um adapter explicito; enviar apenas sinais,
nunca tokens ou dados pessoais.


## PII em telemetria e limites da validacao tecnica

A remocao de alguns campos nao prova anonimato nem estabelece uma base legal.
URLs, breadcrumbs, payloads e identificadores podem continuar a conter dados pessoais.
Preferir uma allowlist minima, verificar o payload real e documentar retencao,
destinatarios e acesso. Validacao tecnica nao certifica conformidade com RGPD:
a base legal e a necessidade de consentimento exigem avaliacao propria.

## Traduções

```json
"privacy": {
  "banner": {
    "title": "Privacidade",
    "message": "Usamos cookies essenciais para o funcionamento da app. Com o teu consentimento, usamos também analytics para melhorar o produto.",
    "accept": "Aceitar analytics",
    "reject": "Só essenciais"
  }
}
```

## Regras

| Regra | Descrição |
|-------|-----------|
| Opt-in prévio para analytics/marketing | O SDK não é sequer descarregado antes do consentimento |
| Recusar = mesmo peso visual que aceitar | Sem dark patterns, sem cookie walls |
| Essenciais sem consentimento, mas informados | Cookie de auth, idioma, consentimento em si |
| Telemetria técnica só sem PII | `beforeSend` do Sentry é o que sustenta o interesse legítimo (`11`) |
| Storage inventariado | Tabela acima atualizada a cada key nova; nunca PII/tokens |
| Limpeza no logout | Drafts e dados de sessão removidos (propaga entre tabs via `authChannel`) |
| Escolha revogável | Página de definições permite mudar o consentimento a qualquer momento |

---

<a id="27-data-table"></a>

<!-- MÓDULO: 27-data-table -->

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

Copiar a [funcao testada](27-data-table/references/escapeCsvCell.ts) para utils/escapeCsvCell.ts.
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

---

<a id="28-security-verification"></a>

<!-- MÓDULO: 28-security-verification -->

# SECURITY VERIFICATION — React web (build + E2E)

> **Auditoria ≠ verificação.** `17-security` (17) *procura* falhas; esta skill **prova** que os
> controlos do cliente funcionam, em CI. A superfície é diferente da do backend: um SPA não tem
> endpoint de login para brute-forçar — os vetores HTTP (SQLi, IDOR, brute force) são do
> `fastapi-security-verification`. Aqui verifica-se o que é do **cliente**: o que vai no bundle, onde
> ficam os tokens, que sinks de DOM existem, e o que o host devolve nos headers.

## Como usar

Alguns vetores são de **build** (analisar o `dist/`), outros de **runtime** (Playwright contra o
staging — compõe com `25-e2e`). Todos entram no gate de CI como bloqueantes.

## Os vetores do cliente

### 1. Segredos fora do bundle

Nada de chaves de API, tokens ou segredos no JS servido. Só variáveis `VITE_` **públicas por
desenho** (URLs, flags) — nunca segredos (`15-env`).

```bash
# scripts/check-bundle-secrets.sh — corre sobre dist/ depois do build
set -e
# Prova primeiro que o scanner deteta um canary numa fixture descartável.
fixture=$(mktemp -d)
printf '%s\n' 'TEST_SECRET=canary-not-for-production' > "$fixture/example.js"
if gitleaks dir "$fixture" --no-banner; then
  echo "❌ o scanner não detetou o canary"; exit 1
fi
gitleaks dir dist/ --no-banner
```

Use um scanner de segredos e uma fixture canary para validar a própria regra. Uma regex sobre o
bundle é apenas uma pista e não demonstra que todos os segredos foram cobertos.

### 2. Token de acesso só em memória

O contrato (`08-auth`, `shared-auth-jwt-contract`) diz cookie httpOnly para o refresh e access
**em memória** — nunca `localStorage`/`sessionStorage`, que são legíveis por qualquer XSS.

```typescript
// e2e/security/token-storage.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('login does not write token-like values to browser storage', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER!);
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: /entrar/i }).click();
  const dump = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(dump).not.toMatch(/eyJ|accessToken|refreshToken/i);
});
```

### 3. Sinks de XSS controlados

`dangerouslySetInnerHTML` só com conteúdo sanitizado (DOMPurify). Verificação estática — falha o
build se aparecer sem sanitização (`17-security`).

```bash
# ESLint analisa o AST; não infere segurança pela proximidade de texto.
npx eslint src --rule 'react/no-danger:error'
```

`react/no-danger` deve falhar por omissão. Se HTML sanitizado for realmente necessário, use um
wrapper/allowlist revisto ou uma regra Semgrep AST com exceções explícitas e testadas. Um `grep` de
`dangerouslySetInnerHTML` perto de `DOMPurify.sanitize` não prova que os dados e o sink estão ligados.

### 4. Security headers + CSP do host

O SPA é servido por um host (Nginx, Vercel, CloudFront). Playwright verifica os headers da resposta
do `index.html` no staging.

```typescript
// e2e/security/headers.spec.ts (Playwright)
test('o host devolve os headers de segurança', async ({ request }) => {
  const r = await request.get(process.env.E2E_BASE_URL!);
  const h = r.headers();
  expect(h['strict-transport-security']).toBeTruthy();
  expect(h['x-content-type-options']).toBe('nosniff');
  const csp = h['content-security-policy'] ?? '';
  expect(csp).toBeTruthy();
  const directives = Object.fromEntries(csp.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values];
  }));
  expect(directives['script-src'] ?? directives['default-src']).not.toContain("'unsafe-inline'");
  expect(directives['script-src'] ?? directives['default-src']).not.toContain("'unsafe-eval'");
  expect(csp).toMatch(/frame-ancestors\s+/);
});
```

`style-src 'unsafe-inline'` may be an explicit, documented compatibility choice; it never makes
`script-src` permissive. Parse directives separately so a style exception is not confused with an
executable-script exception.

### 5. Refresh não entra em loop em credenciais inválidas

Verifica a correção de `08-auth`: um `401` em `/auth/login` **não** dispara refresh (senão o login
errado repete-se em ciclo).

```typescript
// e2e/security/auth.spec.ts (network assertion; no undefined authApi)
import { test, expect } from '@playwright/test';

test('401 on login does not call refresh', async ({ page }) => {
  let refreshCalls = 0;
  await page.route('**/auth/login', (route) => route.fulfill({ status: 401, body: '{}' }));
  await page.route('**/auth/refresh', (route) => {
    refreshCalls += 1;
    return route.fulfill({ status: 401, body: '{}' });
  });
  await page.goto('/login');
  await page.getByLabel('Email').fill('invalid@example.test');
  await page.getByLabel('Password').fill('invalid');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(refreshCalls).toBe(0);
});
```

### 6. SCA / dependências

`npm audit` como gate. Fixar `--audit-level=high` para não falhar em ruído low/moderate mas bloquear
o que importa.

### 7. Source maps não expõem segredos em produção

Se geras source maps, não podem ir para o host público (expõem o código-fonte). Ou não os publicas,
ou só os envias para o Sentry.

```bash
test -z "$(find dist/ -name '*.map')" || { echo "❌ source maps no dist público"; exit 1; }
```

## Pipeline de CI — gate bloqueante

```yaml
# .github/workflows/security.yml
name: security
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: "22.12.x", cache: "npm" }
      - run: npm ci
      - run: npm run build
      - name: Segredos no bundle (vetor 1) + source maps (vetor 7)
        run: bash scripts/check-bundle-secrets.sh
      - name: Testes de segurança (vetores 2, 5)
        run: npx playwright test e2e/security
      - name: Headers/CSP no staging (vetor 4)
        run: npx playwright test e2e/security/headers.spec.ts
        env:
          E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}
      - name: SCA (vetor 6)
        run: npm audit --audit-level=high
      - name: Confirmar que não há sourcemaps públicos
        run: test -z "$(find dist -name '*.map' -print -quit)"
```

## Regras

| Regra | Razão |
|---|---|
| Vetores HTTP (SQLi, IDOR, brute force) **não** são daqui | São da API — ver `fastapi-security-verification`. O SPA verifica a sua própria superfície |
| Segredo no bundle é falha de build, não warning | O bundle é público por definição; um segredo lá é um segredo vazado |
| Token em `localStorage` é XSS-legível → proibido, testado | Access em memória, refresh em cookie httpOnly (`shared-auth-jwt-contract`) |
| Headers verificados no **host de staging**, não no dev server | O `vite dev` não representa a config de produção |
| `npm audit` é gate bloqueante em `high` | SCA que não bloqueia não protege |

---

<a id="29-pentest"></a>

<!-- MÓDULO: 29-pentest -->

# PENTEST — Teste de Segurança Ativo (Dinâmico)

> **Diferença das outras skills de segurança:**
> - `17-security` lê código-fonte e *procura* falhas (estática).
> - `28-security-verification` prova em CI que o *cliente React* está blindado.
> - `29-pentest` ataca um **alvo em execução** e *valida* se a falha é explorável (dinâmica).
> - Os vetores HTTP (SQLi, IDOR, brute force) do backend pertencem a esta skill — **não** a `28`.
>
> ⚠️ **Autorização obrigatória.** Só correr contra alvos que possas testar (laboratório Docker,
> staging próprio, targets.json marcados como autorizados). Nunca contra infraestrutura de terceiros
> sem permissão escrita. O agente começa sempre por confirmar o âmbito autorizado.
>
> Esta skill documenta um procedimento; não inicia um pentest por si só. Antes de qualquer pedido,
> exige autorização explícita, uma allowlist exata e limites de taxa/tempo. Para ao primeiro sinal de
> dados reais, impacto não previsto, mudança de escopo ou tentativa de escalada além da prova mínima.

## Princípios de operação

- Mentalidade red team: "como um atacante explora isto?".
- Correr primeiro RECONHECIMENTO, depois atacar na ordem das fases abaixo.
- Só reportar o que é **detetável/explorável** — nunca inventar achados.
- Priorizar por CVSS v3.1: Crítico (9.0–10) → Alto (7.0–8.9) → Médio (4.0–6.9) → Baixo (0.1–3.9).
- Terminar sempre com Plano de Remediação priorizado por esforço × impacto.
- Gravar tudo em `output/` com o schema JSON canónico (ver §Relatório).
- Não seguir redirects para fora da allowlist, não testar métodos destrutivos por omissão e não fazer
  brute force, exploração de privilégios ou exfiltração além do necessário para confirmar o achado.

## Configuração e âmbito

```jsonc
// config/targets.json — só targets marcados autorizados
{
  "targets": [
    {
      "id": "lab-dvwa",
      "url": "http://127.0.0.1:8080",
      "ip": "127.0.0.1",
      "ports": [8080],
      "paths": ["/login.php", "/profile"],
      "max_requests_per_minute": 30,
      "authorized": true,
      "auth": { "login_url": "/login.php", "user": "^USER^", "pass": "^PASS^", "fail": "Invalid" }
    }
  ]
}
```

Laboratório rápido para testes seguros (alvo vulnerável por design, apenas loopback):

```bash
docker run --rm --name dvwa -p 127.0.0.1:8080:80 vulnerables/web-dvwa   # http://127.0.0.1:8080
```

## Fase 1 — Reconhecimento e mapeamento

Objetivo: descobrir todos os pontos de entrada.

| Tarefa | Ferramenta | Comando |
|---|---|---|
| Portas + serviços | Nmap | `nmap -sV -p 8080 127.0.0.1` |
| Fingerprint tech | Wappalyzer/BuiltWith | fonte da página → meta/script/framework |
| Mapear endpoints | Burp/ZAP ou curl | `curl -s http://alvo | grep -oP 'href="[^"]+"' \| cut -d'"' -f2 \| sort -u` |

## Fase 2 — Autenticação e bypass de login

### A. Brute force / dicionário

```bash
# Use only a test account, at most the policy's small sample, and the configured rate limit.
# Do not run a wordlist or SSH spray against an unlisted target.
```

Validação: se a conta **não** aplica rate limit, backoff ou lockout conforme a política, existe
risco de brute force. Um bloqueio observável após tentativas controladas é evidência de um controlo,
não de uma vulnerabilidade; também verifica recuperação, duração e possibilidade de bypass.

### B. SQL Injection (SQLi)

Payloads manuais (em `user=`, `email=`, `password=`):
```sql
' OR '1'='1' --
admin'#
" OR 1=1 -- -
```
Automação:
```bash
sqlmap -u "http://alvo/login?user=test&pass=test" --forms --batch --level=1 --risk=1 --threads=1 --delay=1
```
Sinais: mensagens de erro SQL, bypass de login.

### C. JWT token tampering

```bash
jwt_tool eyJhbGciOiJIUzI1NiIs... -X i   # força alg/secret fraco
```
Testes: remover `alg`→`none` com assinatura vazia; alterar `username`/`is_admin` no payload; chave fraca (`jwt_tool ... -X i`).

### D. Bypass de CAPTCHA / session fixation / IP

- CAPTCHA: testar `GET /login?captcha=12345` — se o servidor não valida, é fraco; reutilizar respostas.
- Session fixation: fixar cookie de sessão conhecido na vítima via parâmetro de sessão.
- IP: spoofing `IP(src="192.168.1.1", dst=...)` (Scapy) — raramente relevante em SPA com API.

## Fase 3 — Injeções e manipulação

### A. XSS
```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<body onload=alert(1)>
```
Testar apenas campos dentro do âmbito e confirmar execução no browser de teste (por exemplo, um
listener de `dialog` ou um canary DOM inofensivo). `curl` pode mostrar reflexão no HTML, mas `grep`
não prova que o payload executou no contexto do browser.

### B. SSRF
```http
GET /profile?image=http://localhost/admin
GET /search?q=file:///etc/passwd
```
Sinais: conteúdo de `/etc/passwd` (`root:`) ou admin retornado. Bloquear RFC 1918 e metadados cloud (169.254.169.254).

### C. IDOR
`/user?id=1` → `id=2`, `id=admin`, `id=0`. Se dados de outro utilizador voltam, há IDOR. Testar ownership (user A acede a dados do user B).

## Fase 4 — Lógica e escalada de privilégios

- Fuzz de `role=` (`user`, `admin`, `superuser`, `1`):
  ```bash
  ffuf -u "http://alvo/dashboard?role=FUZZ" -w /usr/share/wordlists/rockyou.txt
  ```
- Manipular claims JWT (`is_admin: false` → `true`).
- Fluxo: registo sem verificação de email → login funciona? (falha lógica).

## Fase 5 — Hardening (headers / CORS / CSP)

```bash
curl -I http://alvo
```
Headers esperados:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY   (ou CSP frame-ancestors 'none')
Content-Security-Policy: default-src 'self'   # sem unsafe-inline / unsafe-eval
```
CORS mal configurado: resposta com `Access-Control-Allow-Origin: *` (com `credentials`).
CSP deve ser avaliada pelo header recebido e por uma fixture servida pelo próprio alvo que tenta
executar script inline; `eval()` escrito na consola de DevTools corre num contexto de automação e
não é uma prova válida da política da página.

## Fase 6 — Componentes/CVEs (opcional, pesado)

```bash
npm audit --audit-level=high          # SPA
nuclei -u http://alvo -t ~/nuclei-templates/
trivy fs .                            # ou grype / OWASP Dependency-Check
# OpenVAS/GVM (varredura CVE pesada) — via API ou docker
```

## Fase 7 — Validação de correções

Re-executar o teste original após cada fix e confirmar que deixou de explorar:
- SQLi: correr `sqlmap` de novo → sem dados retornados.
- XSS: repetir o canary no browser e verificar que não há execução; a reflexão textual isolada não basta.
- Brute force: repetir o teste limitado e confirmar a resposta de rate limit/lockout definida pela política.

## Formato de relatório

Todos os módulos gravam JSON padronizado em `output/`:

```json
{
  "scan_id": "uuid-v4",
  "timestamp": "2026-09-02T13:30:00Z",
  "target": "http://app.test.com",
  "modules_executed": ["nmap", "auth_bypass", "xss", "headers"],
  "findings": [
    {
      "module": "auth_bypass",
      "type": "SQL Injection",
      "severity": "CRITICAL",
      "cvss": 9.1,
      "cwe": "CWE-89",
      "evidence": "payload: ' OR '1'='1' --",
      "location": "POST /login",
      "remediation": "usar prepared statements com parâmetros vinculados"
    }
  ]
}
```

Consolidar num relatório executivo + técnico: Executive Summary → Resumo por severidade → Detalhe por achado (CWE, CVSS, PoC, impacto, remediação) → Plano de Remediação priorizado.

## Estrutura sugerida do agente de pentest

```
pentest-agent/
├── config/targets.json + wordlists/
├── modules/
│   ├── auth_bypass.py    # SQLi, brute, JWT, CAPTCHA
│   ├── xss_ssrf.py       # XSS, SSRF
│   ├── idor.py           # IDOR, escalada
│   ├── headers.py        # CORS, CSP, HSTS
│   ├── ws_fuzz.py        # WebSocket fuzzing (protocolo não-HTTP)
│   ├── openvas_scan.py   # varredura CVE
│   ├── reporting.py      # consolida JSON → PDF/HTML
│   └── scanner.py        # pipeline orquestrador
└── output/               # relatórios e logs
```

## Regras

| Regra | Razão |
|---|---|
| Confirmar âmbito autorizado antes de qualquer teste | Legal/ético; nunca atacar terceiros sem permissão escrita |
| Reconhecimento primeiro, ataque depois | Não sabes onde atacar sem mapear |
| Só reportar o detetável | Inventar achados corrompe o relatório |
| Priorizar por CVSS | Foco no que importa ao negócio |
| Gravar tudo em JSON canónico | O agente/relatório lê os resultados de forma consistente |
| Re-testar após correção | Confirma que o fix funciona, não só que foi aplicado |
| Vetores HTTP do backend NÃO são de `28` | `28` só prova o cliente; o backend testa-se aqui |
| Perfomance e code review separados | Ver `22-performance` (perf) e `31-code-review` (metodologia de review) |

---

<a id="30-simplify"></a>

<!-- MÓDULO: 30-simplify -->

# SIMPLIFY — Código Mínimo e Necessário (Ponytail)

> Filosofia: escrever apenas o que a tarefa exige. O código que nunca foi escrito não tem bugs,
> não tem CVEs, não precisa de manutenção. **Mas** lazy na solução, nunca na leitura: lê o código
> que o teu change toca e traça o fluxo real antes de escolher.

## A Escada (desce até ao primeiro degrau que segura)

Antes de escrever qualquer código, parar no primeiro degrau que funciona:

1. **Isto precisa de existir?** → Não: saltar (YAGNI).
2. **Já existe no codebase?** → Reutilizar, não reescrever.
3. **A stdlib faz isto?** → Usar.
4. **Funcionalidade nativa da plataforma?** → Usar.
5. **Dependência já instalada?** → Usar (não adicionar outra).
6. **Uma linha resolve?** → Uma linha.
7. **Só então:** o mínimo que funciona.

## Exemplos

### Date picker (over-build clássico)
```tsx
// ❌ Instalar flatpickr, wrapper, stylesheet, discussão de timezones...
// ✅ O browser já tem um
<input type="date" />
```

### Ordenar uma lista pequena
```tsx
// ❌ Criar um hook useSortedList com useMemo + opções de asc/desc + testes...
// ✅ Se a lista é pequena e local, ordena na hora
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
```

### Fetch de dados do servidor
```tsx
// ✅ O transporter segue o contrato comum: axios/interceptors, schema.parse e React Query.
// services/transporters/users/usersTransporter.ts
import api from '@/lib/axios';
import { userListSchema } from '@/types/users/user.schemas';

export const usersTransporter = {
  async list() {
    const { data } = await api.get('/users');
    return userListSchema.parse(data);
  },
};

// hooks/users/useGetUsers.ts
import { useQuery } from '@tanstack/react-query';

export function useGetUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersTransporter.list,
  });
}
```

Não substituir este fluxo por `fetch(...).then((r) => r.json())`: isso contorna o transporter,
os interceptors de autenticação, o parsing da resposta e o cache/invalidação de React Query. `fetch`
é adequado apenas para uma operação realmente fora do contrato da aplicação e deve manter as mesmas
garantias.

## O que NUNCA cortar (lazy, não negligente)

A escada reduz **código**, nunca **salvaguardas**. Estes ficam sempre:

- Validação de trust boundary (input do utilizador, resposta da API — ver `20-rules` ❌/✅ Zod).
- Tratamento de erros e data-loss (ver `11-error-handling`).
- Segurança (ver `17-security`; token só em memória, XSS, CORS).
- Acessibilidade (ver `23-accessibility`).
- Os 4 estados de UI (loading/error/empty/success — ver `12-loading-states`).

> A linha "o browser já tem um" **não** se aplica a segurança. `<input type="date">` é simples porque
> o browser garante. Nunca trocar segurança/a11y por menos linhas.

## Regras

| Regra | Razão |
|---|---|
| Descer a escada antes de escrever | Força o mínimo necessário |
| Ler o código envolvente antes | Lazy na solução, não na leitura |
| Reutilizar antes de reescrever | Menos código, menos bugs |
| Nunca cortar validação/erros/segurança/a11y | Reduzir linhas ≠ reduzir garantias |
| 1 hook = 1 ficheiro continua a valer | `20-rules` — simplificar não é amontoar |
| Nome legível > comentário extenso | Alinha com `05-conventions` §Comentários |

---

<a id="31-code-review"></a>

<!-- MÓDULO: 31-code-review -->

# CODE REVIEW — Review de PR (Performance + Segurança)

> Metodologia para rever diffs de Pull Request antes do merge. Começa sempre por confirmar as
> regras absolutas (`20-rules`) e cruzar com `17-security` (estático) quando há superfícies novas.

## Passo 1 — Bloqueios imediatos (regras absolutas)

Barram o merge tal como estão:
- `any` não tipado / `@ts-ignore`.
- Token em `localStorage`/`sessionStorage` (regra ❌1) — tem de ser memória + refresh httpOnly.
- `dangerouslySetInnerHTML` sem `DOMPurify.sanitize()` no mesmo local (❌16 / `17-security`).
- HTTP direto nas pages (❌2) — tudo via hooks/transporters.
- `console.log` em produção (❌12).
- Ações destrutivas (delete) sem `ConfirmDialog` (❌15).
- Analytics antes do consentimento (❌18).
- Hardcoded roles/strings (❌4, ❌14).

## Passo 2 — Cibersegurança (vetores por camada)

| Área | Perguntas do reviewer | Referência |
|---|---|---|
| Autenticação | O login valida credenciais no servidor? Tem rate limit/lockout? Refresh em single-flight sem loop em 401? | `08-auth`, `28` |
| Autorização | O endpoint verifica ownership (IDOR)? O role é verificado no servidor, não só no cliente? | `17` Skill 3 |
| Input | Resposta de API validada com `schema.parse`? Input de forms com Zod (não só UX)? | `10`, `14` |
| Tokens | JWT com algoritmo seguro (nunca `none`), secret forte, expiração, audience/issuer? | `17` Skill 4 |
| XSS | Qualquer `dangerouslySetInnerHTML` sanitizado? Texto simples preferido? | `17` Skill 1 |
| Headers/CSP/CORS | CSP sem `unsafe-inline`/`unsafe-eval`? CORS restrito (nunca `*` com credentials)? HSTS? | `17` Skill 5, `28` vetor 4 |
| Segredos | Nada de secrets no bundle/diff/`.env` commitado? | `28` vetor 1 |
| Dependências | Nova lib adicionada sem necessidade real? (cruzar `30-simplify`) | `17` Skill 6 |

## Passo 3 — Alta performance

| Área | Perguntas | Referência |
|---|---|---|
| Re-renders | `memo` só em listas grandes (>20 itens)? `useCallback` só quando passado a componente memoizado? | `22` §Re-renders |
| Estado | Zustand lido por seletor (nunca store inteiro)? | `22` §Zustand |
| Queries | React Query para dados do servidor? `staleTime`/`retry` classificado? Invalidar após mutation? | `07`, `22` |
| Bundle | Componente pesado lazy dentro da página? Nova dependência justificada? | `22` §Code splitting |
| Imagens | `width`/`height` + `loading="lazy"`? (exceto LCP) `srcset`/`sizes`? | `22` §Imagens |
| Listas longas | Virtualização acima de ~100 itens? | `22` §Virtualização |
| Debounce | Pesquisa/inputs com `useDebounce`? | `22` §Debounce |

## Passo 4 — Simplificação (anti over-engineering)

- Existe código que podia ser uma linha ou uma feature nativa? (`30-simplify`)
- Está a reescrever algo que já existe no codebase ou numa dependência instalada?
- Adicionou dependência para resolver o que a stdlib/browser já resolve?

## Saída do review

Comentários concisos em **bulletpoint** (ver `05-conventions` §Comentários), ordenados por bloqueante → maior impacto:
```
🔴 BLOQUEANTE  · token de acesso em localStorage → move para memória (rule ❌1)
🟠 ALTO        · endpoint GET /users/{id} sem verificação de ownership (IDOR) → scope ao user
🟡 MÉDIO       · lista de 500 users com .map direto → virtualizar (22)
🟢 NIT         · ordenação trivial num hook próprio → in-line (30-simplify)
```

## Regras

| Regra | Razão |
|---|---|
| `20-rules` primeiro | As regras absolutas barram sozinhas o merge |
| Segurança no servidor, não no cliente | Cliente só esconde; o servidor é a trust boundary |
| Só otimizar o que o profiler justifica | `memo`/`useMemo` têm overhead próprio |
| Comentários em bulletpoint | Curto, acionável, sem ruído (`05-conventions`) |
| Cruzar com `17`/`28`/`29` | Estático + verificação + pentest ativo cobrem níveis diferentes |
| Aprovar só quando bloqueantes resolvidos | O reviewer é gate de qualidade e segurança |

---

<a id="32-ci-cd"></a>

<!-- MÓDULO: 32-ci-cd -->

# CI/CD — Continuous Delivery e Deploy

> **Divisão de responsabilidade:** `24-ci-quality` garante a **qualidade no PR** (lint, typecheck,
> testes, `npm audit`, dependabot, gate de branch). Esta skill cuida do **percurso até produção**:
> ambientes, builds imutáveis, gate de promoção, estratégias de deploy, verificação pós-deploy e
> rollback. O build de qualidade gera o artefacto; esta skill decide **como e quando** ele sobe.

## Princípio central: build uma vez, promove a artefacto

O mesmo artefacto binário que passou no CI é o que vai para produção — **nunca** rebuildar no deploy.
Um build é imutável, versionado pelo commit, e promovido entre ambientes. Rebuildar por ambiente
introduz variação ("funciona em staging, falha em prod") e anula o que o CI validou.

```
commit ──▶ CI (build imutável + testes + audit) ──▶ artefacto v{sha}
                                                        │  promote
                                        ┌───────────────┴───────────────┐
                                        ▼                               ▼
                                     staging (e2e + axe)          produção (canary → full)
```

VITE_* fica incorporado no build: para promover o mesmo artefacto, usar API relativa
ou configuracao publica de runtime validada. Nunca injectar secrets no bundle.
Os exemplos exigem scripts/deploy.sh implementado para a plataforma, Sentry configurado
(se usado) e environments/permissoes reais; nao sao um deploy pronto por si.

## Ambientes

| Ambiente | Objetivo | Data | Quem decide |
|---|---|---|---|
| **Preview (por PR)** | Revisão visual/UX do change | Fake API / staging API | Revisor humano |
| **Staging** | Validação final (e2e + a11y + perf) | Clone realista | Automatizado |
| **Produção** | Live | Dados reais | Gate + aprovação |

## Build imutável + artefacto

```yaml
# .github/workflows/build.yml — gera o artefacto UMA vez
name: build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
      - run: npm run build
      # Enviar sourcemaps ao Sentry e apagar antes de empacotar (24-ci-quality)
      - run: npx sentry-cli sourcemaps upload dist/ --release "${{ github.sha }}"
      - run: find dist -name '*.map' -delete
      # Artefacto imutável, versionado pelo SHA
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: app-${{ github.sha }}
          path: dist/
          if-no-files-found: error
```

> Injetar a versão/commit no build (`VITE_APP_VERSION=${{ github.sha }}`) para o `Sentry.init`
> coincidir com o `--release` do upload (ver `24-ci-quality` §Sourcemaps e `11-error-handling`).

## Gate de promoção para produção

Só promover quando **todos** passam:

- [ ] `npm audit --audit-level=high` limpo (SCA — `17-security` §Skill 6)
- [ ] Sourcemaps enviados ao Sentry e removidos do artefacto
- [ ] Build/testes verdes no CI (`24-ci-quality`)
- [ ] E2E + axe passam no staging (`25-e2e`)
- [ ] Gate de segurança do cliente (`28-security-verification`) verde
- [ ] Aprovação humana (quando o risco justifica)

## Deploy no staging + e2e + a11y (bloqueante)

```yaml
# .github/workflows/build.yml — adicionar sob jobs, no MESMO workflow
  deploy_staging:
    runs-on: ubuntu-latest
    needs: build
    environment: staging
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with: { name: app-${{ github.sha }}, path: dist }
      - name: Deploy para staging
        run: ./scripts/deploy.sh staging dist
      - name: E2E + a11y (25-e2e)
        run: npx playwright test
        env: { E2E_BASE_URL: ${{ vars.STAGING_URL }} }
```

> O deploy do staging **dispara** o E2E contra o URL real de staging. E2E/axe falhar = não promove.

## Estratégias de produção (blue-green / canary)

Escolhe consoante o risco do change:

| Estratégia | Como | Quando |
|---|---|---|
| **Full deploy** | Troca direta do artefacto | Change de baixo risco |
| **Blue-green** | Duas versões; router aponta para a nova, volta se falhar | Risco médio; rollback instantâneo |
| **Canary** | % pequena de tráfego na nova, aumenta se monitorização estável | Risco alto; exposição gradual |

Canary via flag de runtime (back-end) para controlar % sem redeploy; via `VITE_*` (build) quando é só
visual. **Rollback = apontar para o build anterior** (guarda N versões na plataforma) — nunca
"corrigir à pressa em produção".

## Feature flags em releases arriscados

Funcionalidade arriscada entra **desligada atrás de flag**; liga-se só quando a monitorização
confirma estabilidade. Sem redeploy (flag runtime via endpoint de config) quando precisa de
ligar/desligar a quente; `VITE_ENABLE_*` (`15-env`) só para flags de build/visuais.

## Pós-deploy: verificação e observabilidade

Após promover para produção, confirmar antes de considerar completo:

- [ ] `/health` ou smoke check responde (HTTP 200)
- [ ] Erros no Sentry não subiram (críticos/altos estáveis) — `11-error-handling`
- [ ] Core Web Vitals não regrediram (RUM + `lighthouse-ci`) — `22-performance`
- [ ] Headers de segurança presentes no host de produção — `28-security-verification`

Se algo falha pós-deploy, executar o rollback (apontar para o build anterior) e investigar.

## Segurança no pipeline (não só qualidade)

- Secrets só via GitHub Secrets/`${{ secrets.* }}` — nunca no código nem em logs (CI logs ficam
  públicos em forks mal configurados).
- Guardar artefactos com permissões restritas; não expor o `dist/` de staging sem auth.
- Correr `29-pentest` (ativo) apenas com autorizacao explicita, alvos e limites definidos; nunca como efeito automatico de um PR — a superfície de produção
  difere do dev server.
- Pipelines com `GITHUB_TOKEN` com mínimo privilégio; não marcar actions de terceiros como `trusted`
  sem rever.

## Regras

| Regra | Razão |
|---|---|
| Build uma vez, promove o artefacto | Nunca rebuildar no deploy (variação entre ambientes) |
| Artefacto versionado pelo SHA | Rastreabilidade e rollback determinístico |
| E2E + axe correm contra o staging real | O dev server não representa produção |
| `npm audit`/SCA bloqueia a promoção | Vulnerabilidade conhecida não vai para prod |
| Blue-green/canary para risco alto | Exposição gradual e rollback instantâneo |
| Rollback = build anterior | Nunca hotfix à pressa em produção |
| Secrets só via `${{ secrets.* }}` | CI logs podem tornar-se públicos |
| Feature flag para releases arriscados | Desligar sem redeploy quando necessário |
| Pós-deploy: smoke + Sentry + Vitals + headers | "Deployed" só quando verificado, não quando empurrado |
| `29-pentest` periódico no staging | Superfície de produção difere do dev; testar o real |

## Dependências

```
24-ci-quality (qualidade no PR) ──▶ 32-ci-cd (promoção ao deploy)
                                        ├─▶ 25-e2e (e2e+axe no staging)
                                        ├─▶ 28-security-verification (gate do cliente)
                                        └─▶ 11-error-handling / 22-performance (pós-deploy)
```

---

<a id="33-orchestration"></a>

<!-- MÓDULO: 33-orchestration -->

# Orquestracao e eficiencia

Aplicar as [regras essenciais](20-rules/SKILL.md). A capacidade e escolhida pela
incerteza e pelo risco da tarefa, nao apenas pelo numero de linhas a escrever.

## Encaminhamento

| Trabalho | Responsavel sugerido | Verificacao |
|---|---|---|
| Requisitos ambiguos, arquitetura, contratos transversais | Modelo de maior capacidade | Decisoes e criterios de aceitacao explicitos |
| Alteracao local com contrato fechado e testes claros | Modelo economico | Testes e revisao proporcional ao risco |
| Auth, seguranca, concorrencia, migracoes, varias camadas | Modelo capaz; partes mecanicas podem ser delegadas | Revisao de maior capacidade e testes das fronteiras |
| Alteracao trivial reversivel | Execucao direta | Verificacao curta, sem cadeia de agentes obrigatoria |

O orquestrador le primeiro o contexto necessario e decide o que ja esta resolvido.
Nao delegar uma tarefa vaga com a expectativa de que o executor redesenhe o sistema.
O executor tambem raciocina: verifica pressupostos, preserva convencoes e escala
incerteza material. Nao gerar codigo mecanicamente contra evidencias do projeto.

## Contrato de delegacao

Enviar apenas este pacote e as referencias pertinentes:

```text
Objetivo observavel:
Ficheiros permitidos e interfaces que devem permanecer estaveis:
Decisoes ja tomadas e contexto relevante:
Skills/recursos a consultar (caminhos exatos):
Criterios de aceitacao e comandos de verificacao:
Limites de autonomia e condicoes para escalar:
Entrega: ficheiros alterados, testes executados, resultados e incertezas.
```

Dividir escrita paralela por ficheiros disjuntos. O orquestrador integra e verifica
o resultado, incluindo divergencias do contrato. Nao reenviar historico inteiro,
master, logs extensos ou modulos sem relacao com a tarefa.

## Escalada e paragem

Escalar quando falta um contrato, uma dependencia nao existe, ha conflito entre
regras ou a correcao exige mudar arquitetura/escopo. Enviar o erro reproduzivel,
ficheiros afetados e alternativas. Depois de duas tentativas sem progresso no mesmo
erro, reavaliar com maior capacidade em vez de repetir o mesmo prompt.
Uma escalada nao autoriza novas operacoes externas nem alarga o pedido do utilizador.
Nao inventar resultados de testes ou autorizar merge/deploy a partir de uma revisao textual.

## Ferramenta e modelos

Os papeis nao selecionam modelos por si. Confirmar se a ferramenta instalada permite
subagentes e modelos por papel; configurar isso na ferramenta. Sem suporte, executar
as fases sequencialmente ou indicar a limitacao. Nao simular que houve delegacao.
Registar modelo/versao/configuracao reais; nao fixar nomes comerciais ou precos nesta skill.

## Avaliacao economica

Comparar baseline (um modelo) e estrategia delegada nos mesmos cenarios e revisao.
Registar tokens de entrada/saida/cache, custo observado, tempo, revisoes, falhas e
qualidade por criterio. O custo inclui orquestracao, executores, revisao e retrabalho.
Ausencia de medicao significa poupanca nao demonstrada. Menos euros nao significa
menos tokens. Usar os cenarios e formato em tests/evaluations no repositorio fonte.

---

<a id="99-example"></a>

<!-- MÓDULO: 99-example -->

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
