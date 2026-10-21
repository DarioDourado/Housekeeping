import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { i18n } from '@/lang/i18n.config';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { localServer } from '@/services/local-api/server';
import { routeObjects } from './index';

const SESSION_KEY = 'vvp_hk_session_v2';

const renderAt = (path: string, sessionUserId?: string) => {
  if (sessionUserId) localStorage.setItem(SESSION_KEY, sessionUserId);
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AuthProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
  return { router, user: userEvent.setup() };
};

const text = (key: string) => i18n.t(key);

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  localServer.reset();
});

describe('autenticação e rotas', () => {
  it('sem sessão, qualquer rota protegida vai para o login', async () => {
    const { router } = renderAt('/audit');
    expect(await screen.findByRole('heading', { name: text('login.title') })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('validação: campos vazios mostram os erros traduzidos e não entram', async () => {
    const { user } = renderAt('/login');
    await user.click(await screen.findByRole('button', { name: text('login.submit') }));
    expect(await screen.findByText(text('login.errors.emailRequired'))).toBeInTheDocument();
    expect(screen.getByText(text('login.errors.passwordMin'))).toBeInTheDocument();
  });

  it('utilizador desconhecido é recusado', async () => {
    const { user, router } = renderAt('/login');
    await user.type(await screen.findByLabelText(text('login.email')), 'ninguem@x.com');
    await user.type(screen.getByLabelText(text('login.password')), 'abcd');
    await user.click(screen.getByRole('button', { name: text('login.submit') }));
    expect(await screen.findByText(text('login.errors.invalidCredentials'))).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('login válido volta à página que se queria abrir', async () => {
    const { user, router } = renderAt('/audit');
    await user.type(await screen.findByLabelText(text('login.email')), 'dario@vilavitaparc.com');
    await user.type(screen.getByLabelText(text('login.password')), 'abcd');
    await user.click(screen.getByRole('button', { name: text('login.submit') }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/audit'));
  });

  it('terminar sessão leva de volta ao login', async () => {
    const { user, router } = renderAt('/', 'user-dario');
    await user.click(await screen.findByRole('button', { name: text('navbar.logout') }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

describe('permissões na configuração', () => {
  it('a empregada não vê a ligação nem a página', async () => {
    renderAt('/settings', 'user-maria');
    expect(await screen.findByText(text('settings.forbiddenTitle'))).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: text('nav.settings') })).toBeNull();
  });

  it('o administrador gere secções: adicionar e apagar com confirmação', async () => {
    const { user } = renderAt('/settings', 'user-dario');
    await user.type(await screen.findByLabelText(text('settings.sections.name'), { selector: 'input[value=""]' }), 'Secção Teste');
    await user.click(screen.getByRole('button', { name: text('settings.sections.add') }));
    const input = await screen.findByDisplayValue('Secção Teste');
    expect(input).toBeInTheDocument();

    const card = input.closest('li') as HTMLElement;
    await user.click(card.querySelector('button[aria-label]') as HTMLElement);
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: text('actions.delete') }));
    await waitFor(() => expect(screen.queryByDisplayValue('Secção Teste')).toBeNull());
  });
});

describe('execução no telemóvel', () => {
  it('a empregada inicia e termina o quarto; o estado Opera passa a Clean', async () => {
    const { user } = renderAt('/mobile', 'user-maria');
    const card = (await screen.findByText('102', { exact: true })).closest('[data-room]') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: text('room.start') }));
    await user.click(await within(card).findByRole('button', { name: text('room.finish') }));
    await waitFor(() => expect(localServer.query().rooms.find(room => room.number === '102')?.operaStatus).toBe('CLEAN'));
  });
});
