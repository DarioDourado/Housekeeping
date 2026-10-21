# Auditoria Final — v1.1+ como "bíblia" do Copilot (VS Code)

> **Data:** 2026-07-03 · **Corpus:** 29 módulos (`00`–`27` + `99-example`) + scripts + template
> **Lente desta auditoria:** o objetivo declarado é usar estas skills no VS Code para que o agente (Copilot/equivalente) siga sempre Page → Hook → Transporter, estrutura de pastas, types, etc. A pergunta deixou de ser "a regra existe?" (fechado na V2) e passou a ser **"um agente encontra e segue a regra certa, e a regra está provada?"**

## Veredito

**Pronto para uso como sistema de instruções.** As 4 melhorias foram executadas e verificadas; o corpus passou de "documentação correta" a **documentação provada** (compilada e testada) com pipeline de integração para o VS Code. Uma melhoria continua pendente por dependência externa (corpora RN/FastAPI não montados) e há 1 recomendação operacional (tamanho do master — ver §4).

---

## 1. Validação empírica — o corpus agora está provado, não só escrito

Projeto de referência real (Vite + TS + deps do `04-stack`) construído com o código literal das skills:

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` com as flags de `14-types` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | ✅ limpo |
| Vitest — 6 testes: Button (2), **single-flight do refresh** (2× 401 concorrentes → exatamente 1 `POST /auth/refresh`; retry com token novo), **fronteira Zod** (resposta malformada → `ZodError`) | ✅ 6/6 |
| `vite build` com `sourcemap: 'hidden'` | ✅ 69.9 kB gzip (orçamento <250 kB) |

**Achado real corrigido pela validação** (a prova de que este passo valia o custo): o padrão antigo de `14-types` — interface manual de entidade + schema Zod espelhado — **não compila** com `exactOptionalPropertyTypes: true` (opcionais do `z.infer` são `string | undefined`, incompatíveis com `phone?: string` manual). Regra reescrita e validada: **entidade = `z.infer` do schema de output**, uma única fonte de verdade. Sem a validação empírica, o Copilot geraria código que o próprio tsconfig do sistema rejeita.

## 2. Padrões novos (âmbito back-office completado)

| Adição | Verificação |
|---|---|
| `27-data-table` | Sort/paginação na URL (herda `07`), `aria-sort`, seleção por página visível, densidade via Zustand (critério de `04`), CSV com BOM UTF-8 e limite client/backend, escape hatch para `@tanstack/react-table` |
| `18` §Integração TanStack Query | Eventos WS → `invalidateQueries` (servidor continua fonte de verdade), com exceção justificada para alta frequência — fecha a ponte `18`↔`07` que faltava |
| `06` §Modal Pattern | Modal genérico com focus trap/Escape/portal; ISP explícito (ConfirmDialog compõe, não herda props) — o exemplo teórico de `19-solid` passou a componente real |
| `99-example` | Domínio `contacts` de ponta a ponta com o código **validado** do §1 — a resposta canónica a "cria um domínio novo" |

## 3. Higiene automatizada do corpus

| Adição | Verificação |
|---|---|
| `scripts/lint-corpus.sh` | 6 famílias de checks (referências cruzadas, anti-padrões, sourcemaps, keys i18n, indexação, regras de segurança nos módulos-lei). **Já provou valor em uso:** apanhou o `27-data-table` não indexado e 2 falsos positivos que levaram a afinar os padrões. Estado atual: ✅ limpo |
| `scripts/build-master.sh` | `react-master.md` regenerado dos módulos (v1.1, 29 módulos, 6570 linhas, com índice ancorado). Deixou de existir a baseline congelada v1.0 desatualizada — o master é agora um artefacto derivado, nunca editado à mão |
| `CONTEXT-PROMPT-TEMPLATE.md` | O ficheiro que `00-meta` referenciava mas não existia: domínios, roles, glossário (liga à Heurística 2 de `09`), regras de negócio, exceções documentadas |
| `USAGE_GUIDE` §VS Code + Copilot | Setup concreto: `react-master.md` → `.github/copilot-instructions.md` + Context Prompt preenchido; tabela por ferramenta (Copilot/Cursor/Claude Code/Antigravity). Removida a referência obsoleta a `templates/.cursorrules` inexistente |

## 4. Teste de usabilidade para agente — "o Copilot sabe o que fazer?"

Simulação dos pedidos típicos contra o corpus (o cenário real de uso):

| Pedido ao Copilot | O corpus responde sem ambiguidade? |
|---|---|
| "Adiciona um hook para X" | ✅ `03` (nomenclatura/1 hook=1 ficheiro) + `07` (padrão) + `99` (exemplo compilável) — sem forma de errar a camada |
| "Cria o domínio Y" | ✅ `99-example` é a resposta literal; checklist em `03`/`20` |
| "Adiciona um campo opcional à entidade" | ✅ `14` agora força `z.infer` — o erro de interface paralela ficou impossível de reproduzir |
| "Faz uma tabela com ordenação" | ✅ `27-data-table` (antes: inexistente — o agente inventaria) |
| "Chama a API diretamente na page" | ✅ Bloqueado por `20-rules` ❌2 + `01` + `19` §DIP |
| "Guarda o token no localStorage" | ✅ Bloqueado por `20-rules` ❌1 + `08` + `21` §limitação |
| "Um evento do socket chegou, atualiza a lista" | ✅ `18` §Integração TanStack Query (antes: gap real) |

**Recomendação operacional (única pendência nova):** o master tem 6570 linhas — como `.github/copilot-instructions.md` funciona, mas ferramentas com janelas de instrução pequenas podem truncá-lo. Se notares o Copilot a "esquecer" regras: gerar uma variante condensada (`20-rules` + `01` + `03` + resumos de padrões + ponteiros para os módulos) — o `build-master.sh` é o sítio natural para essa segunda saída. Só vale a pena fazer se o problema se manifestar na prática.

## 5. Pendente por dependência externa

**Verificação cruzada RN/FastAPI** — os corpora não estão nesta pasta. A tabela de 9 contratos (`AUDITORIA-11-EIXOS.md` §final) está pronta; o lado web define o valor canónico de todos. Quando montares essas pastas, a auditoria cruzada fecha em uma sessão.

## Estado final do sistema

| Dimensão | v1.0 (início) | Agora |
|---|---|---|
| Módulos | 22 (4 órfãos, índice quebrado) | 29, todos indexados, grafo atualizado |
| Gaps ≥ Médio nos 11 eixos | 16 | 0 |
| Código dos padrões | Nunca compilado | tsc + 6 testes + build ✅ (1 regra corrigida pela prova) |
| Contradições internas | 3 famílias | 0 (lint automatizado a guardar) |
| Integração VS Code/Copilot | Referência obsoleta a ficheiro inexistente | Pipeline documentado: master gerado → copilot-instructions + Context Prompt |
| Manutenção | Manual, sem verificação | `lint-corpus.sh` + `build-master.sh` |
