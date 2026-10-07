import { getProductById } from '@/features/marketplace/catalog';
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '@/features/marketplace/types';

const DAY_MONTH = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });
const DAY_MONTH_SHORT = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

export function formatDayMonth(iso: string) {
  return DAY_MONTH.format(new Date(iso));
}

export function formatDayMonthShort(iso: string) {
  return DAY_MONTH_SHORT.format(new Date(iso)).replace('.', '');
}

/** Data estimada de chegada: +1 dia útil simulado a partir da compra. */
export function estimatedArrival(iso: string) {
  const date = new Date(iso);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export function orderStatusHeadline(status: OrderStatus, createdAt: string) {
  const arrival = formatDayMonth(estimatedArrival(createdAt));
  switch (status) {
    case 'entregue':
      return `Chegou no dia ${arrival}`;
    case 'enviado':
      return 'A caminho';
    case 'preparando':
      return 'Em preparação';
    default:
      return 'Pedido confirmado';
  }
}

export function itemQuantityLabel(quantity: number) {
  return quantity === 1 ? '1 unidade' : `${quantity} unidades`;
}

export function itemMetaLine(item: OrderItem) {
  const product = getProductById(item.productId);
  const parts = [item.quantity === 1 ? '1 un.' : `${item.quantity} un.`];
  if (product?.variants?.[0]) {
    parts.push(`${product.variantLabel ?? 'Opção'}: ${product.variants[0].label}`);
  }
  return parts.join(' | ');
}

export function paymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case 'pix':
      return 'Pix';
    case 'credito':
      return 'Cartão de crédito';
    case 'boleto':
      return 'Boleto';
  }
}

export function orderHasFreeShipping(order: Order) {
  return (
    order.shipping === 0 &&
    order.items.some((item) => getProductById(item.productId)?.freeShipping)
  );
}

export function createReviewHref(orderId: string, productId: string, rating?: number) {
  const params = new URLSearchParams({
    pedido: orderId,
    produto: productId,
  });
  if (rating && rating > 0) params.set('nota', String(rating));
  return `/conta/avaliacoes/nova?${params.toString()}`;
}
