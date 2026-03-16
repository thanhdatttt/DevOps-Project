import { formatPriceVND, formatPriceUSD } from '../../utils/formatPrice';

describe('formatPriceVND', () => {
  it('formats zero as VND currency', () => {
    const result = formatPriceVND(0);
    expect(result).toContain('0');
    expect(result).toContain('₫');
  });

  it('formats a positive price', () => {
    const result = formatPriceVND(100000);
    expect(result).toContain('100');
    expect(result).toContain('₫');
  });

  it('formats a large price', () => {
    const result = formatPriceVND(1000000);
    expect(result).toContain('₫');
  });

  it('returns a string', () => {
    expect(typeof formatPriceVND(500)).toBe('string');
  });
});

describe('formatPriceUSD', () => {
  it('formats zero as USD currency', () => {
    const result = formatPriceUSD(0);
    expect(result).toContain('$');
    expect(result).toContain('0');
  });

  it('formats a positive price', () => {
    const result = formatPriceUSD(99.99);
    expect(result).toContain('$');
    expect(result).toContain('99');
  });

  it('formats a large price', () => {
    const result = formatPriceUSD(1000);
    expect(result).toContain('$');
    expect(result).toContain('1');
  });

  it('returns a string', () => {
    expect(typeof formatPriceUSD(500)).toBe('string');
  });
});
