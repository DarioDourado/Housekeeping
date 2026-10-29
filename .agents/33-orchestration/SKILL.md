---
name: 33-orchestration
description: Distribui tarefas delimitadas entre planeamento, implementacao e revisao, com contexto minimo e medicao do custo total. Usar ao delegar trabalho ou definir estrategia de modelos.
metadata:
  stack: react-web
  scope: orchestration
  last-verified: "2026-10-25"
---
# Orquestracao e eficiencia

Aplicar as [regras essenciais](../20-rules/SKILL.md). A capacidade e escolhida pela
incerteza e pelo risco da tarefa, nao apenas pelo numero de linhas a escrever.

## Encaminhamento

| Trabalho | Responsavel sugerido | Verificacao |
|---|---|---|
| Requisitos ambiguos, arquitetura, contratos transversais | Modelo de maior capacidade | Decisoes e criterios de aceitacao explicitos |
| Alteracao local com contrato fechado e testes claros | Modelo economico | Testes e revisao proporcional ao risco |
| Auth, seguranca, concorrencia, migracoes, varias camadas | Modelo capaz; partes mecanicas podem ser delegadas | Revisao de maior capacidade e testes das fronteiras |
| Alteracao trivial reversivel | Execucao direta | Verificacao curta, sem cadeia de agentes obrigatoria |

O orquestrador le primeiro o contexto necessario e decide o que ja esta resolvido.
Nao delegar uma tarefa vaga com a expectativa de que o executor redesenhe o sistema.
O executor tambem raciocina: verifica pressupostos, preserva convencoes e escala
incerteza material. Nao gerar codigo mecanicamente contra evidencias do projeto.

## Contrato de delegacao

Enviar apenas este pacote e as referencias pertinentes:

```text
Objetivo observavel:
Ficheiros permitidos e interfaces que devem permanecer estaveis:
Decisoes ja tomadas e contexto relevante:
Skills/recursos a consultar (caminhos exatos):
Criterios de aceitacao e comandos de verificacao:
Limites de autonomia e condicoes para escalar:
Entrega: ficheiros alterados, testes executados, resultados e incertezas.
```

Dividir escrita paralela por ficheiros disjuntos. O orquestrador integra e verifica
o resultado, incluindo divergencias do contrato. Nao reenviar historico inteiro,
master, logs extensos ou modulos sem relacao com a tarefa.

## Escalada e paragem

Escalar quando falta um contrato, uma dependencia nao existe, ha conflito entre
regras ou a correcao exige mudar arquitetura/escopo. Enviar o erro reproduzivel,
ficheiros afetados e alternativas. Depois de duas tentativas sem progresso no mesmo
erro, reavaliar com maior capacidade em vez de repetir o mesmo prompt.
Uma escalada nao autoriza novas operacoes externas nem alarga o pedido do utilizador.
Nao inventar resultados de testes ou autorizar merge/deploy a partir de uma revisao textual.

## Ferramenta e modelos

Os papeis nao selecionam modelos por si. Confirmar se a ferramenta instalada permite
subagentes e modelos por papel; configurar isso na ferramenta. Sem suporte, executar
as fases sequencialmente ou indicar a limitacao. Nao simular que houve delegacao.
Registar modelo/versao/configuracao reais; nao fixar nomes comerciais ou precos nesta skill.

## Avaliacao economica

Comparar baseline (um modelo) e estrategia delegada nos mesmos cenarios e revisao.
Registar tokens de entrada/saida/cache, custo observado, tempo, revisoes, falhas e
qualidade por criterio. O custo inclui orquestracao, executores, revisao e retrabalho.
Ausencia de medicao significa poupanca nao demonstrada. Menos euros nao significa
menos tokens. Usar os cenarios e formato em tests/evaluations no repositorio fonte.
