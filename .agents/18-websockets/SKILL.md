---
name: 18-websockets
description: >
  Cliente WebSocket com autenticação pós-handshake e reconexão com backoff.
  Use when: websocket, realtime, reconexão, autenticação de socket.
metadata:
  stack: "react-web"
  scope: "platform"
  requires: "[]"
  related: "[02-folder-structure, 07-react-query, 08-auth, 15-env, 20-rules]"
  last-verified: "2026-10-25"
---
# WebSocket ligado a sessao

Ler [auth](../08-auth/SKILL.md) e [query](../07-react-query/SKILL.md).
Usar [socket-client.ts](references/socket-client.ts) e
[SocketProvider.tsx](references/SocketProvider.tsx) como base testavel.

## Protocolo e ciclo de vida

- O provider so liga depois de restaurar a sessao. Mudanca de utilizador ou logout desliga.
- Token enviado na primeira mensagem, nunca na URL. Producao exige wss://.
- O servidor responde auth:ok ou auth:error. So emitir connected e permitir mensagens
  de negocio depois de auth:ok. Validar payloads por evento com schemas do projeto.
- Reconexao com backoff e jitter, maximo de tentativas. disconnect cancela timers,
  remove callbacks antigos e fecha a ligacao. Chamar connect novamente permite reinicio explicito.
- A autenticacao e reavaliada em cada ligacao. O backend deve definir como expira
  e revalida autorizacao durante sockets longos; auth:error exige recuperar a sessao
  ou apresentar erro, sem loop automatico ilimitado.

## Subscricoes e cache

Montar uma subscricao por evento, devolver o unsubscribe no cleanup do useEffect.
Eventos de alteracao invalidam a query correspondente. Usar tipos readonly:
`Record<string, ReadonlyArray<readonly unknown[]>>`.

Para rooms, registar um listener de connected que volta a enviar join-room apos
cada autenticacao/reconexao. Devolver cleanup que remove o listener e envia leave-room
se a ligacao estiver autenticada. Nao depender apenas da identidade do objeto socket.

Chat e cotacoes podem atualizar estado diretamente quando refetch por evento seria
excessivo; validar o payload, definir limites de memoria e reconciliacao apos reconnect.
Nao assumir que o generico TypeScript valida JSON recebido.

## Testes

A suite verifica cancelamento de reconexao, callbacks antigos, autenticacao antes de
mensagens e limite de tentativas. Testar tambem expiracao de sessao no servidor,
reentrada em rooms e recuperacao apos perda de eventos na aplicacao integrada.
React Native necessita de adapters de credenciais e ciclo de vida proprios;
esta referencia e React web e nao promete compatibilidade automatica.
