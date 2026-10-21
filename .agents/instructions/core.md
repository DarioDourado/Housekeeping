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
- Contrato FE-BE (FastAPI): alterar types, transporters ou config/constants.ts exige atualizar 34-backend-fastapi no mesmo trabalho.
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
