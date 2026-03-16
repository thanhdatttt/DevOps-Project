import { formatPrice } from 'utils/formatPrice';

describe('formatPrice', () => {
  it('formats a simple integer price', () => {
    const result = formatPrice(100);
    expect(result).toContain('100');
  });

  it('formats zero correctly', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
  });

  it('formats a decimal price', () => {
    const result = formatPrice(19.99);
    expect(result).toContain('19.99');
  });

  it('returns a string', () => {
    expect(typeof formatPrice(50)).toBe('string');
  });

  it('formats large prices', () => {
    const result = formatPrice(1000000);
    expect(result).toContain('1,000,000');
  });

  it('includes currency symbol', () => {
    const result = formatPrice(25);
    expect(result).toMatch(/\$|USD/);
  });
});
