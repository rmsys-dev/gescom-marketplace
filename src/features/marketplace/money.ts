const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const FREE_SHIPPING_FROM = 19_900;
export const STANDARD_SHIPPING = 1_990;

export function formatBRL(cents: number) {
  return brl.format(cents / 100);
}

export function discountPercent(price: number, compareAtPrice: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function installmentLabel(cents: number) {
  if (cents < 9_000) return null;
  const each = Math.round(cents / 3);
  return `ou 3x de ${formatBRL(each)} sem juros`;
}

export function parseReais(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export function formatPriceParam(cents: number) {
  const reais = cents / 100;
  if (Number.isInteger(reais)) return String(reais);
  return reais.toFixed(2).replace('.', ',');
}

export function cartTotals(lines: { price: number; quantity: number; freeShipping: boolean }[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const qualifies =
    lines.length === 0 ||
    lines.every((line) => line.freeShipping) ||
    subtotal >= FREE_SHIPPING_FROM;
  const shipping = lines.length === 0 || qualifies ? 0 : STANDARD_SHIPPING;
  return { subtotal, shipping, total: subtotal + shipping };
}
