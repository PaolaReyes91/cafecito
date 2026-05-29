import { getDiscountPercent, calcDiscount } from '../../../src/utils/discount.js';

describe('getDiscountPercent', () => {
  // U26
  test('0 purchases → 0%', () => {
    expect(getDiscountPercent(0)).toBe(0);
  });

  // U27
  test('1-3 purchases → 5%', () => {
    expect(getDiscountPercent(1)).toBe(5);
    expect(getDiscountPercent(2)).toBe(5);
    expect(getDiscountPercent(3)).toBe(5);
  });

  // U28
  test('4-7 purchases → 10%', () => {
    expect(getDiscountPercent(4)).toBe(10);
    expect(getDiscountPercent(5)).toBe(10);
    expect(getDiscountPercent(7)).toBe(10);
  });

  // U29
  test('8+ purchases → 15%', () => {
    expect(getDiscountPercent(8)).toBe(15);
    expect(getDiscountPercent(20)).toBe(15);
    expect(getDiscountPercent(999)).toBe(15);
  });

  // U30
  test('boundary values at each tier edge', () => {
    expect(getDiscountPercent(0)).toBe(0);
    expect(getDiscountPercent(1)).toBe(5);
    expect(getDiscountPercent(3)).toBe(5);
    expect(getDiscountPercent(4)).toBe(10);
    expect(getDiscountPercent(7)).toBe(10);
    expect(getDiscountPercent(8)).toBe(15);
  });
});

describe('calcDiscount', () => {
  test('calculates discount amount correctly', () => {
    const result = calcDiscount(1000, 5);
    expect(result.percent).toBe(10);
    expect(result.amount).toBe(100);
  });

  test('returns zero amount for new customers', () => {
    const result = calcDiscount(500, 0);
    expect(result.percent).toBe(0);
    expect(result.amount).toBe(0);
  });
});
