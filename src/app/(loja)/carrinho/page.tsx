import type { Metadata } from 'next';

import { CartView } from '@/features/marketplace/components/cart-view';

export const metadata: Metadata = { title: 'Carrinho' };

export default function CartPage() {
  return <CartView />;
}
