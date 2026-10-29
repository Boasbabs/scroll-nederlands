// Restoring progress from a backup file, offered in Settings and on the first
// onboarding screen (a reinstall starts there): pick a file, check it, confirm, add it.
import { useRef, useState } from 'react';
import { isLessonDone } from '../../engine/selection';
import { SITE_IDS } from '../../sites';
import type { Backup, BackupCheck } from '../../storage/backup';
import type { LearnerPreferences } from '../../storage/store';
import { useEnv } from '../env';
import { formatDay, plural } from '../format';
import { ConfirmDialog } from './controls';

const PROBLEMS: Record<Extract<BackupCheck, { ok: false }>['problem'], string> = {
  'not-backup': 'That file isn’t a TaalNudge backup. Backup files start with “taalnudge-backup”.',
  newer: 'This backup is from a newer TaalNudge. Update the extension, then try again.',
};

/** What the confirmation says about a backup: which one it is, and what restoring it does. */
function describe(backup: Backup, prefs: LearnerPreferences, now: number): string {
  const { progress } = backup.records;
  const lessons = Object.keys(progress.lessons).filter((id) => isLessonDone(progress, id)).length;
  const done = lessons === 0 ? 'no lessons done yet' : `${plural(lessons, 'lesson')} done`;
  const which = backup.exportedAt === undefined ? `A backup with ${done}.` : `Saved ${formatDay(backup.exportedAt, now)}, with ${done}.`;
  // Chrome's site access is not in the file, so sites that were on stay off here.
  const sitesOff = SITE_IDS.some((id) => backup.records.prefs.sites[id] && !prefs.sites[id]);
  return [which, 'It’s added to your progress here, and your settings come back as they were.', sitesOff ? 'Prompts stay off until you turn your sites on again.' : '']
    .filter(Boolean)
    .join(' ');
}

/**
 * `pick` opens the file picker (call it from a click). A file that can't be
 * restored is reported through `onProblem`; `parts` (the hidden file input and
 * the confirmation) go anywhere in the screen, outside a coloured band.
 */
export function useRestore({ onProblem, onRestored }: { onProblem: (problem: string | undefined) => void; onRestored: () => void }) {
  const { backup, prefs, now } = useEnv();
  const input = useRef<HTMLInputElement>(null);
  const [found, setFound] = useState<Backup>();

  async function choose(file: File) {
    if (!backup) return;
    const check = await backup.check(file).catch(() => undefined);
    if (!check) onProblem('That file couldn’t be read.');
    else if (!check.ok) onProblem(PROBLEMS[check.problem]);
    else {
      onProblem(undefined);
      setFound(check.backup);
    }
  }

  function restore(chosen: Backup) {
    setFound(undefined);
    void backup?.restore(chosen).then(onRestored, () => onProblem('The backup couldn’t be restored.'));
  }

  const parts = backup ? (
    <>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Backup file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Cleared, so choosing the same file again still counts.
          event.target.value = '';
          if (file) void choose(file);
        }}
      />
      {found ? (
        <ConfirmDialog
          title="Restore this backup?"
          body={describe(found, prefs, now())}
          keep="Cancel"
          confirm="Restore"
          danger={false}
          onKeep={() => setFound(undefined)}
          onConfirm={() => restore(found)}
        />
      ) : null}
    </>
  ) : null;

  return { pick: () => input.current?.click(), parts };
}
