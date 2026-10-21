---
name: 02-folder-structure
description: >
  Árvore base de pastas em src/ e critério de promoção de componentes.
  Use when: estrutura de pastas, onde criar ficheiro, layout src, promoção de componente.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[03-domain-structure, 04-stack, 22-performance]"
  last-verified: "2026-07-25"
---
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
