import {
  SLUG_FIELD_PATTERN,
  USER_NAME_PATTERN,
  EMAIL_PATTERN,
} from '../../../modules/catalog/constants/validationPattern';

describe('SLUG_FIELD_PATTERN', () => {
  const testSlug = (value: string) => {
    const pattern = new RegExp(SLUG_FIELD_PATTERN.source);
    return pattern.test(value);
  };

  it('matches valid slugs with lowercase letters', () => {
    expect(testSlug('my-product')).toBe(true);
  });

  it('matches valid slugs with numbers', () => {
    expect(testSlug('product-123')).toBe(true);
  });

  it('matches slug with only lowercase letters', () => {
    expect(testSlug('abc')).toBe(true);
  });

  it('does not match slugs with uppercase letters', () => {
    expect(testSlug('MyProduct')).toBe(false);
  });

  it('does not match slugs with spaces', () => {
    expect(testSlug('my product')).toBe(false);
  });

  it('does not match slugs with special characters', () => {
    expect(testSlug('my_product!')).toBe(false);
  });
});

describe('USER_NAME_PATTERN', () => {
  const testUsername = (value: string) => {
    const pattern = new RegExp(USER_NAME_PATTERN.source);
    return pattern.test(value);
  };

  it('matches valid username with lowercase letters', () => {
    expect(testUsername('johndoe')).toBe(true);
  });

  it('matches valid username with numbers', () => {
    expect(testUsername('user123')).toBe(true);
  });

  it('does not match username with uppercase', () => {
    expect(testUsername('JohnDoe')).toBe(false);
  });

  it('does not match username with spaces', () => {
    expect(testUsername('john doe')).toBe(false);
  });

  it('does not match username with hyphens', () => {
    expect(testUsername('john-doe')).toBe(false);
  });
});

describe('EMAIL_PATTERN', () => {
  it('matches valid email', () => {
    expect(EMAIL_PATTERN.test('user@example.com')).toBe(true);
  });

  it('matches email with subdomain', () => {
    expect(EMAIL_PATTERN.test('user@mail.example.com')).toBe(true);
  });

  it('matches email with plus sign', () => {
    expect(EMAIL_PATTERN.test('user+tag@example.com')).toBe(true);
  });

  it('does not match email without @', () => {
    expect(EMAIL_PATTERN.test('userexample.com')).toBe(false);
  });

  it('does not match email without domain', () => {
    expect(EMAIL_PATTERN.test('user@')).toBe(false);
  });

  it('does not match email without TLD', () => {
    expect(EMAIL_PATTERN.test('user@example')).toBe(false);
  });

  it('does not match plain text', () => {
    expect(EMAIL_PATTERN.test('notanemail')).toBe(false);
  });
});
