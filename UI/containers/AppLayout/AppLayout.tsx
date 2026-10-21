import { Outlet } from 'react-router-dom';
import { Overlays } from '@/UI/containers/Overlays';
import { ToastHost } from '@/UI/containers/ToastHost';
import { Navbar } from './Navbar';

export const AppLayout = () => (
  <div className="min-h-screen bg-canvas text-content">
    <Navbar />
    <main className="px-3 sm:px-4 lg:px-5 py-4">
      <Outlet />
    </main>
    <Overlays />
    <ToastHost />
  </div>
);
