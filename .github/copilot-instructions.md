# Instruções do projeto (React / Next.js)

Aplicar estes princípios durante o desenvolvimento deste projeto. Priorizar o que já existe no repositório antes de introduzir novos padrões.

## Estrutura e camadas

- Manter a arquitetura atual do projeto: `app`, `UI`, `services`, `context`, `config`, `types`, `lang`, `lib`, `hooks`.
- Respeitar a separação de responsabilidades:
  - `app/`: páginas e layout principal
  - `UI/components/`: componentes reutilizáveis da interface
  - `context/`: providers e estado global
  - `services/hooks/`: hooks de domínio e acesso a contexto
  - `services/transporters/`: acesso a dados e persistência local/externa
  - `types/`: contratos e DTOs da aplicação
  - `lang/`: i18n e textos
  - `config/`: dados e presets da aplicação
- Não inventar uma estrutura `src/` se o projeto já usa outra convenção.
- Quando criar uma feature, preferir seguir o padrão já existente em vez de impor um novo layout.

## Padrão arquitetural do repo

- O ponto de entrada da aplicação fica em `app/page.tsx` e funciona como orquestrador da UI, montando providers e compondo módulos.
- Os providers de estado ficam em `context/`, por exemplo `HousekeepingProvider`, `AuthProvider` e `ThemeProvider`.
- Os hooks ficam em `services/hooks/<dominio>/` e devem consumir o contexto relevante ou expor uma API simples para a UI.
- Os transporters ficam em `services/transporters/<dominio>/` e encapsulam acesso a dados, regras de persistência e cálculo de dados derivados.
- Os tipos ficam em `types/*.types.ts` e devem refletir os contratos usados pelos providers, hooks e componentes.
- As interfaces das páginas devem ficar separadas dos componentes, em `types/pages/` ou em ficheiros dedicados por feature, por exemplo `types/pages/housekeeping-page.types.ts`.
- Os componentes visuais devem viver em `UI/components/<feature>/`, com uma pasta por feature ou módulo e exports nomes explícitos.
- `app` não deve virar uma pasta com lógica de negócio; a lógica deve permanecer em hooks/context/transporters.
- Quanto às pastas, seguir o padrão já usado neste repo antes de introduzir qualquer nova convenção.

## Regras para interfaces de página

- Nenhuma interface de página deve ficar embebida no próprio ficheiro da página.
- Definir props, estados e contratos de modal/filters em tipos separados.
- Manter os nomes consistentes: `PageProps`, `PageState`, `ModalState`, `FilterState`, etc.
- Quando uma página for reutilizada ou tiver múltiplos blocos de UI, separar os tipos por feature em `types/pages/<feature>.types.ts`.
- Os componentes continuam a receber props tipadas, mas a origem dessa tipagem vive nos ficheiros de tipos, não no componente em si.

## React e TypeScript

- Usar React + TypeScript com tipagem forte.
- Preservar strictness do TypeScript e evitar `any` quando possível.
- Usar `interface` ou tipos explícitos para props, DTOs e contratos de API.
- Não suprimir erros só para “fechar” uma implementação.

## Dados, UI e UX

- Validar inputs e respostas nas fronteiras da aplicação.
- Tratar sempre os estados de UI: loading, error, empty e success.
- Usar i18n para todo texto visível.
- Respeitar acessibilidade: labels, foco, navegação por teclado e contraste.
- Para ações destrutivas, incluir confirmação adequada.
- Para autenticação, manter tokens sensíveis em memória e não expor segredos no cliente.

## Regras de implementação

- Preservar comportamento e escopo do pedido.
- Não corrigir problemas fora do contexto da tarefa.
- Se houver incerteza de arquitetura, consultar o código existente antes de mudar a estrutura.
- Preferir reaproveitamento de componentes e hooks já existentes.
- Quando criar código novo, manter nomes consistentes com o projeto e os arquivos existentes.

## Qualidade

- Confirmar que a mudança funciona com testes ou validação proporcional ao impacto.
- Manter código simples, legível e alinhado com o padrão do repositório.
- Não introduzir dependências desnecessárias.

## Ambiente de referência

Este repositório é um app React/Next.js e não um setup genérico de `src` + React Router. O objetivo é manter a arquitetura do projeto real e usar os princípios do React enterprise apenas como guia, sem forçar um padrão que não exista.
