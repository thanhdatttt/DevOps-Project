import React from 'react';
import { render, screen } from '@testing-library/react';
import AddressCard from 'modules/address/components/AddressCard';
import { Address } from 'modules/address/models/AddressModel';

const mockAddress: Address = {
  id: 1,
  contactName: 'Jane Smith',
  phone: '0987654321',
  addressLine1: '456 Oak Avenue',
  city: 'Springfield',
  districtId: 10,
  districtName: 'Central District',
  stateOrProvinceId: 20,
  stateOrProvinceName: 'California',
  countryId: 1,
  countryName: 'United States',
  zipCode: '12345',
};

describe('AddressCard', () => {
  it('renders contact name', () => {
    render(<AddressCard address={mockAddress} isSelected={false} />);
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it('renders phone number', () => {
    render(<AddressCard address={mockAddress} isSelected={false} />);
    expect(screen.getByText(/0987654321/i)).toBeInTheDocument();
  });

  it('renders address line', () => {
    render(<AddressCard address={mockAddress} isSelected={false} />);
    expect(screen.getByText(/456 Oak Avenue/i)).toBeInTheDocument();
  });

  it('shows Selected badge when isSelected is true', () => {
    render(<AddressCard address={mockAddress} isSelected={true} />);
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('does not show Selected badge when isSelected is false', () => {
    render(<AddressCard address={mockAddress} isSelected={false} />);
    expect(screen.queryByText('Selected')).not.toBeInTheDocument();
  });

  it('applies border-primary class when selected', () => {
    const { container } = render(<AddressCard address={mockAddress} isSelected={true} />);
    expect(container.firstChild).toHaveClass('border-primary');
  });

  it('does not apply border-primary class when not selected', () => {
    const { container } = render(<AddressCard address={mockAddress} isSelected={false} />);
    expect(container.firstChild).not.toHaveClass('border-primary');
  });

  it('renders city and country in address', () => {
    render(<AddressCard address={mockAddress} isSelected={false} />);
    expect(screen.getByText(/Springfield/i)).toBeInTheDocument();
    expect(screen.getByText(/United States/i)).toBeInTheDocument();
  });
});
