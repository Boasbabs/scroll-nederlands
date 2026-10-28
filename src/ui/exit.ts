// Exits, with Lasseter's slow in: a sheet, dialog, menu or toast that leaves plays its exit animation
// (motion.css, `[data-leaving]`) before it unmounts. With no animation to wait for (tests load no CSS)
// it goes at once.
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export function useExit<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [then, setThen] = useState<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (!then) return undefined;
    const node = ref.current;
    const finish = () => {
      setThen(null);
      then();
    };
    const name = node ? getComputedStyle(node).animationName : '';
    if (!node || !name || name === 'none') {
      finish();
      return undefined;
    }
    const onEnd = (event: Event) => {
      if (event.target === node) finish();
    };
    node.addEventListener('animationend', onEnd);
    // A tab in the background may never finish the animation: go anyway.
    const timer = setTimeout(finish, 600);
    return () => {
      node.removeEventListener('animationend', onEnd);
      clearTimeout(timer);
    };
  }, [then]);

  /** Plays the exit, then runs `next`, which unmounts the part. A second call while leaving is ignored. */
  const leave = useCallback((next: () => void) => setThen((current) => current ?? next), []);
  return { ref, leaving: then !== null, leave };
}
