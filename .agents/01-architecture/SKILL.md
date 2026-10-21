---
name: 01-architecture
description: >
  Camadas Pages → Hooks → Transporters → Backend API e responsabilidades de cada uma.
  Use when: arquitetura, camadas, fluxo de dados, onde vai a lógica.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[]"
  last-verified: "2026-07-25"
---
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
