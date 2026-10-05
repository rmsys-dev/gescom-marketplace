import type { Metadata } from 'next';

import { OrderDetail } from '@/features/marketplace/components/account-views';

export const metadata: Metadata = { title: 'Pedido' };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
