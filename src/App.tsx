import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import { ErrorBoundary } from '@/UI/components/feedback/ErrorBoundary';
import { ErrorFallback } from '@/UI/components/feedback/ErrorFallback';

export const App = () => (
  <ErrorBoundary fallback={reset => <ErrorFallback onReset={reset} />}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
