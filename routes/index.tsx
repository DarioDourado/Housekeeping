import { Suspense, lazy, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import { PageLoading } from '@/UI/components/feedback/PageStates';
import { AppLayout } from '@/UI/containers/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// - Páginas carregam sob procura (22-performance); cada pasta exporta o seu componente por nome
const PlanningPage = lazy(() => import('@/pages/Planning').then(m => ({ default: m.PlanningPage })));
const TurndownPage = lazy(() => import('@/pages/Turndown').then(m => ({ default: m.TurndownPage })));
const LivePage = lazy(() => import('@/pages/Live').then(m => ({ default: m.LivePage })));
const AuditPage = lazy(() => import('@/pages/Audit').then(m => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then(m => ({ default: m.SettingsPage })));
const MobilePage = lazy(() => import('@/pages/Mobile').then(m => ({ default: m.MobilePage })));
const LoginPage = lazy(() => import('@/pages/Login').then(m => ({ default: m.LoginPage })));

const page = (Page: ComponentType) => (
  <Suspense fallback={<PageLoading />}>
    <Page />
  </Suspense>
);

export const routeObjects: RouteObject[] = [
  { path: ROUTES.LOGIN, element: page(LoginPage) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.PLANNING, element: page(PlanningPage) },
          { path: ROUTES.TURNDOWN, element: page(TurndownPage) },
          { path: ROUTES.LIVE, element: page(LivePage) },
          { path: ROUTES.AUDIT, element: page(AuditPage) },
          { path: ROUTES.SETTINGS, element: page(SettingsPage) },
          { path: ROUTES.MOBILE, element: page(MobilePage) }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to={ROUTES.PLANNING} replace /> }
];

export const router = createBrowserRouter(routeObjects);
