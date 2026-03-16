import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CartItem from 'modules/cart/components/CartItem';
import { CartItemGetDetailsVm } from 'modules/cart/models/CartItemGetVm';
import { PromotionVerifyResult } from 'modules/promotion/model/Promotion';

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => <a href={JSON.stringify(href)}>{children}</a>;
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

const mockItem: CartItemGetDetailsVm = {
  productId: 1,
  productName: 'Test Product',
  thumbnailUrl: 'http://example.com/image.jpg',
  quantity: 2,
  price: 100,
};

const defaultProps = {
  item: mockItem,
  isLoading: false,
  isSelected: false,
  handleSelectCartItemChange: jest.fn(),
  handleDecreaseQuantity: jest.fn(),
  handleIncreaseQuantity: jest.fn(),
  handleCartItemQuantityOnBlur: jest.fn(),
  handleCartItemQuantityKeyDown: jest.fn(),
  handleOpenDeleteConfirmationModal: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CartItem rendering', () => {
  it('renders product name', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders product image', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    const img = screen.getByAltText('Test Product');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'http://example.com/image.jpg');
  });

  it('renders checkbox checked when isSelected is true', () => {
    render(<table><tbody><CartItem {...defaultProps} isSelected={true} /></tbody></table>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders checkbox unchecked when isSelected is false', () => {
    render(<table><tbody><CartItem {...defaultProps} isSelected={false} /></tbody></table>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders quantity input with default value', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    const input = screen.getByTitle('Qty');
    expect(input).toHaveValue(2);
  });

  it('disables buttons when isLoading is true', () => {
    render(<table><tbody><CartItem {...defaultProps} isLoading={true} /></tbody></table>);
    const minusBtn = screen.getByText('-');
    const plusBtn = screen.getByText('+');
    expect(minusBtn).toBeDisabled();
    expect(plusBtn).toBeDisabled();
  });
});

describe('CartItem interactions', () => {
  it('calls handleSelectCartItemChange when checkbox changes', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(defaultProps.handleSelectCartItemChange).toHaveBeenCalledWith(1);
  });

  it('calls handleDecreaseQuantity on minus click', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    fireEvent.click(screen.getByText('-'));
    expect(defaultProps.handleDecreaseQuantity).toHaveBeenCalledWith(1);
  });

  it('calls handleIncreaseQuantity on plus click', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    fireEvent.click(screen.getByText('+'));
    expect(defaultProps.handleIncreaseQuantity).toHaveBeenCalledWith(1);
  });

  it('calls handleOpenDeleteConfirmationModal on remove click', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    const removeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(removeBtn);
    expect(defaultProps.handleOpenDeleteConfirmationModal).toHaveBeenCalledWith(1);
  });
});

describe('calculateProductPrice (via CartItem total cell)', () => {
  it('shows base price when no promotion', () => {
    render(<table><tbody><CartItem {...defaultProps} /></tbody></table>);
    // price=100, qty=2, no discount => $200.00
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  it('calculates PERCENTAGE discount correctly', () => {
    const promotion: PromotionVerifyResult = {
      productId: 1,
      discountType: 'PERCENTAGE',
      discountValue: 10,
    };
    render(
      <table>
        <tbody>
          <CartItem {...defaultProps} promotionApply={promotion} />
        </tbody>
      </table>
    );
    // price=100, qty=2, 10% => discount=20, total=$180.00
    expect(screen.getByText('$180.00')).toBeInTheDocument();
  });

  it('calculates fixed discount correctly', () => {
    const promotion: PromotionVerifyResult = {
      productId: 1,
      discountType: 'FIXED',
      discountValue: 30,
    };
    render(
      <table>
        <tbody>
          <CartItem {...defaultProps} promotionApply={promotion} />
        </tbody>
      </table>
    );
    // price=100, qty=2, fixed=30 => total=$170.00
    expect(screen.getByText('$170.00')).toBeInTheDocument();
  });

  it('shows strikethrough original price when promotion applies to this product', () => {
    const promotion: PromotionVerifyResult = {
      productId: 1,
      discountType: 'PERCENTAGE',
      discountValue: 20,
    };
    render(
      <table>
        <tbody>
          <CartItem {...defaultProps} promotionApply={promotion} />
        </tbody>
      </table>
    );
    // Original price shown with line-through
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('does not show strikethrough when promotion is for different product', () => {
    const promotion: PromotionVerifyResult = {
      productId: 999,
      discountType: 'PERCENTAGE',
      discountValue: 20,
    };
    const { container } = render(
      <table>
        <tbody>
          <CartItem {...defaultProps} promotionApply={promotion} />
        </tbody>
      </table>
    );
    const lineThroughEl = container.querySelector('[style*="line-through"]');
    expect(lineThroughEl).not.toBeInTheDocument();
  });
});
