import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { i18n } from '@/lang/i18n.config';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { routeObjects } from '@/routes';
import { localServer } from '@/services/local-api/server';

const SESSION_KEY = 'vvp_hk_session_v2';

const renderAt = (path: string) => {
  localStorage.setItem(SESSION_KEY, 'user-dario');
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ThemeProvider>
        <AuthProvider>
          <ConfirmProvider>
            <RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: [path] })} />
          </ConfirmProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
  return userEvent.setup();
};

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  localServer.reset();
});

describe('AppLayout', () => {
  it('should offer a skip link as the first focusable element, targeting the main landmark', async () => {
    const user = renderAt('/');
    const main = await screen.findByRole('main');
    await user.tab();
    const skip = screen.getByRole('link', { name: i18n.t('common.skipToContent') });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it.each(['/', '/turndown', '/live', '/audit', '/mobile'])('should expose exactly one h1 on %s', async path => {
    renderAt(path);
    expect(await screen.findAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
