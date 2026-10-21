# React Enterprise Modular v2

Sistema de instrucoes React SPA, distribuido como skills independentes.
O indice completo e gerado em [MODULES.md](MODULES.md), com todos os modulos incluindo
seguranca, orquestracao e o exemplo de referencia.

## Utilizacao

Ler [USAGE_GUIDE.md](USAGE_GUIDE.md). Preferir [react-core.md](react-core.md) como
instrucoes globais curtas e carregar skills por tarefa. [react-master.md](react-master.md)
e uma referencia completa gerada; nao e o contexto recomendado para todos os pedidos.

A politica de [orquestracao](33-orchestration/SKILL.md) usa maior capacidade nas decisoes
incertas e modelos economicos em implementacoes delimitadas, quando a ferramenta suporta.
A poupanca depende do custo total medido, incluindo revisao e retrabalho.

## Desenvolvimento e verificacao

Node >=22.18. Instalar dependencias com npm ci.
- npm run generate: regenera catalogo, core e master.
- npm run validate: metadados, referencias, sincronizacao, TypeScript, testes e build.
- node scripts/corpus.mjs package /caminho/novo/skills: prepara uma distribuicao sem sobrescrever destino.

O codigo de autenticacao e WebSocket tem referencias compilaveis nos respetivos modulos.
Os templates e exemplos sao verificados conforme a cobertura documentada dos testes;
nao assumir que todo o snippet explicativo e uma aplicacao completa.

## Estado de validacao

Auditorias AUDITORIA-*.md sao registos historicos e nao certificam esta revisao.
Os testes locais nao provam descoberta nem qualidade de geracao no IDE.
Executar o protocolo em [tests/evaluations](tests/evaluations/README.md) para medir
Copilot/Antigravity reais, baseline versus delegacao, antes de declarar poupanca ou
aprovar a distribuicao numa versao especifica da ferramenta.
