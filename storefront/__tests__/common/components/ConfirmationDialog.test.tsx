import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationDialog from 'common/components/dialog/ConfirmationDialog';

jest.mock('react-bootstrap/Modal', () => {
  const MockModal = ({ show, onHide, children }: any) =>
    show ? <div role="dialog">{children}</div> : null;
  MockModal.Header = ({ children }: any) => <div>{children}</div>;
  MockModal.Title = ({ children }: any) => <h5>{children}</h5>;
  MockModal.Body = ({ children }: any) => <div>{children}</div>;
  MockModal.Footer = ({ children }: any) => <div>{children}</div>;
  MockModal.displayName = 'Modal';
  return MockModal;
});

jest.mock('react-bootstrap/Button', () => {
  const MockButton = ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  );
  MockButton.displayName = 'Button';
  return MockButton;
});

const defaultProps = {
  isOpen: true,
  title: 'Confirm Action',
  ok: jest.fn(),
  cancel: jest.fn(),
  children: <p>Are you sure?</p>,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConfirmationDialog', () => {
  it('renders when isOpen is true', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders OK button with custom text', () => {
    render(<ConfirmationDialog {...defaultProps} okText="Yes, Delete" />);
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
  });

  it('renders Cancel button with custom text', () => {
    render(<ConfirmationDialog {...defaultProps} cancelText="No, Keep" />);
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
  });

  it('calls ok callback when OK button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} okText="OK" />);
    fireEvent.click(screen.getByText('OK'));
    expect(defaultProps.ok).toHaveBeenCalledTimes(1);
  });

  it('calls cancel callback when Cancel button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} cancelText="Cancel" />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.cancel).toHaveBeenCalledTimes(1);
  });

  it('hides OK button when isShowOk is false', () => {
    render(<ConfirmationDialog {...defaultProps} isShowOk={false} okText="OK" />);
    expect(screen.queryByText('OK')).not.toBeInTheDocument();
  });

  it('hides Cancel button when isShowCancel is false', () => {
    render(<ConfirmationDialog {...defaultProps} isShowCancel={false} cancelText="Cancel" />);
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('shows both buttons by default', () => {
    render(<ConfirmationDialog {...defaultProps} okText="Confirm" cancelText="Dismiss" />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
});
