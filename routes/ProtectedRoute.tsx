import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import { useAuth } from '@/hooks/auth/useAuth';
import { PageLoading } from '@/UI/components/feedback/PageStates';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  return <Outlet />;
};
