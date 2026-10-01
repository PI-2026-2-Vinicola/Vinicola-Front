import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../services/http';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      // Erros de permissão/validação não melhoram com novas tentativas; falhas de rede, sim.
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
    },
    mutations: { retry: false },
  },
});
