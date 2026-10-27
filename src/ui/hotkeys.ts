// Lesson keys: Enter checks or continues, 1–9 pick an option, Backspace
// removes the last tile, Esc closes or asks to quit, ? lists the keys.
import { useEffect, useRef, type RefObject } from 'react';

export type KeyHandlers = {
  enter?: () => void;
  digit?: (n: number) => void;
  backspace?: () => void;
  escape?: () => void;
  help?: () => void;
};

function isEditable(element: HTMLElement | null): boolean {
  return Boolean(element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable));
}

/** Option rows and tiles hand Enter to Check; every other button keeps its native Enter. */
function keepsNativeEnter(element: HTMLElement | null): boolean {
  return Boolean(element?.closest('button, a, summary') && !element.closest('.tn-option, .tn-tile'));
}

/**
 * With `scope`, keys count only while focus is inside it (the in-page card,
 * so host-page shortcuts and ours never mix). Without it they apply to the
 * whole page (the side panel).
 */
export function useHotkeys(handlers: KeyHandlers, scope?: RefObject<HTMLElement | null>): void {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const target: HTMLElement | Window | null = scope ? scope.current : window;
    if (!target) return undefined;
    function onKey(event: Event) {
      const key = event as KeyboardEvent;
      if (key.defaultPrevented || key.metaKey || key.ctrlKey || key.altKey || key.isComposing) return;
      const element = key.composedPath()[0] as HTMLElement | null;
      const h = latest.current;
      if (key.key === 'Enter' && !key.shiftKey) {
        if (!h.enter || keepsNativeEnter(element)) return;
        key.preventDefault();
        h.enter();
      } else if (key.key === 'Escape' && h.escape) {
        key.preventDefault();
        h.escape();
      } else if (isEditable(element)) {
        return;
      } else if (/^[1-9]$/.test(key.key) && h.digit) {
        key.preventDefault();
        h.digit(Number(key.key));
      } else if (key.key === 'Backspace' && h.backspace) {
        key.preventDefault();
        h.backspace();
      } else if (key.key === '?' && h.help) {
        key.preventDefault();
        h.help();
      }
    }
    target.addEventListener('keydown', onKey);
    return () => target.removeEventListener('keydown', onKey);
  }, [scope]);
}
