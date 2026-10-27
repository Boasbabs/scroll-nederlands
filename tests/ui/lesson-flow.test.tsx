import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Lesson } from '../../src/curriculum/types';
import { RELEARN_DELAY_MS } from '../../src/engine/schedule';
import { LessonFlow, ReviewFlow } from '../../src/ui/LessonFlow';
import { createTestEnv, renderWithEnv } from '../fixtures/env';

const NOW = Date.UTC(2026, 0, 5, 9);

const lesson: Lesson = {
  id: 's1-food-ik-wil-graag',
  moduleId: 's1-food',
  stageId: 's1',
  level: 'a1',
  kind: 'core',
  title: "I'd like …",
  objective: 'Order a drink politely.',
  situation: 'At a café counter.',
  targetPhrase: 'Ik wil graag een koffie.',
  meaningEn: "I'd like a coffee.",
  wordBreakdown: [{ dutch: 'graag', english: 'gladly' }],
  examples: [{ dutch: 'Ik wil graag water.', english: "I'd like water." }],
  skills: ['reading'],
  covers: ['ordering'],
  exercises: [
    { id: 'rec', stage: 'recognition', kind: 'choice', prompt: 'What does it mean?', options: ["I'd like a coffee.", 'I have a coffee.'], answer: "I'd like a coffee.", explanation: 'wil graag = would like' },
    { id: 'cloze', stage: 'supportedRecall', kind: 'cloze', prompt: 'Complete it.', sentence: 'Ik wil ___ een koffie.', answers: ['graag'], hint: 'g____', explanation: 'graag makes it polite' },
    { id: 'type', stage: 'independentRecall', kind: 'type', prompt: 'Order a coffee.', answers: ['Ik wil graag een koffie.'], explanation: 'Ik wil graag + item' },
    { id: 'transfer', stage: 'transfer', kind: 'type', prompt: 'Ask to pay.', answers: ['Ik wil graag betalen.'], explanation: 'same pattern' },
  ],
};

const done = { label: 'Done', onClick: vi.fn() };

describe('lesson flow', () => {
  it('teaches, practises, gives feedback and saves progress', async () => {
    const user = userEvent.setup();
    const { env, store } = createTestEnv({ now: () => NOW });
    renderWithEnv(<LessonFlow lesson={lesson} mode="focused" primary={done} />, env);

    // 1. Learn: Dutch, meaning, audio.
    expect(screen.getByText('Ik wil graag een koffie.')).toBeInTheDocument();
    expect(screen.getByText("I'd like a coffee.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play Dutch audio' }));
    expect(env.speaker.speak).toHaveBeenCalledWith('Ik wil graag een koffie.', expect.anything());

    // 2. Recognition exercise; the answer is not revealed before attempting.
    await user.click(screen.getByRole('button', { name: 'Practise it' }));
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    expect(screen.queryByText(/Correct answer/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /I'd like a coffee/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // 3. Supported recall (focused mode): a wrong answer gets corrective feedback and a retry.
    await user.type(screen.getByRole('textbox', { name: 'Missing word' }), 'graak');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByText(/Almost/)).toBeInTheDocument();
    expect(screen.getByText(/graag makes it polite/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.type(screen.getByRole('textbox', { name: 'Missing word' }), 'graag{Enter}');
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // 4. Completion screen; the retry did not overwrite the first (wrong) attempt.
    expect(await screen.findByText('Lesson complete!')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    const progress = await store.getProgress();
    expect(progress.completedLessons[lesson.id]).toBe(NOW);
    expect(progress.items[lesson.id]).toMatchObject({ correctCount: 1, incorrectCount: 1, level: 'introduced', dueAt: NOW + RELEARN_DELAY_MS });
  });

  it('micro mode keeps the lesson short: learn card and one recognition question', async () => {
    const user = userEvent.setup();
    const { env } = createTestEnv({ now: () => NOW });
    renderWithEnv(<LessonFlow lesson={lesson} mode="micro" primary={done} />, env);
    await user.click(screen.getByRole('button', { name: 'Practise it' }));
    await user.keyboard('1');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Lesson complete!')).toBeInTheDocument();
  });

  it('a review asks at the item level and records the result', async () => {
    const user = userEvent.setup();
    const { env, store } = createTestEnv({ now: () => NOW });
    const item = { lessonId: lesson.id, level: 'supportedRecall' as const, step: 2, dueAt: NOW - 1, introducedAt: NOW - 1e9, lastAttemptAt: null, correctCount: 2, incorrectCount: 0, history: [] };
    await store.updateProgress((p) => ({ ...p, items: { [lesson.id]: item }, completedLessons: { [lesson.id]: NOW - 1e9 } }));
    const onDone = vi.fn();
    renderWithEnv(<ReviewFlow lesson={lesson} exercise={lesson.exercises[2]!} item={item} mode="micro" onDone={onDone} />, env);
    expect(screen.queryByText('Ik wil graag een koffie.')).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'ik wil graag een koffie{Enter}');
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ correct: true })));
    expect((await store.getProgress()).items[lesson.id]?.level).toBe('independentRecall');
  });
});
