import type { Metadata } from 'next';

import { CheckoutView } from '@/features/marketplace/components/checkout-view';
import { StoreShell } from '@/features/marketplace/components/store-shell';

export const metadata: Metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return (
    <StoreShell mode="focus" title="Checkout" backHref="/carrinho">
      <CheckoutView />
    </StoreShell>
  );
}
