// The resolve hook `pnpm audio:generate` runs under: Node's type stripping loading the app's own imports.
import { spawnSync } from 'node:child_process';

/** Runs a module snippet under the hook from the repository root (where Vitest runs). */
function underHook(code: string) {
  const args = ['--no-warnings', '--import', './scripts/ts-resolve.mjs', '--experimental-strip-types', '--input-type=module', '-e', code];
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}

describe('the resolve hook for the scripts', () => {
  it('loads a folder by its index.ts, and a file without its extension', () => {
    const run = underHook(`
      const { wordThemes } = await import('./src/words/content');
      const { placeWords } = await import('./src/words/assemble');
      console.log(JSON.stringify({ themes: wordThemes.length, placeWords: typeof placeWords }));
    `);
    expect(run.stderr).toBe('');
    const loaded = JSON.parse(run.stdout) as { themes: number; placeWords: string };
    expect(loaded.themes).toBeGreaterThan(0);
    expect(loaded.placeWords).toBe('function');
  });

  it('still fails with Node’s own error, naming the import, for a module that does not exist', () => {
    const run = underHook(`
      try {
        await import('./src/nowhere');
      } catch (error) {
        console.log(JSON.stringify({ code: error.code, message: error.message }));
      }
    `);
    const failure = JSON.parse(run.stdout) as { code: string; message: string };
    expect(failure.code).toBe('ERR_MODULE_NOT_FOUND');
    expect(failure.message).toContain('src/nowhere');
    expect(failure.message).not.toContain('index.ts');
  });
});
