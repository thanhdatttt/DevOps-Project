jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { toast } from 'react-toastify';
import { toastSuccess, toastError } from '../../../common/services/ToastService';

describe('ToastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toastSuccess', () => {
    it('calls toast.success with message', () => {
      toastSuccess('Operation successful');
      expect(toast.success).toHaveBeenCalledWith(
        'Operation successful',
        expect.objectContaining({ position: 'top-right' })
      );
    });

    it('uses default options when none provided', () => {
      toastSuccess('Done');
      expect(toast.success).toHaveBeenCalledWith(
        'Done',
        expect.objectContaining({
          autoClose: 3000,
          closeOnClick: true,
          pauseOnHover: false,
          theme: 'colored',
        })
      );
    });

    it('uses custom options when provided', () => {
      const customOptions = { autoClose: 5000, position: 'bottom-left' as const };
      toastSuccess('Custom', customOptions);
      expect(toast.success).toHaveBeenCalledWith('Custom', customOptions);
    });
  });

  describe('toastError', () => {
    it('calls toast.error with message', () => {
      toastError('Something went wrong');
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({ position: 'top-right' })
      );
    });

    it('uses default options when none provided', () => {
      toastError('Error');
      expect(toast.error).toHaveBeenCalledWith(
        'Error',
        expect.objectContaining({
          autoClose: 3000,
          closeOnClick: true,
          theme: 'colored',
        })
      );
    });

    it('uses custom options when provided', () => {
      const customOptions = { autoClose: 1000, position: 'bottom-right' as const };
      toastError('Custom error', customOptions);
      expect(toast.error).toHaveBeenCalledWith('Custom error', customOptions);
    });
  });
});
