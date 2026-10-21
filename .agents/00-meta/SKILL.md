---
name: 00-meta
description: Orienta a instalacao, precedencia de regras e selecao de modulos React enterprise. Usar no arranque de projeto ou para escolher skills.
metadata:
  stack: react-web
  scope: architecture
---
# React Enterprise Modular v2

Catalogo completo: [MODULES.md](../MODULES.md).
Contexto por projeto: [template](../CONTEXT-PROMPT-TEMPLATE.md).

## Comecar

Ler [arquitetura](../01-architecture/SKILL.md), [dominio](../03-domain-structure/SKILL.md)
e [regras](../20-rules/SKILL.md). Para delegacao ou escolha de capacidade ler
[orquestracao](../33-orchestration/SKILL.md). Os outros modulos carregam por tarefa.

Aplicar instrucoes explicitas do utilizador e convencoes do projeto. As regras
especializadas aplicam-se ao seu ambito; referencias antigas nao prevalecem sobre
o contrato atual. Conflitos materiais exigem resolucao antes de implementar.
Exemplos didaticos nao substituem o contrato real de backend.

## Distribuicao e contexto

Cada pasta numerada e uma skill independente com name igual a pasta.
Copilot: .github/skills ou .agents/skills. Antigravity: .agents/skills
(.agent/skills por compatibilidade). Confirmar descoberta na versao instalada.
O master e referencia, nao contexto global obrigatorio. Usar core curto e
referencias por necessidade. Metadados personalizados nao executam dependencias.

## Eficiencia

O modelo de maior capacidade resolve incerteza, arquitetura e revisao de risco.
O executor economico recebe tarefas delimitadas e criterios de aceitacao; pode
escalar conflitos. Tarefas simples nao precisam de orquestracao.
Selecao real dos modelos depende da ferramenta; medir custo total e qualidade
antes de concluir que delegacao poupa. Nao enviar o master a cada executor.

## Provas

Testes locais validam apenas os comportamentos exercitados. Uma data num ficheiro
nao prova compilacao, seguranca ou conformidade legal. Registar revisao, ambiente,
comandos e limitacoes. Os relatorios AUDITORIA-* anteriores sao historicos.
