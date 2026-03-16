import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductImageGallery } from 'common/components/ProductImageGallery';

jest.mock('react-bootstrap', () => ({
  Figure: Object.assign(({ children, className }: any) => <div className={className}>{children}</div>, {
    Image: ({ src, alt }: any) => <img src={src} alt={alt} />,
  }),
}));

jest.mock('../../../common/components/ImageWithFallback', () => {
  const Mock = ({ src, alt, width, height }: any) => (
    <img src={src} alt={alt} width={width} height={height} />
  );
  Mock.displayName = 'ImageWithFallback';
  return Mock;
});

const images = [
  'http://example.com/img1.jpg',
  'http://example.com/img2.jpg',
  'http://example.com/img3.jpg',
  'http://example.com/img4.jpg',
];

describe('ProductImageGallery', () => {
  it('renders with no images without crashing', () => {
    const { container } = render(<ProductImageGallery listImages={[]} />);
    expect(container).toBeInTheDocument();
  });

  it('displays the first image as main image initially', () => {
    render(<ProductImageGallery listImages={images} />);
    const mainImages = screen.getAllByRole('img');
    expect(mainImages[0]).toHaveAttribute('src', images[0]);
  });

  it('next button is disabled when at last image', () => {
    render(<ProductImageGallery listImages={['only.jpg']} />);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[1];
    expect(nextBtn).toBeDisabled();
  });

  it('prev button is disabled at index 0', () => {
    render(<ProductImageGallery listImages={images} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('advances to next image when next button clicked', () => {
    render(<ProductImageGallery listImages={images} />);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[1];

    fireEvent.click(nextBtn);

    const allImgs = screen.getAllByRole('img');
    // Main image should now be img2
    expect(allImgs[0]).toHaveAttribute('src', images[1]);
  });

  it('goes back to previous image when prev button clicked', () => {
    render(<ProductImageGallery listImages={images} />);
    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[1]); // advance
    fireEvent.click(buttons[0]); // go back

    const allImgs = screen.getAllByRole('img');
    expect(allImgs[0]).toHaveAttribute('src', images[0]);
  });

  it('resets to index 0 when listImages prop changes', () => {
    const newImages = ['http://example.com/new1.jpg', 'http://example.com/new2.jpg'];
    const { rerender } = render(<ProductImageGallery listImages={images} />);

    // Advance index
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    rerender(<ProductImageGallery listImages={newImages} />);

    const allImgs = screen.getAllByRole('img');
    expect(allImgs[0]).toHaveAttribute('src', newImages[0]);
  });
});
