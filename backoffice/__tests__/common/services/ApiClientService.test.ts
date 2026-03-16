const mockFetch = jest.fn();
global.fetch = mockFetch;

import apiClientService from '../../../common/services/ApiClientService';

const mockResponse = (overrides: object = {}) =>
  ({
    status: 200,
    ok: true,
    type: 'basic',
    redirected: false,
    url: '',
    json: jest.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as Response);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('apiClientService.get', () => {
  it('calls fetch with the endpoint and undefined options', async () => {
    mockFetch.mockResolvedValue(mockResponse());
    await apiClientService.get('/api/test');
    expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined);
  });

  it('returns the fetch response object', async () => {
    const fake = mockResponse({ status: 200 });
    mockFetch.mockResolvedValue(fake);
    const result = await apiClientService.get('/api/test');
    expect(result).toBe(fake);
  });
});

describe('apiClientService.post', () => {
  it('calls fetch with POST method and serialised body', async () => {
    mockFetch.mockResolvedValue(mockResponse({ status: 201 }));
    await apiClientService.post('/api/items', JSON.stringify({ name: 'test' }));
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'test' }) })
    );
  });

  it('sets the default Content-type header', async () => {
    mockFetch.mockResolvedValue(mockResponse({ status: 201 }));
    await apiClientService.post('/api/items', JSON.stringify({}));
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Content-type']).toBe('application/json; charset=UTF-8');
  });

  it('uses a custom contentType when provided', async () => {
    mockFetch.mockResolvedValue(mockResponse({ status: 201 }));
    await apiClientService.post('/api/items', JSON.stringify({}), 'text/plain');
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Content-type']).toBe('text/plain');
  });

  it('removes Content-type header when body is FormData', async () => {
    mockFetch.mockResolvedValue(mockResponse({ status: 201 }));
    const formData = new FormData();
    await apiClientService.post('/api/upload', formData as any);
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Content-type']).toBeUndefined();
  });
});

describe('apiClientService.put', () => {
  it('calls fetch with PUT method and body', async () => {
    mockFetch.mockResolvedValue(mockResponse({ status: 204 }));
    await apiClientService.put('/api/items/1', JSON.stringify({ name: 'updated' }));
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

describe('apiClientService.delete', () => {
  it('calls fetch with DELETE method', async () => {
    mockFetch.mockResolvedValue(mockResponse({ status: 204 }));
    await apiClientService.delete('/api/items/1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('error handling', () => {
  it('re-throws when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(apiClientService.get('/api/fail')).rejects.toThrow('Network error');
  });
});

describe('CORS redirect handling', () => {
  it('executes without error when response is cors and redirected', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ type: 'cors', redirected: true, url: 'https://auth.example.com/login' })
    );
    await expect(apiClientService.get('/api/protected')).resolves.toBeDefined();
  });

  it('does not attempt redirect when response type is basic', async () => {
    mockFetch.mockResolvedValue(mockResponse({ type: 'basic', redirected: false }));
    await expect(apiClientService.get('/api/normal')).resolves.toBeDefined();
  });

  it('does not attempt redirect when cors but not redirected', async () => {
    mockFetch.mockResolvedValue(mockResponse({ type: 'cors', redirected: false }));
    await expect(apiClientService.get('/api/cors-ok')).resolves.toBeDefined();
  });
});
