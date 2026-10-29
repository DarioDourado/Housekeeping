# React Enterprise: instrucoes essenciais

Aplicar ao desenvolvimento React web SPA. Ler o contexto do projeto e as convencoes
existentes antes de mudar arquitetura. SSR/Next.js e React Native requerem adapters
especificos e nao estao validados por esta distribuicao.

## Contrato de trabalho

- Preservar alteracoes existentes e o ambito pedido. Auditar nao autoriza corrigir ou publicar.
- Perfil por omissao: src/hooks, services/transporters, types, UI/components, UI/containers e pages.
  Usar features/shared apenas quando o projeto escolher explicitamente esse mapeamento.
- Pages compoem UI e hooks; hooks coordenam dados; transporters fazem HTTP e validam respostas.
- TypeScript strict, noUncheckedIndexedAccess e exactOptionalPropertyTypes. Nao suprimir erros para concluir.
- Dados remotos em TanStack Query; estado local na UI. Chaves incluem filtros e contexto de sessao adequado.
- Validar respostas e inputs nas fronteiras. Validacao no browser e UX; autorizacao pertence ao servidor.
- Access token em memoria, refresh cookie HttpOnly/Secure. Limpar cache privada ao terminar/trocar sessao.
- Todos os textos de UI via i18n; tratar loading, erro, vazio e sucesso; teclado, labels e foco verificaveis.
- Operacoes destrutivas de UI exigem confirmacao. Nao carregar analytics antes do consentimento; respeitar revogacao.
- Named exports para codigo de aplicacao; default permitido quando o framework/configuracao o exige.
- Confirmar conclusao com testes proporcionais. Distinguir testes executados, analise documental e limitacoes.

## Orquestracao e custo

- Tarefas ambiguas, arquitetura, seguranca e concorrencia: maior capacidade de raciocinio.
- Implementacao delimitada com interfaces e testes definidos: modelo economico quando disponivel.
- Tarefas simples podem ser resolvidas diretamente; nao impor varios agentes a cada alteracao.
- Delegar objetivo, ficheiros permitidos, decisoes, recursos necessarios e criterios de aceitacao.
- Executor escala incerteza material; orquestrador integra e revê conforme risco.
- Carregar apenas skills relevantes. Nao enviar o master nem o historico inteiro em cada delegacao.
- Modelos e subagentes dependem da ferramenta. Nao afirmar que um ficheiro Markdown os seleciona.
- Medir custo total com revisao/retrabalho, tokens, tempo e qualidade; nao presumir poupanca.

Consultar 00-meta e 20-rules para enquadramento, 01/03 para camadas e dominio,
33-orchestration ao delegar. Para UI ler 23-accessibility e 09-i18n;
para contratos ler 14-types; para auth ler 08-auth; restantes skills por tarefa.
O catalogo abaixo identifica recursos, nao implica carregar todos.

## Catalogo sob pedido

Caminhos relativos a .github/copilot-instructions.md na distribuicao Copilot.

- [00-meta](skills/00-meta/SKILL.md)
- [01-architecture](skills/01-architecture/SKILL.md)
- [02-folder-structure](skills/02-folder-structure/SKILL.md)
- [03-domain-structure](skills/03-domain-structure/SKILL.md)
- [04-stack](skills/04-stack/SKILL.md)
- [05-conventions](skills/05-conventions/SKILL.md)
- [06-patterns](skills/06-patterns/SKILL.md)
- [07-react-query](skills/07-react-query/SKILL.md)
- [08-auth](skills/08-auth/SKILL.md)
- [09-i18n](skills/09-i18n/SKILL.md)
- [10-forms](skills/10-forms/SKILL.md)
- [11-error-handling](skills/11-error-handling/SKILL.md)
- [12-loading-states](skills/12-loading-states/SKILL.md)
- [13-routes](skills/13-routes/SKILL.md)
- [14-types](skills/14-types/SKILL.md)
- [15-env](skills/15-env/SKILL.md)
- [16-tests](skills/16-tests/SKILL.md)
- [17-security](skills/17-security/SKILL.md)
- [18-websockets](skills/18-websockets/SKILL.md)
- [19-solid](skills/19-solid/SKILL.md)
- [20-rules](skills/20-rules/SKILL.md)
- [21-react-auth-page](skills/21-react-auth-page/SKILL.md)
- [22-performance](skills/22-performance/SKILL.md)
- [23-accessibility](skills/23-accessibility/SKILL.md)
- [24-ci-quality](skills/24-ci-quality/SKILL.md)
- [25-e2e](skills/25-e2e/SKILL.md)
- [26-privacy](skills/26-privacy/SKILL.md)
- [27-data-table](skills/27-data-table/SKILL.md)
- [28-security-verification](skills/28-security-verification/SKILL.md)
- [29-pentest](skills/29-pentest/SKILL.md)
- [30-simplify](skills/30-simplify/SKILL.md)
- [31-code-review](skills/31-code-review/SKILL.md)
- [32-ci-cd](skills/32-ci-cd/SKILL.md)
- [33-orchestration](skills/33-orchestration/SKILL.md)
- [99-example](skills/99-example/SKILL.md)
