import React from 'react';
import { render, screen } from '@testing-library/react';
import SimilarProductCard from 'common/components/SimilarProductCard';
import ProductCardBase from 'common/components/ProductCardBase';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('../../../common/components/ImageWithFallback', () => {
  const Mock = ({ src, alt }: any) => <img src={src} alt={alt} />;
  Mock.displayName = 'ImageWithFallBack';
  return Mock;
});

jest.mock('../../../utils/formatPrice', () => ({
  formatPrice: (price: number) => `$${price.toFixed(2)}`,
}));

jest.mock('clsx', () => (...args: any[]) => args.flat().filter(Boolean).join(' '));

const mockProduct = {
  id: 1,
  name: 'Cool Laptop',
  slug: 'cool-laptop',
  price: 999,
};

describe('ProductCardBase', () => {
  it('renders product name', () => {
    render(<ProductCardBase product={mockProduct} thumbnailUrl="/img.jpg" />);
    expect(screen.getByText('Cool Laptop')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    render(<ProductCardBase product={mockProduct} thumbnailUrl="/img.jpg" />);
    expect(screen.getByText('$999.00')).toBeInTheDocument();
  });

  it('links to the product slug', () => {
    render(<ProductCardBase product={mockProduct} thumbnailUrl="/img.jpg" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/cool-laptop');
  });

  it('renders the thumbnail image', () => {
    render(<ProductCardBase product={mockProduct} thumbnailUrl="/thumb.jpg" />);
    expect(screen.getByAltText('Cool Laptop')).toHaveAttribute('src', '/thumb.jpg');
  });

  it('renders delivery text', () => {
    render(<ProductCardBase product={mockProduct} thumbnailUrl="/img.jpg" />);
    expect(screen.getByText(/Fast delivery/i)).toBeInTheDocument();
  });
});

describe('SimilarProductCard', () => {
  it('renders the product via ProductCardBase', () => {
    render(
      <SimilarProductCard product={mockProduct} thumbnailUrl="/similar-thumb.jpg" />
    );
    expect(screen.getByText('Cool Laptop')).toBeInTheDocument();
    expect(screen.getByAltText('Cool Laptop')).toHaveAttribute('src', '/similar-thumb.jpg');
  });

  it('uses empty string when thumbnailUrl is not provided', () => {
    render(<SimilarProductCard product={mockProduct} />);
    expect(screen.getByAltText('Cool Laptop')).toHaveAttribute('src', '');
  });
});
