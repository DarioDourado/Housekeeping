---
name: 08-auth
description: >
  Autenticação segura: access token em memória, refresh via cookie httpOnly.
  Use when: login, logout, JWT, refresh token, sessão, autenticação.
metadata:
  stack: "react-web"
  scope: "security"
  requires: "[]"
  related: "[11-error-handling, 21-react-auth-page]"
  last-verified: "2026-10-25"
---
# Autenticacao e ciclo de sessao

Ler [regras](../20-rules/SKILL.md) e [tipos](../14-types/SKILL.md).
A implementacao de referencia e [auth-client.ts](references/auth-client.ts);
a integracao React e [AuthProvider.tsx](references/AuthProvider.tsx).
Estes ficheiros sao compilados e exercitados pela suite do repositorio.

## Contrato

- Access token so em memoria; refresh em cookie HttpOnly, Secure e SameSite adequado ao deployment.
- Backend valida sempre autorizacao e ownership; ProtectedRoute e apenas UX.
- POST /auth/login recebe email/password e devolve accessToken e user.
- POST /auth/session restaura a sessao via cookie e devolve a mesma forma.
- POST /auth/refresh devolve accessToken; POST /auth/logout revoga o refresh cookie.
- Respostas sao validadas com Zod. Adapta os schemas ao contrato real antes de integrar.
- CORS com credenciais exige origem exata, Authorization/Content-Type permitidos e OPTIONS sem autenticacao.
- Se precisares de ETag/If-Match, permitir If-Match e expor ETag em CORS.
- Endpoints autenticados por cookies precisam de defesa CSRF no backend, conforme origem e SameSite.
  Nao assumir que CORS, sozinho, impede envio de pedidos cross-site.

## Integracao

Criar uma instancia estavel fora do render. Injetar clearPrivateData que cancele
queries e limpe a cache privada e drafts. Exemplo com um QueryClient dedicado:
`clearPrivateData: () => { void queryClient.cancelQueries(); queryClient.clear(); }`.
Nao partilhar esse cliente com dados de outra conta. O AuthProvider recebe essa
instancia e fica dentro do router se a UI utilizar navegacao.

Login e restauracao usam o cliente de auth sem o interceptor de refresh:
401 em login nunca provoca uma tentativa de refresh.
Pedidos privados partilham um refresh em curso; respostas de uma geracao de
sessao anterior sao rejeitadas. A limpeza de sessao cancela pedidos e impede
refresh tardio de voltar a escrever credenciais. O single-flight e por instancia/tab;
rotacao entre tabs exige coordenacao ou tolerancia contratual do backend.

Logout limpa imediatamente o cliente. Se a revogacao remota falhar, mostrar erro
e permitir repetir: a limpeza local nao prova que o cookie foi revogado.
Aguardar a revogacao antes de iniciar outra autenticacao.
Ao expirar sessao, guardar apenas drafts permitidos antes da limpeza, se aplicavel,
e navegar a partir da UI. Nao acoplar o transporte a window.location.

Para sincronizar tabs, transmitir apenas sinais de login/logout por BroadcastChannel,
nunca tokens. Logout remoto chama clearSession; login remoto so restaura depois
de invalidar a sessao local. Limpar cache e drafts tambem no sinal remoto.
Aplicacoes que precisam dessa sincronizacao devem testar o adapter entre tabs.

## Validacao

A suite cobre refresh concorrente, 401 atrasado, resposta malformada, login invalido
e refresh em curso durante logout. Acrescentar testes de backend para cookies,
CSRF, revogacao, restauracao e coordenacao entre tabs antes de publicar.
