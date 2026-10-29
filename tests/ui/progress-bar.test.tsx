import { render } from '@testing-library/react';
import { ProgressBar } from '../../src/ui/components/ProgressBar';

describe('ProgressBar', () => {
  it('writes the count inside it as the text around it does', () => {
    const { container } = render(<ProgressBar value={8} max={1000} label="Core words met" count />);
    expect(container.querySelector('.tn-progress__count')).toHaveTextContent('8 / 1,000');
  });
});
