import React from 'react';
import { render, screen } from '@testing-library/react';
import Banner from 'common/items/Banner';

describe('Banner', () => {
  it('renders the title in an h2', () => {
    render(<Banner title="My Shop" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('My Shop');
  });

  it('renders title in span as well', () => {
    render(<Banner title="Electronics" />);
    const spans = screen.getAllByText('Electronics');
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });

  it('renders a link back to home', () => {
    render(<Banner title="Test" />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
  });

  it('renders the banner-section element', () => {
    const { container } = render(<Banner title="Sale" />);
    expect(container.querySelector('.banner-section')).toBeInTheDocument();
  });
});
