import { createContext, useCallback, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from '@/UI/components/feedback/ConfirmDialog';

export type ConfirmOptions = Pick<ConfirmDialogProps, 'title' | 'message' | 'confirmLabel' | 'cancelLabel' | 'isDangerous'>;
export type AskConfirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<AskConfirm | null>(null);

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const ask = useCallback<AskConfirm>(
    (options) => new Promise<boolean>((resolve) => setPending({ options, resolve })),
    [],
  );

  const settle = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {pending && (
        <ConfirmDialog
          isOpen
          {...pending.options}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
};
