---
name: 23-accessibility
description: >
  WCAG 2.2 AA por omissão: contraste, foco, formulários, rotas.
  Use when: acessibilidade, a11y, contraste, WCAG, screen reader.
metadata:
  stack: "react-web"
  scope: "ux"
  requires: "[]"
  related: "[06-patterns, 10-forms, 11-error-handling, 13-routes, 20-rules]"
  last-verified: "2026-07-25"
---
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
export const Layout = () => (
  <div className="flex h-screen">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2"
    >
      Saltar para o conteúdo principal
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
```

### Focus trap em modais/drawers

O `ConfirmDialog` de `06-patterns` já move o foco para o diálogo ao abrir e fecha com `Escape`. Para modais maiores (com múltiplos campos focáveis), acrescentar um trap completo:

Usar a [referencia compilada](references/useFocusTrap.ts), com teste de teclado e
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
  await Promise.all([...selectedIds].map((id) => deleteUser.mutateAsync(id)));
  setSelectedIds(new Set());
  setBulkDeleteOpen(false);
};

return (
  <>
    {selectedIds.size > 0 && (
      <div role="toolbar" aria-label={t('common.bulkActions')} className="flex items-center gap-2 p-2">
        <span>{selectedIds.size} selecionado(s)</span>
        <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
          Eliminar selecionados
        </Button>
      </div>
    )}
    {/* cada linha da lista tem um <input type="checkbox" onChange={() => toggleSelect(user.id)} /> */}
    <ConfirmDialog
      isOpen={bulkDeleteOpen}
      title="Eliminar utilizadores selecionados"
      message={`Tens a certeza que queres eliminar ${selectedIds.size} utilizador(es)? Esta ação não pode ser revertida.`}
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
