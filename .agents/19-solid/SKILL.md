---
name: 19-solid
description: >
  Princípios SOLID aplicados às camadas Page → Hook → Transporter.
  Use when: SOLID, responsabilidade única, refactor, composição.
metadata:
  stack: "react-web"
  scope: "architecture"
  requires: "[]"
  related: "[01-architecture, 03-domain-structure, 06-patterns, 08-auth, 12-loading-states, 14-types, 16-tests]"
  last-verified: "2026-07-25"
---
# SOLID Principles — Aplicado a React (Page → Hook → Transporter)

## Objetivo

Garantir que a arquitetura definida em `01-architecture` (Pages → Hooks → Transporters → Backend API) se mantém limpa, escalável, testável e fácil de manter através da aplicação rigorosa dos princípios SOLID às camadas reais deste sistema — **não a um backend Python/FastAPI**. Este módulo é 100% frontend, consistente com o resto do sistema.

## 1. Single Responsibility Principle (SRP)

> *Um módulo deve ter apenas uma razão para mudar.*

| Camada | Responsabilidade única |
|--------|------------------------|
| **Pages** | Renderizar, compor componentes, ler hooks. Nunca lógica de negócio nem HTTP. |
| **Hooks** | Estado, side effects, chamar 1 transporter. `1 hook = 1 operação` (já é regra em `03-domain-structure`). |
| **Transporters** | HTTP + validar a forma da resposta (Zod, ver `06-patterns`). Nunca lógica de negócio. |
| **Components** | UI reutilizável e sem estado de negócio. |

```typescript
// ❌ Viola SRP — o hook decide navegação E mostra toast (não é "estado do domínio")
export const useCreateUser = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: usersTransporter.create,
    onSuccess: () => {
      addToast({ type: 'success', message: 'Criado!' });
      navigate('/users');
    },
  });
};

// ✅ Cumpre SRP — o hook só trata do estado da mutation; navegação/toast ficam na Page
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersTransporter.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
};
```

## 2. Open-Closed Principle (OCP)

> *Aberto para extensão, fechado para modificação.*

- Estender comportamento via **props/composição**, nunca via `if/else`/`switch` crescente dentro de um componente ou hook já existente.
- Um novo domínio (`03-domain-structure`) adiciona ficheiros novos (`useCreateContact.ts`, `contactsTransporter.ts`) — nunca modifica os hooks/transporters de `users` para "também servir" contacts.

```typescript
// ❌ Viola OCP — cada novo tipo de notificação exige editar esta função
const notify = (type: string, msg: string) => {
  if (type === 'email') sendEmail(msg);
  else if (type === 'sms') sendSms(msg);
  else if (type === 'push') sendPush(msg);
};

// ✅ Cumpre OCP — novo canal = nova implementação, sem tocar nas existentes
interface NotificationChannel { send: (msg: string) => Promise<void>; }
const channels: Record<string, NotificationChannel> = { email, sms, push };
const notify = (type: string, msg: string) => {
  const channel = channels[type];
  if (!channel) throw new Error('Unknown notification channel');
  return channel.send(msg);
};
```

- No UI, o `Button` de `06-patterns` já segue OCP: novas variantes (`variant="primary" | "secondary" | "danger"`) estendem o componente via prop, sem criar `PrimaryButton`/`DangerButton` duplicados.

## 3. Liskov Substitution Principle (LSP)

> *Uma implementação deve poder substituir outra da mesma família sem quebrar quem a usa.*

- Todos os hooks `useGet{Domain}s` devolvem o mesmo "contrato" (`data`, `isLoading`, `error`, `refetch`) porque envolvem `useQuery` — um componente de lista (`UsersList`, `ContactsList`) pode assumir sempre essa forma, seja qual for o domínio.
- Componentes de formulário que partilham a mesma interface de props (`label`, `error`, `...rest`) — `Input`, `Select`, `Textarea` — devem poder ser trocados dentro de um `<UserForm>` sem alterar a lógica do formulário.

```typescript
// Contrato comum que qualquer useGet{Domain} deve respeitar
interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
// UsersList e ContactsList podem partilhar o mesmo componente de loading/error/empty
// (ver 12-loading-states) precisamente porque o contrato é consistente entre domínios.
```

## 4. Interface Segregation Principle (ISP)

> *Várias interfaces pequenas e coesas são melhores que uma interface geral.*

- Types por domínio em ficheiros separados (`user.types.ts`, `contact.types.ts` — ver `14-types`), nunca um `types/index.ts` com um único type gigante que mistura tudo.
- Props de componentes segregadas: um `Modal` genérico não deve receber props específicas de `ConfirmDialog` (`onConfirm`, `confirmLabel`) — essas ficam no componente que compõe o `Modal`, não no `Modal` em si.

```typescript
// ❌ Viola ISP — força todo o consumidor de Modal a conhecer props de confirmação
interface ModalProps {
  isOpen: boolean; onClose: () => void;
  onConfirm?: () => void; confirmLabel?: string; isDangerous?: boolean; // só usado por 1 caso
}

// ✅ Cumpre ISP — Modal fica genérico; ConfirmDialog compõe Modal e adiciona o que é seu
interface ModalProps { isOpen: boolean; onClose: () => void; children: ReactNode; }
interface ConfirmDialogProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; message: string; }
const ConfirmDialog = (props: ConfirmDialogProps) => <Modal isOpen={props.isOpen} onClose={props.onClose}>...</Modal>;
```

## 5. Dependency Inversion Principle (DIP)

> *Módulos de alto nível não devem depender de módulos de baixo nível — ambos dependem de abstrações.*

- **Hooks dependem da assinatura do Transporter (a abstração), nunca do `axios` diretamente.** É isto que torna o mock em `16-tests` possível (`vi.mock('@/services/transporters/users', ...)`) — se o hook chamasse `axios.get` diretamente, o mock teria de intercetar a rede em vez do módulo.

```typescript
// ✅ Hook depende da abstração "usersTransporter", não de axios
export const useGetUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => usersTransporter.getAll(filters), // abstração
  });
};

// Em teste (16-tests), a abstração é trocada por um mock sem tocar no hook:
vi.mock('@/services/transporters/users', () => ({
  usersTransporter: { getAll: vi.fn() },
}));
```

- O mesmo vale para o `AuthContext` (`08-auth`): o `login()` do contexto depende de `authTransporter.login`, não de `axios.post('/auth/login')` embutido no componente.

## Checklist SOLID por camada

```
□ Pages nunca chamam axios/transporter diretamente (sempre via Hook) — SRP + DIP
□ Hooks fazem 1 operação cada, sem lógica de UI (toast/navigate) misturada — SRP
□ Novo domínio = novos ficheiros, nunca editar hooks/transporters de outro domínio — OCP
□ Hooks da mesma família (useGet*, useCreate*) devolvem sempre o mesmo formato — LSP
□ Types e props segregados por domínio/componente, sem "interfaces gigantes" — ISP
□ Hooks importam o Transporter (abstração), nunca axios diretamente — DIP
```
