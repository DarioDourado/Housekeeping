import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen, title, message, confirmLabel, cancelLabel, isDangerous = true, onConfirm, onCancel,
}: ConfirmDialogProps) => {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl border border-transparent dark:border-line"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl font-semibold tracking-tight text-content mb-2">{title}</h2>
        <p id={messageId} className="text-sm text-muted mb-8">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-canvas dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-content px-6 py-3 text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={isDangerous
              ? 'rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 px-6 py-3 text-sm font-medium'
              : 'rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 text-sm font-medium'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
