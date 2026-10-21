# Auditoria e validacao atual

**Veredito: nao pronto para aprovacao integral; utilizavel em piloto controlado.**

Data: 2026-09-08. Relatorio apos as correcoes autorizadas, nao uma certificacao.
Os testes locais passaram, mas nao substituem os cenarios completos nem a descoberta
real por VS Code/Copilot/Antigravity. Nao foram feitos deploy, pentest ou alteracoes
na instalacao do IDE. Nao foi feito commit nesta continuacao.

## Achados pendentes, por gravidade

### Alta: exemplos Markdown ainda fora da compilacao

- Ficheiros: tsconfig.json:26; 06-patterns/SKILL.md:15;
  07-react-query/SKILL.md:15; 99-example/SKILL.md:17.
- Evidencia: o typecheck inclui referencias TS/TSX e testes, nao extrai os blocos
  Markdown. Os exemplos usam aliases, DTOs e transporters de um projeto consumidor.
  As alegacoes historicas de 99-example foram explicitamente separadas da validacao atual.
- Impacto: compilacao verde nao prova que um dominio gerado a partir de todos os
  exemplos compila nem que as interfaces entre eles coincidem.
- Correcao: montar um dominio CRUD completo executavel; migrar exemplos canonicos
  para referencias compiladas e gerar/incluir excertos a partir dessas fontes.
  Cada bloco restante deve ser classificado como executavel ou pseudocodigo.

### Alta: cobertura comportamental e de integracao incompleta

- Ficheiros: tests/evaluations/README.md:1; tests/auth.test.ts:1;
  tests/socket.test.ts:1; tests/fixture/main.tsx:1.
- Evidencia: auth usa adapter Axios e sockets usam um double. A fixture de login
  rejeita explicitamente submissao porque nao tem backend configurado.
- Impacto: cookies reais, CORS/CSRF, revogacao remota, troca de conta durante login,
  varias tabs, reconnect em rede real e os onze pedidos completos nao foram aprovados.
- Correcao: backend local sintetico, Playwright e execucoes repetidas em ambos os IDEs.
  Testar negativos e positivos; nao aceitar apenas ausencia de erros.

### Media: descoberta pelo IDE e consumo do contexto nao demonstrados

- Ficheiros: USAGE_GUIDE.md:1; react-core.md:1; scripts/corpus.mjs:1.
- Evidencia: empacotamento e ligacoes testados em diretorio temporario; nenhum
  registo de descoberta real ou versao do IDE/extensao produzido nesta execucao.
- Impacto: ficheiros corretos no disco nao garantem ativacao nem obediencia do agente.
  O master tem cerca de 247 KB; carregar tudo continua a ser desaconselhado.
- Correcao: homologar instalacao nova, confirmar os 35 nomes, executar pedidos
  que ativem 08-auth e 33-orchestration e guardar evidencias observaveis.
  Usar o core de 76 linhas e carregar especializacoes por tarefa.

### Media: detecao de contradicoes e referencias tem alcance limitado

- Ficheiro: scripts/corpus.mjs:1.
- Evidencia: validacao de YAML, nomes, links Markdown locais, referencias NN-nome,
  artefactos gerados e heuristicas criticas. Nao interpreta todas as instrucoes,
  imports dentro de exemplos, referencias em texto livre ou ancora de cada secao.
  A verificacao interrompe-se no primeiro erro; nao agrega todos os erros possiveis.
- Impacto: um novo conflito semantico pode passar. Zero falhas significa zero
  falhas nas verificacoes implementadas, nao ausencia universal de problemas.
- Correcao: contratos de invariantes estruturados, verificacao de ancoras/imports,
  diagnosticos agregados e revisao semantica com evidencias, sem auto-aprovacao por LLM.

### Media: eficacia economica nao medida

- Ficheiros: 33-orchestration/SKILL.md:13; tests/evaluations/README.md:1.
- Evidencia: protocolo existe; nao existem resultados baseline/delegado comparaveis.
  Os dois auxiliares tentados atingiram limites de utilizacao; o trabalho continuou
  diretamente. Isso nao demonstra economia.
- Impacto: orquestrar mais pode aumentar custo e latencia.
- Correcao: medir entrada, saida, cache, revisao, retrabalho, qualidade e tempo.
  Valores indisponiveis devem ser null. Nao limitar o executor a escrita cega:
  deve validar pressupostos e escalar ambiguidades.

### Baixa: template de autenticacao tem escopo deliberadamente reduzido

- Ficheiros: 21-react-auth-page/SKILL.md:15;
  21-react-auth-page/references/AuthPage.template.tsx:1.
- Evidencia: o template atual implementa login real por callback injetado.
  Registo, recuperacao e OAuth nao sao implementados nem simulados.
- Impacto: nao e uma pagina com tres fluxos pronta para qualquer backend.
- Correcao: adicionar esses fluxos apenas com contratos, schemas, politica de
  password e respostas anti-enumeracao definidos, mais testes especificos.

## Correcoes entregues

| Area | Evidencia atual | Resultado |
|---|---|---|
| Descoberta | MODULES.md; metadados de todos os SKILL.md | 35 modulos: 00 a 33, mais 99; sem buracos nesta sequencia intencional |
| Indices | README.md, USAGE_GUIDE.md, 00-meta/SKILL.md | Apontam para catalogo completo gerado, em vez de listas manuais divergentes |
| Metadados | name igual a pasta; metadata com valores string | Referencias antigas web-* substituidas pelos nomes atuais |
| Distribuicao | scripts/corpus.mjs; build-master.sh | Master, core e catalogo deterministas; recursos incluidos no pacote |
| Auth | 08-auth/references; tests/auth.test.ts | Single-flight, limite de retry, cancelamento de sessao e validacao de respostas |
| Socket | 18-websockets/references; tests/socket.test.ts | Gate de autenticacao, retries limitados e cancelamento de reconnect |
| Formularios | 10-forms; 21-react-auth-page | Role preenchivel; erros de servidor validados/allowlist; login RHF/Zod sem falso sucesso |
| Privacidade | 10-forms; 11-error-handling; 26-privacy | Removido draft indiscriminado, limpeza de sessao e alegacoes de anonimato automatico |
| Rotas | 13-routes | Lazy imports adaptados a named exports |
| Acessibilidade | 12-loading-states; 23-accessibility/references | Spinner anunciado; foco, exclusao de controlos hidden/disabled e restauro testados |
| CSV | 27-data-table/references/escapeCsvCell.ts | Quoting e neutralizacao de prefixos de formulas testados |
| Entrega | 32-ci-cd | needs no mesmo workflow; checkout/dependencias; E2E_BASE_URL; limites de VITE_* explicitos |
| CI do corpus | .github/workflows/corpus.yml | Instala lockfile, valida corpus/tipos/testes/build e verifica dependencias |
| Custo | instructions/core.md; 33-orchestration | Planeamento capaz, execucao economica delimitada, revisao e escalada proporcionais |

## Matriz comportamental

Analise de orientacao, nao execucao dos onze pedidos por um agente consumidor.
As linhas sao aproximadas; os titulos das secoes identificam a evidencia.

| Cenario | Modulos | Esperado | Evidencia | Ambiguidade / melhoria |
|---|---|---|---|---|
| Dominio React completo | 00, 01, 02, 03, 06, 14, 16, 20, 99 | Page compoe hook; transporter faz HTTP/parse; schema e testes | 03-domain-structure; 99-example:17 | Media: falta fixture CRUD completa compilada |
| Hook TanStack Query | 03, 07, 14, 16, 19 | Chave inclui filtros; resposta validada; invalidacao e erros | 07-react-query:15, secoes Mutation/Infinite | Media: testar cache filtrada, rollback concorrente e contrato getPage |
| Formulario RHF/Zod | 09, 10, 14, 23 | Campos obrigatorios, labels, validacao e 422 traduzido | 10-forms:19; tests/form.test.tsx | Media: login testado nao valida UserForm completo |
| Auth e refresh concorrente | 08, 11, 14, 17, 26 | Token em memoria, refresh partilhado, sessao nao ressuscita apos logout | 08-auth/references/auth-client.ts; tests/auth.test.ts | Baixa no contrato local; falta integracao real de cookies e troca de conta |
| Token em localStorage | 08, 17, 20 | Recusar persistencia e propor memoria/cookie backend | 20-rules; instructions/core.md:16 | Baixa na regra; confirmar obediencia num teste adversarial no IDE |
| API diretamente na page | 01, 03, 06, 19, 20 | Encaminhar via hook/transporter, sem camada paralela | 06-patterns:15, :74; core:12 | Baixa; verificar diff gerado no cenario completo |
| Tabela paginada e ordenada | 07, 12, 14, 23, 27 | URL validada, sort backend, selecao visivel e CSV seguro | 27-data-table; tests/csv.test.ts | Media: falta montar tabela ligada a API paginada e validar teclado |
| WebSocket atualiza lista | 07, 08, 18 | Evento validado invalida query; resubscreve rooms; para em logout | 18-websockets; tests/socket.test.ts | Media: eventos de negocio e rooms dependem do contrato do servidor |
| Rever PR de seguranca/performance | 17, 20, 22, 28, 31 | Achados com evidencia e severidade; nao executar pentest implicitamente | 31-code-review; 28-security-verification | Media: testar PR com falhas conhecidas e controlos seguros |
| Pipeline CI/CD | 15, 17, 24, 25, 28, 32 | Build imutavel, gates, E2E remoto, aprovacao e rollback | 32-ci-cd:29, secao deploy staging | Media: scripts de deploy e plataforma nao fornecidos; validar num projeto consumidor |
| Pagina acessivel PT/EN | 06, 09, 12, 23, 26 | Teclado, foco, semantica, traducoes e consentimento | 23-accessibility; tests/focus.test.tsx | Media: jsdom nao substitui browser, axe, contraste e leitor de ecra |

## Verificacoes executadas

- bash scripts/lint-corpus.sh: codigo 0. Saida:
  "35 modules: metadata, links and generated artifacts valid". Nenhuma falha reportada.
- npm run validate: codigo 0. Corpus, TypeScript estrito, 25 testes em seis ficheiros
  e build Vite da fixture passaram.
- npm audit --audit-level=high: codigo 0, "found 0 vulnerabilities".
  Resultado apenas das dependencias instaladas nesta revisao.
- git diff --check: codigo 0, sem problemas de whitespace.
- Empacotamento em diretorio novo, recursos e recusa de sobrescrita: testes passaram.
- Casos negativos: YAML duplicado/nome invalido/metadata invalida, recurso ausente,
  modulo desconhecido, master divergente e regressao critica de XSS rejeitados.
- Nao executado: CI remoto, Playwright com backend, smoke dos IDEs, benchmark de
  modelos, leitor de ecra, pentest ou deploy.

## VS Code e distribuicao

Nao tratar .agent/skills e .github/copilot-instructions.md como mecanismos identicos.
Seguir USAGE_GUIDE.md e a documentacao oficial nele ligada para os caminhos
suportados por cada ferramenta/versao. O pacote modular inclui recursos;
copiar apenas SKILL.md ou apenas o master perde referencias executaveis.

O core gerado usa links relativos ao destino .github/copilot-instructions.md
com skills em .github/skills. Outro layout exige ajuste de links.
O master completo e referencia opcional; nao e o carregamento global recomendado.
As instrucoes Markdown nao instalam extensoes, escolhem modelos ou iniciam
subagentes por si mesmas.

Carregar o core sempre; consultar 00/20 no enquadramento, 01/03 para dominio,
09/23 para UI, 14 para contratos, 08 para auth e 33 quando houver delegacao.
Nao carregar todos os modulos em todas as tarefas.

## Plano restante por fases

1. **Alta: fechar corpus executavel.** Fixture CRUD/tabela/query e exemplos de
   formularios completos; extracao de snippets; contratos comuns e i18n verificadas.
2. **Alta: integracao real.** Backend sintetico e Playwright para sessao, troca de
   conta, cookies, sockets, consentimento e fluxos CRUD; testes negativos de seguranca.
3. **Media: homologar ferramentas.** Instalacoes isoladas de Copilot e Antigravity,
   versoes registadas, descoberta dos 35 modulos e onze cenarios repetidos.
4. **Media: provar economia.** Comparacao baseline/delegacao, sem degradacao dos
   criterios essenciais; custo total e variacao documentados.
5. **Baixa: ampliar templates.** Registo/recuperacao/OAuth apenas com contratos reais.

So mudar o veredito para pronto quando os criterios essenciais forem inequivocos,
os exemplos tiverem validacao correspondente e as lacunas acima estiverem fechadas.
