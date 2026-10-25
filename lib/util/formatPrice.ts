export function formatPrice(price: number | null): string {
  return price != null ? `₹${price}` : 'Price on Request';
}
