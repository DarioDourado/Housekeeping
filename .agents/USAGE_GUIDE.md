# Integracao e uso

O catalogo completo e [MODULES.md](MODULES.md). Os modulos sao skills independentes,
com name igual a pasta. Nao instalar uma pasta agregadora sem SKILL.md e assumir
que as ferramentas vao descobrir recursivamente todas as subpastas.

## GitHub Copilot no VS Code

O Copilot suporta skills em .github/skills/ e .agents/skills/.
Na raiz deste repositorio, executar npm ci e npm run validate.
Para um projeto cujo diretorio .github/skills ainda nao exista:

```sh
node scripts/corpus.mjs package /caminho/do/projeto/.github/skills
```

Colocar o conteudo de react-core.md em .github/copilot-instructions.md. Se ja existir
um ficheiro de instrucoes, integrar as regras em vez de o sobrescrever.
Os links do core assumem .github/skills. Para .agents/skills, ajustar esses links
para ../.agents/skills antes de usar. Nao instalar duas copias das mesmas skills.

Preencher [CONTEXT-PROMPT-TEMPLATE.md](CONTEXT-PROMPT-TEMPLATE.md) no projeto e
referencia-lo explicitamente nas instrucoes globais. No IDE, confirmar os nomes
descobertos e testar uma invocacao. O empacotador verifica estrutura, nao a ativacao do IDE.

## Antigravity

A documentacao atual usa .agents/skills/<skill>/ no projeto; .agent/skills continua
como compatibilidade. O diretorio global documentado e ~/.gemini/config/skills/.
Empacotar as skills diretamente no diretorio escolhido, sem nivel react-enterprise extra.
Destinos existentes exigem integracao controlada; o script recusa sobrescrever.

Configurar as regras essenciais no mecanismo de instrucoes globais da versao instalada.
Nao assumir que .github/copilot-instructions.md e carregado pelo Antigravity.

## Modelos e delegacao

Ler [33-orchestration](33-orchestration/SKILL.md).
Configurar papeis no IDE/agente: maior capacidade para arquitetura, incerteza e revisao
de risco; menor custo para implementacao com contrato fechado. Nao fixamos modelos
ou precos: variam por fornecedor, versao e disponibilidade.

Quando nao houver selecao de modelos/subagentes, executar as fases sequencialmente
e registar a limitacao. Markdown nao seleciona modelos automaticamente.
Nao duplicar analise nem reenviar master inteiro a cada executor.
Medir qualidade e custo total com [o protocolo](tests/evaluations/README.md).

## Manutencao e recursos

Editar os modulos e referencias, depois npm run generate e npm run validate.
Nao editar core/master/catalogo gerados. O core tem fonte em instructions/core.md.
Recursos de outras skills usam caminhos relativos entre pastas irmas; distribuir o
conjunto completo preserva essas dependencias sem carregar todo o conteudo no contexto.
Corpora backend externos nao fazem parte desta distribuicao: obter o contrato real
do projeto. Nao inventar ficheiros, endpoints ou testes alegadamente executados.

## Fontes de compatibilidade

- [VS Code: skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [VS Code: instrucoes](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [Antigravity: skills](https://antigravity.google/docs/skills)
- [Agent Skills: formato](https://agentskills.io/specification)

Consultadas em 2026-09-08. Confirmar novamente ao mudar versao do IDE.
