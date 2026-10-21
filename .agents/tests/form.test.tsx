import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthPage } from '../21-react-auth-page/references/AuthPage.template';

afterEach(cleanup);
it('validates required input before invoking login', async () => {
  const login = vi.fn();
  render(<AuthPage login={login} t={(key) => key} />);
  await userEvent.click(screen.getByRole('button', { name: 'auth.login' }));
  expect(login).not.toHaveBeenCalled();
  expect(await screen.findAllByRole('alert')).toHaveLength(2);
});

it('submits valid input and hides raw backend errors', async () => {
  const login = vi.fn().mockRejectedValue(new Error('secret backend details'));
  render(<AuthPage login={login} t={(key) => key} />);
  await userEvent.type(screen.getByLabelText('auth.email'), 'ada@example.com');
  await userEvent.type(screen.getByLabelText('auth.password'), 'secret');
  await userEvent.click(screen.getByRole('button', { name: 'auth.login' }));
  expect((await screen.findByRole('alert')).textContent).toBe('auth.failed');
  expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret' });
  expect(screen.queryByText('secret backend details')).toBeNull();
});
