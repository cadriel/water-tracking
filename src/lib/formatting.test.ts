import { splitDigits, formatReading, formatDelta } from './formatting';

describe('splitDigits', () => {
  test('splits a whole-and-fraction reading into 4+4 digit strings', () => {
    expect(splitDigits(1234.5678)).toEqual({ white: '1234', red: '5678' });
  });

  test('zero-pads small whites', () => {
    expect(splitDigits(7.0001)).toEqual({ white: '0007', red: '0001' });
  });

  test('zero-pads small reds', () => {
    expect(splitDigits(1234.0001)).toEqual({ white: '1234', red: '0001' });
  });

  test('handles a clean integer reading', () => {
    expect(splitDigits(42)).toEqual({ white: '0042', red: '0000' });
  });

  test('rounds the fractional portion to 4 digits', () => {
    // 0.12345 has 5 decimal digits — should round to 1235
    expect(splitDigits(1.12345)).toEqual({ white: '0001', red: '1235' });
  });
});

describe('formatReading', () => {
  test('formats with 4 decimal places and m³ suffix', () => {
    expect(formatReading(1234.5678)).toBe('1234.5678 m³');
  });

  test('pads short readings', () => {
    expect(formatReading(7)).toBe('0007.0000 m³');
  });
});

describe('formatDelta', () => {
  test('formats a positive delta in m³ and L', () => {
    expect(formatDelta(0.0123)).toBe('+0.0123 m³ / +12.3 L');
  });

  test('formats a negative delta', () => {
    expect(formatDelta(-0.005)).toBe('-0.0050 m³ / -5.0 L');
  });

  test('formats a zero delta', () => {
    expect(formatDelta(0)).toBe('+0.0000 m³ / +0.0 L');
  });
});
