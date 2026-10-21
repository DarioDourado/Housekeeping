# Context Prompt — [NOME DO PROJETO]

> Template referenciado por `00-meta` §Context Prompt. Uma cópia preenchida deste ficheiro
> vive na raiz de cada projeto (ex.: `.github/context-prompt.md`) e complementa as skills:
> as skills dizem **como** construir; este ficheiro diz **o quê** e **para quem**.

## 1. Identificação

- **Projeto:** [nome]
- **Propósito:** [1–2 frases — o que a app faz e para quem]
- **Backend:** [Laravel x.x / FastAPI x.x] em [URL base por ambiente]
- **Utilizadores-alvo:** [perfil, nível técnico, contexto de uso — ex.: rececionistas de hotel, uso diário intensivo em desktop]

## 2. Domínios

> 1 domínio = 1 pasta em hooks + transporters + types (`03-domain-structure`).

| Domínio | Entidade principal | Operações | Notas |
|---|---|---|---|
| [users] | User | CRUD completo | [ex.: só admin cria] |
| [contacts] | Contact | CRUD + import CSV | |
| [...] | | | |

## 3. Roles e permissões

> Os roles NUNCA são hardcoded nas skills (`20-rules` ❌14) — definem-se aqui.

| Role | Descrição | Acessos |
|---|---|---|
| `admin` | [descrição] | [tudo] |
| `manager` | [descrição] | [ex.: users read-only, contacts CRUD] |
| [...] | | |

**Lembrete:** `ProtectedRoute roles={[...]}` é só UX — o backend revalida sempre (`08-auth`).

## 4. Glossário do domínio (Heurística 2 — `09-i18n` §Terminologia)

> O mesmo termo traduz-se sempre da mesma forma em toda a app.

| Termo canónico (PT) | Nunca usar | Contexto |
|---|---|---|
| [ex.: "colaborador"] | [funcionário, utilizador] | [pessoas internas] |
| [ex.: "reserva"] | [booking, marcação] | |

## 5. Regras de negócio específicas

- [ex.: uma reserva não pode ser eliminada depois de check-in — o botão nem aparece]
- [ex.: valores monetários sempre em EUR, `formatCurrency` de `09-i18n`]
- [...]

## 6. Features / páginas

| Rota | Página | Roles | Módulos relevantes |
|---|---|---|---|
| `/dashboard` | Dashboard | todos | `12`, `22` |
| `/[domain]` | Lista + CRUD | [...] | `27-data-table`, `06`, `10` |
| [...] | | | |

## 7. Integrações e exceções documentadas

- **WebSockets:** [sim/não — eventos e mapa de invalidação (`18` §Integração TanStack Query)]
- **Uploads:** [tipos/tamanhos aceites (`10-forms` §Uploads)]
- **Analytics:** [ferramenta + confirmação de gate por consentimento (`26-privacy`)]
- **Exceções às skills:** [nenhuma, idealmente — se existirem, listar com justificação e prazo]
