# Product

<!-- impeccable:product-schema 1 -->

> Estado: rascunho. Os factos vêm de `housekeeping-app.txt` (levantamento da reunião), do código e da indicação do utilizador de que a prova de conceito está concluída e aprovada e de que o trabalho passa agora para a versão real. Itens marcados **[a confirmar]** foram inferidos e não validados com o utilizador.

## Platform

web

## Users

- **Governanta / responsável de andares (perfil `admin`)**: planeia e distribui as task sheets, supervisiona, inspeciona e pede correções. Utilizadora principal da app web. Trabalha com o serviço da manhã e do turndown em simultâneo. **[a confirmar: dispositivos, desktop de escritório e/ou tablet]**
- **Empregada de andares (perfil `housekeeper`)**: consulta as tarefas atribuídas, inicia e conclui, comunica ocorrências. Hoje trabalha com folhas impressas e telemóvel de serviço; a página `/mobile` é um simulador.
- **Receção (perfil `reception`)**: recebe a informação de quartos prontos.
- **Direção**: acompanha produtividade e histórico (estatísticas ainda sem relatórios definidos).

## Product Purpose

Aplicação de Housekeeping do Vila Vita Parc que substitui folhas impressas, chamadas, comunicações informais e a aplicação anterior. Concentra quatro processos: planeamento, execução, supervisão e controlo (histórico). Sucesso: a equipa distribui o dia sem recomeçar do zero, vê todas as task sheets no mesmo ecrã, e a supervisão deixa de depender de telefone e deslocações.

## Positioning

O serviço diurno e o turndown são ciclos independentes que podem decorrer ao mesmo tempo, com quartos e pessoas partilhados, sem se interferirem. Era a falha principal da aplicação anterior e do Opera Cloud.

## Operating Context

- Sistema de origem: Opera Cloud (quartos, ocupação, reservas, hóspedes, estados). Integração via OHIP, com limitações de escrita; o mecanismo de sincronização não está decidido.
- Dia operacional fecha às 02h (nunca à meia-noite). Turndown executa 18:00–21:30 e prepara-se a partir das 14:30/15:30, com o serviço diurno ainda aberto.
- Propriedade com blocos A–D, Oasis Parc, Master Villas e zonas de apoio e estacionamento; cerca de 24 task sheets (valor de exemplo, não limite).
- Ambiente de hotel: luz variável, uso em movimento, informação densa.

## Capabilities and Constraints

- Predefinição de secções e quartos editável a longo prazo, distinta de ajustes só do dia.
- Distribuição por arrastar quartos e pessoas entre task sheets; não há algoritmo automático aprovado, a decisão é da equipa.
- Estado Opera é distinto do estado da tarefa. DND e recusa de serviço nunca contam como limpeza concluída. Turndown e refresh nunca escrevem no Opera.
- Interface em português (PT-PT) com inglês. Cores e ícones, e não só texto, para identificar trabalho e prioridade.
- Em aberto: tecnologia do cliente móvel (nativa, web ou PWA), definição de relatórios de estatísticas, tabela oficial de créditos (valores atuais ilustrativos).

## Brand Commitments

- Vila Vita Parc: azul turquesa `#00A9C5` como cor principal; preto apenas quando a cor não for possível (`Theme.txt`).
- O logótipo não leva gradientes, contornos, sombras ou brilhos, e não pode ser colocado sobre fotografias ou fundos poluídos.
- Linguagem visual combinada com a convenção Apple (HIG), conforme `Theme.txt`.

## Evidence on Hand

- `housekeeping-app.txt`: levantamento funcional com cenários de validação CT-01 a CT-20.
- Protótipo executável aprovado, com dados simulados em `config/hotelData.ts`. Não há dados reais, métricas de uso nem testes com utilizadores; não inventar.

## Product Principles

1. **O trabalho decide o desenho.** Informação densa e visível de uma vez (todas as sheets no mesmo ecrã) vale mais que ecrãs limpos com navegação extra.
2. **Dois ciclos, nunca misturados.** Dia e turndown são visualmente e funcionalmente separados e nenhuma ação num afeta o outro.
3. **O estado nunca mente.** Estado Opera, estado da tarefa e resultado (DND, recusa, correção) distinguem-se claramente; nada parece concluído sem o estar.
4. **Legível em serviço.** Contraste e alvos de toque pensados para luz forte e uso com pressa; a cor nunca é o único sinal.
5. **Histórico completo.** Cada ação regista quem, quando e em que dispositivo.

## Accessibility & Inclusion

Cumprir WCAG 2.2 AA (norma por omissão do projeto, em `.agents/23-accessibility`): contraste de texto 4.5:1 e de UI 3:1, foco visível, navegação por teclado, skip link, hierarquia de headings, respeito por `prefers-reduced-motion`, idioma da página correto.
