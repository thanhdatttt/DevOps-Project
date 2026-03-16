import React from 'react';
import { render } from '@testing-library/react';
import SpinnerComponent from 'common/components/SpinnerComponent';

jest.mock('@react-spring/web', () => ({
  animated: {
    div: ({ children, style, className }: any) => (
      <div style={style} className={className}>
        {children}
      </div>
    ),
  },
  useSpring: () => ({ transform: 'rotate(0deg)' }),
}));

describe('SpinnerComponent', () => {
  it('renders the spinner container', () => {
    const { container } = render(<SpinnerComponent show={true} />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('spinner is visible when show is true', () => {
    const { container } = render(<SpinnerComponent show={true} />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).not.toHaveAttribute('hidden');
  });

  it('spinner is hidden when show is false', () => {
    const { container } = render(<SpinnerComponent show={false} />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toHaveAttribute('hidden');
  });

  it('renders the animated spinner icon inside', () => {
    const { container } = render(<SpinnerComponent show={true} />);
    const icon = container.querySelector('.spinner-icon');
    expect(icon).toBeInTheDocument();
  });
});
