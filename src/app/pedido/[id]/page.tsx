import type { Metadata } from 'next';

import { OrderConfirmation } from '@/features/marketplace/components/account-views';
import { StoreShell } from '@/features/marketplace/components/store-shell';

export const metadata: Metadata = { title: 'Pedido confirmado' };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <StoreShell mode="focus" title="Pedido" backHref="/">
      <OrderConfirmation id={id} />
    </StoreShell>
  );
}
