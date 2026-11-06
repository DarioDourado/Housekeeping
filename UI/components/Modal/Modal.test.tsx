import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { i18n } from '@/lang/i18n.config';
import { Modal } from './Modal';

const setup = (props: Partial<React.ComponentProps<typeof Modal>> = {}) => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(
    <>
      <button>abrir</button>
      <Modal title="Título" onClose={onClose} {...props}><input aria-label="campo" /></Modal>
    </>
  );
  return { onClose, user };
};

beforeEach(async () => {
  await i18n.changeLanguage('pt');
});

describe('Modal', () => {
  it('should name the dialog from a level-2 heading', () => {
    setup();
    const heading = screen.getByRole('heading', { level: 2, name: 'Título' });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('should close on Escape', async () => {
    const { onClose, user } = setup();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close when the backdrop is clicked by default', async () => {
    const { onClose, user } = setup();
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should ignore backdrop clicks when dismissOnBackdrop is false', async () => {
    const { onClose, user } = setup({ dismissOnBackdrop: false });
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should still close through the close button when the backdrop is locked', async () => {
    const { onClose, user } = setup({ dismissOnBackdrop: false });
    await user.click(screen.getByRole('button', { name: i18n.t('actions.close') }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
