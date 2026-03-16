import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalDeleteCustom from 'common/items/ModalDeleteCustom';
import ModalChooseDefaultAddress from 'common/items/ModalChooseDefaultAddress';

jest.mock('react-bootstrap', () => ({
  Modal: Object.assign(
    ({ show, onHide, children }: any) => (show ? <div role="dialog">{children}</div> : null),
    {
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>,
    }
  ),
  Button: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

describe('ModalDeleteCustom', () => {
  const props = {
    showModalDelete: true,
    handleClose: jest.fn(),
    handleDelete: jest.fn(),
    action: 'delete this item',
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders when showModalDelete is true', () => {
    render(<ModalDeleteCustom {...props} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when showModalDelete is false', () => {
    render(<ModalDeleteCustom {...props} showModalDelete={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays the action in confirmation message', () => {
    render(<ModalDeleteCustom {...props} />);
    expect(screen.getByText(/delete this item/i)).toBeInTheDocument();
  });

  it('calls handleClose when Close button clicked', () => {
    render(<ModalDeleteCustom {...props} />);
    fireEvent.click(screen.getByText('Close'));
    expect(props.handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleDelete when Delete button clicked', () => {
    render(<ModalDeleteCustom {...props} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(props.handleDelete).toHaveBeenCalledTimes(1);
  });
});

describe('ModalChooseDefaultAddress', () => {
  const props = {
    showModalChooseDefaultAddress: true,
    handleClose: jest.fn(),
    handleChoose: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders when showModalChooseDefaultAddress is true', () => {
    render(<ModalChooseDefaultAddress {...props} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when showModalChooseDefaultAddress is false', () => {
    render(<ModalChooseDefaultAddress {...props} showModalChooseDefaultAddress={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows confirmation question', () => {
    render(<ModalChooseDefaultAddress {...props} />);
    expect(screen.getByText(/choose this address as default/i)).toBeInTheDocument();
  });

  it('calls handleClose when No is clicked', () => {
    render(<ModalChooseDefaultAddress {...props} />);
    fireEvent.click(screen.getByText('No'));
    expect(props.handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleChoose when Yes is clicked', () => {
    render(<ModalChooseDefaultAddress {...props} />);
    fireEvent.click(screen.getByText('Yes'));
    expect(props.handleChoose).toHaveBeenCalledTimes(1);
  });
});
