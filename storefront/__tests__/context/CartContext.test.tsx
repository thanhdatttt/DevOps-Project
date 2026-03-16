import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { CartProvider, useCartContext } from 'context/CartContext';
import * as CartService from 'modules/cart/services/CartService';

jest.mock('modules/cart/services/CartService');
const mockGetNumberCartItems = CartService.getNumberCartItems as jest.MockedFunction<
  typeof CartService.getNumberCartItems
>;

const TestConsumer = () => {
  const { numberCartItems, fetchNumberCartItems } = useCartContext();
  return (
    <div>
      <span data-testid="count">{numberCartItems}</span>
      <button onClick={fetchNumberCartItems}>Refresh</button>
    </div>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CartContext', () => {
  it('provides default numberCartItems as 0', async () => {
    mockGetNumberCartItems.mockResolvedValue(0);
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('fetches and displays cart item count on mount', async () => {
    mockGetNumberCartItems.mockResolvedValue(5);
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('5');
    });
  });

  it('updates count when fetchNumberCartItems is called', async () => {
    mockGetNumberCartItems.mockResolvedValueOnce(3).mockResolvedValueOnce(8);
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));

    await act(async () => {
      screen.getByText('Refresh').click();
    });

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('8'));
  });

  it('handles fetch error gracefully without crashing', async () => {
    mockGetNumberCartItems.mockRejectedValue(new Error('Network error'));
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
  });
});

describe('useCartContext default context', () => {
  it('returns default values from context', () => {
    const TestDefault = () => {
      const { numberCartItems } = useCartContext();
      return <span data-testid="default-count">{numberCartItems}</span>;
    };
    render(<TestDefault />);
    expect(screen.getByTestId('default-count')).toHaveTextContent('0');
  });
});
