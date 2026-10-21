---
name: 04-stack
description: >
  Catálogo de bibliotecas da stack, tokens de design, breakpoints e critério de uso de estado.
  Use when: que lib usar, Tailwind, design tokens, responsividade, Zustand vs Context vs React Query.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[06-patterns, 13-routes, 17-security, 22-performance, 23-accessibility]"
  last-verified: "2026-07-25"
---
# STACK - Stack Tecnológica

## Contexto de renderização — SPA/CSR pura (declarado, não implícito)

Este sistema assume **SPA client-side rendering** com Vite. Implicações a conhecer antes de o aplicar: SEO limitado (aceitável para apps autenticadas/back-office, o caso de uso alvo), TTFB não crítico, CSP sem nonces dinâmicos (`17-security`). Para conteúdo público indexável ou LCP de página inicial agressivo, a resposta é SSR/SSG (Next.js) — **fora do âmbito destas skills**; não tentar dobrar este sistema para esse caso.

## Core

| Lib | Versão | Propósito |
|-----|--------|-----------|
| React | 19+ | UI |
| TypeScript | 5+ | Types (strict mode) |
| Vite | 6+ | Build |
| React Router DOM | 7+ | Routing |

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
