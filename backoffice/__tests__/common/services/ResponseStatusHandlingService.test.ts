jest.mock('../../../common/services/ToastService', () => ({
  toastSuccess: jest.fn(),
  toastError: jest.fn(),
}));

import { toastSuccess, toastError } from '../../../common/services/ToastService';
import {
  handleDeletingResponse,
  handleUpdatingResponse,
  handleCreatingResponse,
  handleResponse,
} from '../../../common/services/ResponseStatusHandlingService';
import {
  ResponseStatus,
  ResponseTitle,
  HAVE_BEEN_DELETED,
  DELETE_FAILED,
  UPDATE_SUCCESSFULLY,
  UPDATE_FAILED,
  CREATE_SUCCESSFULLY,
  CREATE_FAILED,
} from '../../../constants/Common';

beforeEach(() => jest.clearAllMocks());

// ─── handleDeletingResponse ───────────────────────────────────────────────────
describe('handleDeletingResponse', () => {
  it('calls toastSuccess when status is 204 (SUCCESS)', () => {
    handleDeletingResponse({ status: ResponseStatus.SUCCESS }, 'Item');
    expect(toastSuccess).toHaveBeenCalledWith('Item' + HAVE_BEEN_DELETED);
  });

  it('calls toastError with detail when title is NOT_FOUND', () => {
    handleDeletingResponse({ title: ResponseTitle.NOT_FOUND, detail: 'Not found' }, 'X');
    expect(toastError).toHaveBeenCalledWith('Not found');
  });

  it('calls toastError with detail when title is BAD_REQUEST', () => {
    handleDeletingResponse({ title: ResponseTitle.BAD_REQUEST, detail: 'Bad input' }, 'X');
    expect(toastError).toHaveBeenCalledWith('Bad input');
  });

  it('calls toastError with DELETE_FAILED for unknown responses', () => {
    handleDeletingResponse({ status: 500 }, 'X');
    expect(toastError).toHaveBeenCalledWith(DELETE_FAILED);
  });
});

// ─── handleUpdatingResponse ───────────────────────────────────────────────────
describe('handleUpdatingResponse', () => {
  it('calls toastSuccess on status 204 (SUCCESS)', () => {
    handleUpdatingResponse({ status: ResponseStatus.SUCCESS });
    expect(toastSuccess).toHaveBeenCalledWith(UPDATE_SUCCESSFULLY);
  });

  it('calls toastError with detail on BAD_REQUEST title', () => {
    handleUpdatingResponse({ title: ResponseTitle.BAD_REQUEST, detail: 'Invalid data' });
    expect(toastError).toHaveBeenCalledWith('Invalid data');
  });

  it('calls toastError with detail on NOT_FOUND title', () => {
    handleUpdatingResponse({ title: ResponseTitle.NOT_FOUND, detail: 'Resource not found' });
    expect(toastError).toHaveBeenCalledWith('Resource not found');
  });

  it('calls toastError with UPDATE_FAILED as fallback', () => {
    handleUpdatingResponse({ status: 500 });
    expect(toastError).toHaveBeenCalledWith(UPDATE_FAILED);
  });
});

// ─── handleCreatingResponse ───────────────────────────────────────────────────
describe('handleCreatingResponse', () => {
  it('calls toastSuccess on status 201 (CREATED)', async () => {
    await handleCreatingResponse({ status: ResponseStatus.CREATED });
    expect(toastSuccess).toHaveBeenCalledWith(CREATE_SUCCESSFULLY);
  });

  it('calls toastError with detail on status 400 (BAD_REQUEST)', async () => {
    const mockResponse = {
      status: ResponseStatus.BAD_REQUEST,
      json: jest.fn().mockResolvedValue({ detail: 'Validation error' }),
    };
    await handleCreatingResponse(mockResponse);
    expect(toastError).toHaveBeenCalledWith('Validation error');
  });

  it('calls toastError with CREATE_FAILED as fallback', async () => {
    await handleCreatingResponse({ status: 500 });
    expect(toastError).toHaveBeenCalledWith(CREATE_FAILED);
  });
});

// ─── handleResponse ───────────────────────────────────────────────────────────
describe('handleResponse', () => {
  it('calls toastSuccess when response.ok is true', () => {
    handleResponse({ ok: true }, 'Success!', 'Error!');
    expect(toastSuccess).toHaveBeenCalledWith('Success!');
  });

  it('calls toastError when response.ok is false', () => {
    handleResponse({ ok: false }, 'Success!', 'Error!');
    expect(toastError).toHaveBeenCalledWith('Error!');
  });
});
