import { concatQueryString } from '../../utils/concatQueryString';

describe('concatQueryString', () => {
  it('returns the url unchanged when array is empty', () => {
    expect(concatQueryString([], '/api/products')).toBe('/api/products');
  });

  it('appends a single query param with ?', () => {
    expect(concatQueryString(['pageNo=0'], '/api/products')).toBe('/api/products?pageNo=0');
  });

  it('appends multiple query params with & separator', () => {
    const result = concatQueryString(['pageNo=0', 'pageSize=10', 'name=test'], '/api/products');
    expect(result).toBe('/api/products?pageNo=0&pageSize=10&name=test');
  });

  it('handles a single param correctly', () => {
    const result = concatQueryString(['sort=asc'], '/api/items');
    expect(result).toBe('/api/items?sort=asc');
  });

  it('handles two params correctly', () => {
    const result = concatQueryString(['a=1', 'b=2'], '/url');
    expect(result).toBe('/url?a=1&b=2');
  });

  it('returns base url when empty array passed', () => {
    expect(concatQueryString([], '')).toBe('');
  });
});
