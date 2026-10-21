import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useFocusTrap } from '../23-accessibility/references/useFocusTrap';

function Dialog({ active }: { active: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  return <div ref={ref} role="dialog" tabIndex={-1}>
    <button disabled>Disabled</button><button hidden>Hidden</button>
    <button>First</button><button>Last</button>
  </div>;
}
afterEach(cleanup);
it('wraps keyboard focus, skips hidden/disabled controls and restores focus', () => {
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  const { unmount } = render(<Dialog active />);
  const first = screen.getByRole('button', { name: 'First' });
  const last = screen.getByRole('button', { name: 'Last' });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(document.activeElement).toBe(first);
  unmount();
  expect(document.activeElement).toBe(trigger);
  trigger.remove();
});
