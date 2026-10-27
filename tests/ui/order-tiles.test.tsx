import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { OrderExercise } from '../../src/curriculum/types';
import { checkAnswer } from '../../src/engine/answers';
import { ExerciseView } from '../../src/ui/ExerciseView';
import { createTestEnv, renderWithEnv } from '../fixtures/env';

const exercise: OrderExercise = {
  id: 'order',
  stage: 'supportedRecall',
  kind: 'order',
  prompt: 'Build the sentence.',
  words: ['Vandaag', 'werk', 'ik', 'thuis.'],
  alternatives: [['Ik', 'werk', 'vandaag', 'thuis.']],
  english: 'Today I work from home.',
  explanation: 'The verb comes second.',
};

it('word tiles give no capital-letter or punctuation hints, and the answer reads naturally', async () => {
  const user = userEvent.setup();
  const { env } = createTestEnv();
  const onAnswer = vi.fn(async (response: string | Array<string>) => checkAnswer(exercise, response));
  renderWithEnv(<ExerciseView exercise={exercise} seed="t" onAnswer={onAnswer} onContinue={vi.fn()} />, env);

  const bank = screen.getByLabelText('Word tiles');
  const labels = [...bank.querySelectorAll('button')].map((b) => b.textContent);
  expect(labels.sort()).toEqual(['ik', 'thuis', 'vandaag', 'werk']);

  for (const word of ['vandaag', 'werk', 'ik', 'thuis']) await user.click(screen.getByRole('button', { name: word }));
  expect(screen.getByLabelText('Your sentence').textContent).toBe('Vandaagwerkikthuis.');
  await user.click(screen.getByRole('button', { name: 'Check' }));
  expect(await screen.findByText('Correct!')).toBeInTheDocument();
});
