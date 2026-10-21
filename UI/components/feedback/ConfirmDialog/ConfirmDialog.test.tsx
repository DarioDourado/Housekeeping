import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { useConfirm } from '@/hooks/common/useConfirm';

const labels = { title: 'Eliminar?', message: 'Sem volta.', confirmLabel: 'Eliminar', cancelLabel: 'Cancelar' };

function Trigger({ onResult }: { onResult: (confirmed: boolean) => void }) {
  const confirm = useConfirm();
  return <button onClick={async () => onResult(await confirm(labels))}>abrir</button>;
}

const setup = () => {
  const onResult = vi.fn();
  render(<ConfirmProvider><Trigger onResult={onResult} /></ConfirmProvider>);
  return { onResult, user: userEvent.setup() };
};

describe('ConfirmDialog', () => {
  it('só resolve true depois de o utilizador confirmar', async () => {
    const { onResult, user } = setup();
    await user.click(screen.getByText('abrir'));
    expect(onResult).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('Esc cancela e o foco inicial é o botão seguro (Cancelar)', async () => {
    const { onResult, user } = setup();
    await user.click(screen.getByText('abrir'));
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it('é um alertdialog modal com título e descrição associados', async () => {
    const { user } = setup();
    await user.click(screen.getByText('abrir'));
    const dialog = screen.getByRole('alertdialog', { name: 'Eliminar?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Sem volta.');
  });
});
