import { YasError } from 'common/services/errors/YasError';

describe('YasError', () => {
  it('should create with default values', () => {
    const error = new YasError();
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(500);
    expect(error.title).toBe('Unknown error');
    expect(error.details).toBe('unknown');
    expect(error.fieldErrors).toEqual([]);
    expect(error.message).toBe('unknown');
  });

  it('should use detail as message when no fieldErrors', () => {
    const error = new YasError({ detail: 'Something went wrong' });
    expect(error.message).toBe('Something went wrong');
    expect(error.details).toBe('Something went wrong');
  });

  it('should use first fieldError as message when fieldErrors present', () => {
    const error = new YasError({ fieldErrors: ['Field is required', 'Invalid email'] });
    expect(error.message).toBe('Field is required');
    expect(error.fieldErrors).toEqual(['Field is required', 'Invalid email']);
  });

  it('should set status from status parameter', () => {
    const error = new YasError({ status: 404, title: 'Not Found' });
    expect(error.status).toBe(404);
    expect(error.title).toBe('Not Found');
  });

  it('should parse statusCode string to number', () => {
    const error = new YasError({ statusCode: '403' });
    expect(error.status).toBe(403);
  });

  it('should prefer status over statusCode', () => {
    const error = new YasError({ status: 400, statusCode: '403' });
    expect(error.status).toBe(400);
  });

  it('should handle all fields together', () => {
    const error = new YasError({
      status: 422,
      title: 'Validation Error',
      detail: 'Some detail',
      fieldErrors: ['name is required'],
    });
    expect(error.status).toBe(422);
    expect(error.title).toBe('Validation Error');
    expect(error.details).toBe('Some detail');
    expect(error.message).toBe('name is required');
  });
});
