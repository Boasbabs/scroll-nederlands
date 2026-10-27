// Per-step wiring between the player and the step on screen.
import { createContext, useContext, useEffect, type MutableRefObject } from 'react';
import type { KeyHandlers } from '../hotkeys';

export type PlayerContextValue = {
  /** Keys the step on screen handles (digits for options, Backspace for tiles). */
  stepKeys: MutableRefObject<KeyHandlers>;
  /**
   * Whether a field may take focus now. Always in the side panel; in the
   * in-page card only right after the learner used the card, so it never
   * pulls focus away from the host page.
   */
  canTakeFocus: () => boolean;
};

export const PlayerContext = createContext<PlayerContextValue | null>(null);

function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('needs a SessionPlayer');
  return value;
}

export function useStepKeys(handlers: KeyHandlers): void {
  const { stepKeys } = usePlayer();
  useEffect(() => {
    stepKeys.current = handlers;
  });
  useEffect(
    () => () => {
      stepKeys.current = {};
    },
    [stepKeys],
  );
}

/** Focuses a field when the step appears, if focus may move (see canTakeFocus). */
export function useAutoFocus(element: MutableRefObject<HTMLElement | null>, when = true): void {
  const { canTakeFocus } = usePlayer();
  useEffect(() => {
    if (when && canTakeFocus()) element.current?.focus({ preventScroll: true });
  }, [when, canTakeFocus, element]);
}
