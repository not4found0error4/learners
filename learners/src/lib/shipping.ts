export const SHIPPING_RATE_PER_KG = 60;
export const PACKAGING_GRAMS = 0;

export function calculateShipping(items: { weight_grams: number; quantity: number }[]) {
  const totalGrams =
    items.reduce((total, item) => total + item.weight_grams * item.quantity, 0) +
    PACKAGING_GRAMS;
  const billedKg = items.length > 0 ? Math.max(1, Math.ceil(totalGrams / 1000)) : 0;

  return {
    totalGrams,
    billedKg,
    shippingAmount: billedKg * SHIPPING_RATE_PER_KG,
  };
}
