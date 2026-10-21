import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // - 30s evita refetch ao voltar de outro separador (22-performance)
      staleTime: 30_000,
      retry: 1,
    },
  },
});
