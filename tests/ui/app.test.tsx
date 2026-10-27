import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { allLessons, curriculum } from '../../src/curriculum';
import { App } from '../../src/ui/panel/App';
import { createTestEnv, renderWithEnv } from '../fixtures/env';

describe('side panel app (real curriculum)', () => {
  it('starts a new learner on the first pre-A1 lesson', async () => {
    const user = userEvent.setup();
    const { env } = createTestEnv();
    renderWithEnv(<App />, env);
    await user.click(await screen.findByRole('button', { name: 'Start your first lesson' }));
    const first = allLessons[0]!;
    expect(first.level).toBe('pre-a1');
    expect(await screen.findByText(first.targetPhrase)).toBeInTheDocument();
    expect(screen.getByText(first.meaningEn)).toBeInTheDocument();
  });

  it('shows every stage and module on the roadmap, with later stages locked', async () => {
    const user = userEvent.setup();
    const { env } = createTestEnv();
    renderWithEnv(<App />, env);
    await user.click(await screen.findByRole('tab', { name: 'Roadmap' }));
    for (const stage of curriculum.stages) {
      const section = screen.getByRole('region', { name: stage.title });
      for (const module of stage.modules) expect(within(section).getByText(module.title)).toBeInTheDocument();
    }
    const stage1 = screen.getByRole('region', { name: curriculum.stages[1]!.title });
    await user.click(within(stage1).getByText(curriculum.stages[1]!.modules[0]!.title));
    const firstA1 = curriculum.stages[1]!.modules[0]!.lessons[0];
    if (firstA1) expect(within(stage1).getByRole('button', { name: firstA1.title })).toBeDisabled();
  });

  it('settings change preferences immediately', async () => {
    const user = userEvent.setup();
    const { env, store } = createTestEnv();
    renderWithEnv(<App />, env);
    await user.click(await screen.findByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('switch', { name: 'Quiet mode' }));
    expect((await store.getPreferences()).quietMode).toBe(true);
  });
});
