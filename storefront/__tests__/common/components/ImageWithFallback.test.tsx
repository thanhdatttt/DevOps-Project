import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ImageWithFallBack from 'common/components/ImageWithFallback';

jest.mock('react-bootstrap', () => ({
  Image: ({ src, alt, onError, width, height, style, className }: any) => (
    <img
      src={src}
      alt={alt}
      onError={onError}
      width={width}
      height={height}
      style={style}
      className={className}
    />
  ),
}));

jest.mock('clsx', () => (...args: any[]) => args.filter(Boolean).join(' '));

describe('ImageWithFallBack', () => {
  it('renders with given src and alt', () => {
    render(<ImageWithFallBack src="http://example.com/photo.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'http://example.com/photo.jpg');
  });

  it('uses default dimensions when not provided', () => {
    render(<ImageWithFallBack src="/img.jpg" alt="photo" />);
    const img = screen.getByAltText('photo');
    expect(img).toHaveAttribute('width', '500');
    expect(img).toHaveAttribute('height', '500');
  });

  it('uses custom dimensions when provided', () => {
    render(<ImageWithFallBack src="/img.jpg" alt="photo" width={100} height={80} />);
    const img = screen.getByAltText('photo');
    expect(img).toHaveAttribute('width', '100');
    expect(img).toHaveAttribute('height', '80');
  });

  it('falls back to default fallback image on error', () => {
    render(<ImageWithFallBack src="/broken.jpg" alt="broken" />);
    const img = screen.getByAltText('broken');

    act(() => {
      fireEvent.error(img);
    });

    expect(img).toHaveAttribute('src', '/static/images/default-fallback-image.png');
  });

  it('falls back to custom fallback image on error', () => {
    render(
      <ImageWithFallBack src="/broken.jpg" alt="broken" fallBack="/custom-fallback.png" />
    );
    const img = screen.getByAltText('broken');

    act(() => {
      fireEvent.error(img);
    });

    expect(img).toHaveAttribute('src', '/custom-fallback.png');
  });

  it('resets fallback when src prop changes', () => {
    const { rerender } = render(<ImageWithFallBack src="/img1.jpg" alt="photo" />);
    const img = screen.getByAltText('photo');

    act(() => {
      fireEvent.error(img);
    });
    expect(img).toHaveAttribute('src', '/static/images/default-fallback-image.png');

    act(() => {
      rerender(<ImageWithFallBack src="/img2.jpg" alt="photo" />);
    });
    expect(img).toHaveAttribute('src', '/img2.jpg');
  });

  it('applies className', () => {
    render(<ImageWithFallBack src="/img.jpg" alt="photo" className="custom-class" />);
    const img = screen.getByAltText('photo');
    expect(img).toHaveClass('custom-class');
  });
});
