---
name: 34-backend-fastapi
description: >
  Backend Python FastAPI do Housekeeping e contrato FE-BE (Pydantic v2, auth, erros, Opera, testes).
  Fonte de verdade do contrato de dominio; manter sincronizada com types, transporters e config/constants.ts do FE.
  Use when: backend, FastAPI, Pydantic, API, endpoint, contrato FE-BE, modelo de dados, migracao, Opera sync.
metadata:
  stack: fastapi
  scope: backend
  last-verified: "2026-10-21"
---
# Backend FastAPI e contrato FE-BE

O FE React (ver [arquitetura](../01-architecture/SKILL.md)) consome uma API FastAPI.
O contrato de dominio vive em [domain-contract.md](references/domain-contract.md) e e
a unica fonte de verdade: FE (Zod) e BE (Pydantic) espelham-no.

## Regra de manutencao (obrigatoria)

Alterar qualquer um destes no FE obriga a atualizar `domain-contract.md` (e o
changelog no fim) no mesmo trabalho, antes de dar a tarefa por concluida:

- `types/**`, `services/transporters/**`, `config/constants.ts`
- regras de negocio de estados, permissoes ou sincronizacao com o Opera
- decisoes fechadas da reuniao (marcar `PENDENTE` como `DECIDIDO` com data)

Ao iniciar o BE: comparar `last-verified` com o historico git destes caminhos e
reconciliar primeiro. Contrato desatualizado = tarefa bloqueada.

## Stack

| Peca | Escolha |
|---|---|
| Linguagem | Python 3.12+, tipado (mypy strict, ruff) |
| API | FastAPI + Pydantic v2 (DTOs), uvicorn |
| Dados | SQLAlchemy 2 (async) + Alembic, PostgreSQL |
| Config | pydantic-settings, segredos so por ambiente |
| Auth | PyJWT + hash argon2 |
| Testes | pytest, pytest-asyncio, httpx.AsyncClient |

Versoes fixadas em `pyproject.toml` e verificadas na altura da instalacao; nao
copiar versoes desta skill.

## Camadas (espelham Pages → Hooks → Transporters)

| Camada | Faz | Nao faz |
|---|---|---|
| Router (`api/v1/routers`) | HTTP, validacao Pydantic, dependencia de permissao | Logica de negocio, SQL |
| Service (`services`) | Regras, maquina de estados, eventos, transacoes | HTTP, ORM direto fora de repositories |
| Repository (`repositories`) | Queries SQLAlchemy | Regras de negocio |
| Integration (`integrations/opera`) | Falar com Opera atras de um `Protocol` | Regras de planeamento |

```
backend/
├── app/
│   ├── api/v1/routers/{domain}.py     # 1 router por dominio, nomes iguais aos do FE
│   ├── schemas/{domain}.py            # DTOs Pydantic (camelCase no fio)
│   ├── models/{domain}.py             # ORM
│   ├── services/{domain}_service.py
│   ├── repositories/{domain}_repository.py
│   ├── integrations/opera/            # OperaClient (Protocol), FakeOperaClient, OhipClient
│   ├── core/                          # config, security, deps, errors, permissions
│   └── main.py
├── migrations/                        # Alembic
└── tests/                             # espelha app/
```

Dominios (mesmo nome em FE `hooks/`, `transporters/`, `types/` e BE): `auth`, `staff`,
`rooms`, `sections`, `plans`, `tasks`, `events`, `opera`, `messages`.

## Convencoes do contrato

- Base `/api/v1`; JSON `camelCase` (`alias_generator=to_camel`, `populate_by_name=True`).
- IDs UUID em string; datas e horas ISO-8601 UTC com fuso (o FE formata para exibir).
- Enums com os mesmos valores que os enums TS do FE; alterar um obriga a alterar o outro.
- Erros em `application/problem+json`: `{ type, title, status, detail, code }`; `code` estavel para i18n no FE.
- Listas paginadas: `{ items, total, page, pageSize }`.
- Concorrencia otimista: recursos mutaveis tem `version`; `PATCH` envia `If-Match`; conflito = 409.
- Acoes idempotentes: o cliente envia `clientEventId` (fila offline); repetir nao duplica o evento.
- Cliente FE gerado a partir do OpenAPI (orval) ou tipos Zod escritos a mao, sempre com `schema.parse` no transporter.

```python
class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

@router.post("/tasks/{task_id}/start", response_model=TaskOut)
async def start_task(task_id: UUID, body: StartTaskIn, user: User = Depends(require("task.startFinish"))):
    return await task_service.start(task_id, body, actor=user)
```

## Auth e permissoes

Espelha [08-auth](../08-auth/SKILL.md): access token curto no corpo (o FE guarda em memoria),
refresh em cookie `httpOnly; Secure; SameSite=Strict` com rotacao e deteccao de reutilizacao,
CORS com origens explicitas e `allow_credentials`, limite de tentativas no login.
Autorizacao e do servidor: dependencia `require(permission)` com a matriz do contrato
(espelho de `ROLE_PERMISSIONS` em `config/constants.ts`) mais escopo (governanta = a sua
area; empregada = tarefas atribuidas). O FE esconde, o BE decide.

Telemoveis partilhados: sessao por utilizador, mas cada evento guarda quem **registou**
(`registeredById`), o dispositivo e, quando conhecido, quem **executou** (`executorIds`).

## Regras de negocio nao negociaveis

- Servico diurno, turndown e refresh sao `ServiceTask` distintas do mesmo quarto; nunca se substituem.
- Estado Opera (Dirty/Clean/Inspected) nao e estado de tarefa; turndown nunca o altera.
- DND e Refuse Service sao `NOT_PERFORMED` com motivo; nunca contam como limpo.
- Eventos sao append-only; estatisticas reconstroem-se dos eventos.
- Nunca sobrescrever um estado Opera mais recente com uma escrita antiga: criar `OperaSyncJob` em `CONFLICT`.
- O dia operacional fecha em `OPERA_DAY_CLOSE_HOUR`, nao as 00h00.
- Configuracao base (secoes) e distribuicao do dia (plano) sao independentes.

## Seguranca, privacidade e testes

Validar tudo em Pydantic na fronteira; SQL apenas via ORM parametrizado; logs sem PII
(ver [26-privacy](../26-privacy/SKILL.md) e [17-security](../17-security/SKILL.md)); dados de
hospedes minimizados e com retencao definida (PENDENTE no contrato).

Testes: pytest por service e por router; cenarios CT-01 a CT-20 do requisito como testes de
aceitacao; teste de contrato que falha se o `openapi.json` divergir do snapshot versionado.

## Checklist: novo dominio no BE

```
□ Entrada no domain-contract.md (entidade, enums, estados, endpoints)
□ schemas + models + repository + service + router, nomes iguais ao dominio FE
□ Migracao Alembic revista (nunca editar uma ja aplicada)
□ Permissao em core/permissions e em config/constants.ts
□ Testes de service, router e contrato
□ Changelog do contrato atualizado e last-verified revisto
```
