import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ─── AppContext ───────────────────────────────────────────────────────────────
jest.mock('modules/cart/services/CartService', () => ({
  getNumberCartItems: jest.fn().mockResolvedValue(0),
}));
jest.mock('modules/profile/services/ProfileService', () => ({
  getMyProfile: jest.fn().mockResolvedValue({ firstName: '', lastName: '', email: '' }),
}));

import { AppProvider, useAppContext } from 'context/AppContext';

describe('AppContext', () => {
  it('AppProvider renders children', () => {
    render(
      <AppProvider>
        <span data-testid="child">hello</span>
      </AppProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('useAppContext exposes cart and user info merged', () => {
    const Consumer = () => {
      const ctx = useAppContext();
      return (
        <div>
          <span data-testid="cart">{ctx.numberCartItems}</span>
          <span data-testid="email">{ctx.email}</span>
        </div>
      );
    };
    render(
      <AppProvider>
        <Consumer />
      </AppProvider>
    );
    expect(screen.getByTestId('cart')).toHaveTextContent('0');
    expect(screen.getByTestId('email')).toHaveTextContent('');
  });
});

// ─── Input ───────────────────────────────────────────────────────────────────
import { Input } from 'common/items/Input';
import { useForm } from 'react-hook-form';

const InputWrapper = ({
  required = false,
  error,
  disabled = false,
}: {
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) => {
  const { register } = useForm<{ testField: string }>();
  return (
    <Input
      labelText="Test Label"
      field="testField"
      register={register}
      registerOptions={required ? { required: true } : {}}
      error={error}
      disabled={disabled}
      placeholder="Enter value"
    />
  );
};

describe('Input component', () => {
  it('renders label text', () => {
    render(<InputWrapper />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders placeholder', () => {
    render(<InputWrapper />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('shows required asterisk when required option set', () => {
    render(<InputWrapper required={true} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    render(<InputWrapper required={false} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<InputWrapper error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies border-danger class on error', () => {
    render(<InputWrapper error="Error!" />);
    const input = screen.getByPlaceholderText('Enter value');
    expect(input).toHaveClass('border-danger');
  });

  it('disables input when disabled prop is true', () => {
    render(<InputWrapper disabled={true} />);
    expect(screen.getByPlaceholderText('Enter value')).toBeDisabled();
  });
});

// ─── OptionSelect ─────────────────────────────────────────────────────────────
import { OptionSelect } from 'common/items/OptionSelect';

const OptionSelectWrapper = ({
  required = false,
  error,
  disabled = false,
  options = [
    { id: '1', name: 'Option A' },
    { id: '2', name: 'Option B' },
  ],
}: {
  required?: boolean;
  error?: string;
  disabled?: boolean;
  options?: { id: string; name: string }[];
}) => {
  const { register } = useForm<{ mySelect: string }>();
  return (
    <OptionSelect
      labelText="Choose One"
      field="mySelect"
      register={register}
      registerOptions={required ? { required: true } : {}}
      error={error}
      options={options}
      disabled={disabled}
      placeholder="Pick an option"
    />
  );
};

describe('OptionSelect component', () => {
  it('renders label text', () => {
    render(<OptionSelectWrapper />);
    expect(screen.getByText('Choose One')).toBeInTheDocument();
  });

  it('renders placeholder option', () => {
    render(<OptionSelectWrapper />);
    expect(screen.getByText('Pick an option')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<OptionSelectWrapper />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<OptionSelectWrapper required={true} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error text', () => {
    render(<OptionSelectWrapper error="Please select" />);
    expect(screen.getByText('Please select')).toBeInTheDocument();
  });

  it('applies border-danger class on error', () => {
    render(<OptionSelectWrapper error="Required!" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-danger');
  });

  it('disables select when disabled prop is true', () => {
    render(<OptionSelectWrapper disabled={true} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders with empty options list', () => {
    render(<OptionSelectWrapper options={[]} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

// ─── ProductItems ─────────────────────────────────────────────────────────────
jest.mock('common/components/ProductCard', () => {
  const Mock = ({ product }: any) => <div data-testid="product-card">{product.name}</div>;
  Mock.displayName = 'ProductCard';
  return Mock;
});

import ProductItems from 'common/items/ProductItems';
import { ProductThumbnail } from 'modules/catalog/models/ProductThumbnail';

const mockProducts: ProductThumbnail[] = [
  { id: 1, name: 'Laptop Pro', slug: 'laptop-pro', price: 1200, thumbnailUrl: '/img1.jpg' },
  { id: 2, name: 'Phone X', slug: 'phone-x', price: 800, thumbnailUrl: '/img2.jpg' },
];

describe('ProductItems component', () => {
  it('renders a ProductCard for each product', () => {
    render(<ProductItems products={mockProducts} />);
    const cards = screen.getAllByTestId('product-card');
    expect(cards).toHaveLength(2);
  });

  it('shows product names', () => {
    render(<ProductItems products={mockProducts} />);
    expect(screen.getByText('Laptop Pro')).toBeInTheDocument();
    expect(screen.getByText('Phone X')).toBeInTheDocument();
  });

  it('renders nothing when products array is empty', () => {
    const { container } = render(<ProductItems products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ─── UserProfileLeftSideBar ──────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-icons/cg', () => ({
  CgProfile: () => <svg data-testid="icon-profile" />,
}));
jest.mock('react-icons/ti', () => ({
  TiContacts: () => <svg data-testid="icon-contacts" />,
}));

import UserProfileLeftSideBar from 'common/components/UserProfileLeftSideBar';

describe('UserProfileLeftSideBar', () => {
  beforeEach(() => mockPush.mockClear());

  it('renders User Profile and Address links', () => {
    render(<UserProfileLeftSideBar type="profile" />);
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
  });

  it('highlights profile item when type is profile', () => {
    const { container } = render(<UserProfileLeftSideBar type="profile" />);
    const profileDiv = container.querySelectorAll('.left-menu-element')[0];
    expect(profileDiv).toHaveStyle({ background: '#eeeeee' });
  });

  it('highlights address item when type is address', () => {
    const { container } = render(<UserProfileLeftSideBar type="address" />);
    const addressDiv = container.querySelectorAll('.left-menu-element')[1];
    expect(addressDiv).toHaveStyle({ background: '#eeeeee' });
  });

  it('navigates to /profile on profile click', () => {
    render(<UserProfileLeftSideBar type="address" />);
    fireEvent.click(screen.getByText('User Profile'));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('navigates to /address on address click', () => {
    render(<UserProfileLeftSideBar type="profile" />);
    fireEvent.click(screen.getByText('Address'));
    expect(mockPush).toHaveBeenCalledWith('/address');
  });
});
