---
name: 22-performance
description: >
  Core Web Vitals e otimização: code-splitting, memoização, virtualização.
  Use when: performance, lento, Core Web Vitals, bundle, lazy loading, otimizar.
metadata:
  stack: "react-web"
  scope: "performance"
  requires: "[]"
  related: "[03-domain-structure, 07-react-query, 12-loading-states, 13-routes, 17-security, 24-ci-quality]"
  last-verified: "2026-07-25"
---
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
