import { useEffect, useRef } from 'react';

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;
    const previous = document.activeElement;
    const candidates = () => Array.from(container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]',
    )).filter((element) => element.tabIndex >= 0 && !element.matches(':disabled')
      && !element.closest('[hidden], [inert], [aria-hidden="true"]')
      && getComputedStyle(element).display !== 'none'
      && getComputedStyle(element).visibility !== 'hidden');
    const focusFirst = () => (candidates()[0] ?? container).focus();
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const elements = candidates();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) { event.preventDefault(); container.focus(); return; }
      if (!elements.includes(document.activeElement as HTMLElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    focusFirst();
    container.addEventListener('keydown', handleTab);
    return () => {
      container.removeEventListener('keydown', handleTab);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [active]);
  return ref;
}
