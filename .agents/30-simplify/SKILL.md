---
name: 30-simplify
description: >
  Simplifica código e decisões com mentalidade YAGNI/ponytail: o melhor código é o que não foi
  escrito. Antes de escrever, desce a escada de simplificação (YAGNI → reutilizar → stdlib → nativo
  → dependência → uma linha → mínimo que funciona). Sem nunca cortar validação, segurança ou
  acessibilidade. Baseado no repo github.com/dietrichgebert/ponytail.
  Use when: simplificar, código mínimo, remover over-engineering, YAGNI, reutilizar em vez de
  recriar, menos código, simplificar componente, remove lines, simplify.
metadata:
  stack: "react-web"
  scope: "quality"
  requires: "[20-rules]"
  related: "[20-rules, 22-performance, 06-patterns]"
  last-verified: "2026-09-02"
---
# SIMPLIFY — Código Mínimo e Necessário (Ponytail)

> Filosofia: escrever apenas o que a tarefa exige. O código que nunca foi escrito não tem bugs,
> não tem CVEs, não precisa de manutenção. **Mas** lazy na solução, nunca na leitura: lê o código
> que o teu change toca e traça o fluxo real antes de escolher.

## A Escada (desce até ao primeiro degrau que segura)

Antes de escrever qualquer código, parar no primeiro degrau que funciona:

1. **Isto precisa de existir?** → Não: saltar (YAGNI).
2. **Já existe no codebase?** → Reutilizar, não reescrever.
3. **A stdlib faz isto?** → Usar.
4. **Funcionalidade nativa da plataforma?** → Usar.
5. **Dependência já instalada?** → Usar (não adicionar outra).
6. **Uma linha resolve?** → Uma linha.
7. **Só então:** o mínimo que funciona.

## Exemplos

### Date picker (over-build clássico)
```tsx
// ❌ Instalar flatpickr, wrapper, stylesheet, discussão de timezones...
// ✅ O browser já tem um
<input type="date" />
```

### Ordenar uma lista pequena
```tsx
// ❌ Criar um hook useSortedList com useMemo + opções de asc/desc + testes...
// ✅ Se a lista é pequena e local, ordena na hora
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
```

### Fetch de dados do servidor
```tsx
// ✅ O transporter segue o contrato comum: axios/interceptors, schema.parse e React Query.
// services/transporters/users/usersTransporter.ts
import api from '@/lib/axios';
import { userListSchema } from '@/types/users/user.schemas';

export const usersTransporter = {
  async list() {
    const { data } = await api.get('/users');
    return userListSchema.parse(data);
  },
};

// hooks/users/useGetUsers.ts
import { useQuery } from '@tanstack/react-query';

export function useGetUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersTransporter.list,
  });
}
```

Não substituir este fluxo por `fetch(...).then((r) => r.json())`: isso contorna o transporter,
os interceptors de autenticação, o parsing da resposta e o cache/invalidação de React Query. `fetch`
é adequado apenas para uma operação realmente fora do contrato da aplicação e deve manter as mesmas
garantias.

## O que NUNCA cortar (lazy, não negligente)

A escada reduz **código**, nunca **salvaguardas**. Estes ficam sempre:

- Validação de trust boundary (input do utilizador, resposta da API — ver `20-rules` ❌/✅ Zod).
- Tratamento de erros e data-loss (ver `11-error-handling`).
- Segurança (ver `17-security`; token só em memória, XSS, CORS).
- Acessibilidade (ver `23-accessibility`).
- Os 4 estados de UI (loading/error/empty/success — ver `12-loading-states`).

> A linha "o browser já tem um" **não** se aplica a segurança. `<input type="date">` é simples porque
> o browser garante. Nunca trocar segurança/a11y por menos linhas.

## Regras

| Regra | Razão |
|---|---|
| Descer a escada antes de escrever | Força o mínimo necessário |
| Ler o código envolvente antes | Lazy na solução, não na leitura |
| Reutilizar antes de reescrever | Menos código, menos bugs |
| Nunca cortar validação/erros/segurança/a11y | Reduzir linhas ≠ reduzir garantias |
| 1 hook = 1 ficheiro continua a valer | `20-rules` — simplificar não é amontoar |
| Nome legível > comentário extenso | Alinha com `05-conventions` §Comentários |
