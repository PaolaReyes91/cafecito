const DISCOUNT_TIERS = [
  { min: 0, max: 0, percent: 0 },
  { min: 1, max: 3, percent: 5 },
  { min: 4, max: 7, percent: 10 },
  { min: 8, max: Infinity, percent: 15 },
];

export const getDiscountPercent = (purchasesCount) => {
  const tier = DISCOUNT_TIERS.find((t) => purchasesCount >= t.min && purchasesCount <= t.max);
  return tier ? tier.percent : 0;
};

export const calcDiscount = (subtotal, purchasesCount) => {
  const percent = getDiscountPercent(purchasesCount);
  const amount = subtotal * (percent / 100);
  return { percent, amount };
};
