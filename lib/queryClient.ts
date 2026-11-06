import { QueryClient } from '@tanstack/react-query';

// - "Tempo real" por polling (contrato §7, decisão 1): todos os ecrãs voltam ao servidor a cada N segundos.
//   Ajusta-se em .env (VITE_POLL_INTERVAL_SECONDS) sem mexer no código; 30 s por omissão.
const pollSeconds = Number(import.meta.env.VITE_POLL_INTERVAL_SECONDS);
export const POLL_INTERVAL_MS = (Number.isFinite(pollSeconds) && pollSeconds >= 5 ? pollSeconds : 30) * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: POLL_INTERVAL_MS,
      // - igual ao intervalo: dados com menos de N s não se pedem outra vez ao mudar de separador (22-performance)
      staleTime: POLL_INTERVAL_MS,
      retry: 1,
    },
  },
});
