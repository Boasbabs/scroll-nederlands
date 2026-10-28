import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Icon } from '../../src/ui/components/Icon';
import { BOLD, FILL } from '../../src/ui/components/phosphor';
import { PanelApp } from '../../src/ui/panel/PanelApp';
import { setupLearning, silentSpeaker } from './harness';

/** The glyph an element draws: its first path. */
const drawn = (element: Element | undefined) => element?.querySelector('path')?.getAttribute('d');

describe('Icon', () => {
  it('draws the bold weight, and the fill weight only when asked and only where there is one', () => {
    const { container } = render(
      <>
        <Icon name="home" />
        <Icon name="home" filled />
        <Icon name="gear" filled />
      </>,
    );
    const [resting, selected, gear] = container.querySelectorAll('svg');
    expect(drawn(resting)).toBe(BOLD.home);
    expect(drawn(selected)).toBe(FILL.home);
    expect(drawn(gear)).toBe(BOLD.gear);
  });

  it('stays out of the accessibility tree unless it has a title', () => {
    const { container } = render(
      <>
        <Icon name="flame" />
        <Icon name="turtle" title="Slow" />
      </>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('img', { name: 'Slow' })).toBeInTheDocument();
  });
});

describe('side panel tab bar', () => {
  it('fills the selected tab’s glyph and moves the fill with the selection', async () => {
    const user = userEvent.setup();
    const setup = setupLearning();
    await setup.store.updatePreferences({ onboarded: true });
    render(<PanelApp deps={{ learning: setup.learning, course: setup.course, speaker: silentSpeaker(), now: setup.now }} />);

    const today = await screen.findByRole('button', { name: 'Today' });
    const course = screen.getByRole('button', { name: 'Course' });
    expect(today).toHaveAttribute('aria-current', 'page');
    expect(drawn(today)).toBe(FILL.home);
    expect(drawn(course)).toBe(BOLD.book);

    await user.click(course);
    expect(course).toHaveAttribute('aria-current', 'page');
    expect(drawn(course)).toBe(FILL.book);
    expect(drawn(today)).toBe(BOLD.home);
  });
});
