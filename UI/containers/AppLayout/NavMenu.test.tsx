import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { i18n } from '@/lang/i18n.config';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { localServer } from '@/services/local-api/server';
import { NavMenu } from './NavMenu';

const SESSION_KEY = 'vvp_hk_session_v2';

const setup = () => {
  localStorage.setItem(SESSION_KEY, 'user-dario');
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter><NavMenu /></MemoryRouter>
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

describe('NavMenu', () => {
  it('should start collapsed with the toggle announcing its state', async () => {
    setup();
    const toggle = await screen.findByRole('button', { name: i18n.t('nav.menu') });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: i18n.t('nav.turndownDistribution') })).toBeNull();
  });

  it('should list every main page when opened', async () => {
    const user = setup();
    await user.click(await screen.findByRole('button', { name: i18n.t('nav.menu') }));
    for (const key of ['morningDistribution', 'turndownDistribution', 'realtimeOverview', 'timeAudit']) {
      expect(screen.getByRole('link', { name: i18n.t(`nav.${key}`) })).toBeInTheDocument();
    }
  });

  it('should close on Escape and return focus to the toggle', async () => {
    const user = setup();
    const toggle = await screen.findByRole('button', { name: i18n.t('nav.menu') });
    await user.click(toggle);
    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('should close after choosing a page', async () => {
    const user = setup();
    const toggle = await screen.findByRole('button', { name: i18n.t('nav.menu') });
    await user.click(toggle);
    await user.click(screen.getByRole('link', { name: i18n.t('nav.timeAudit') }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
