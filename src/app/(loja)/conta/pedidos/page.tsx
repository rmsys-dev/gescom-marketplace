import type { Metadata } from 'next';

import { OrdersView } from '@/features/marketplace/components/account-views';

export const metadata: Metadata = { title: 'Pedidos' };

export default function OrdersPage() {
  return <OrdersView />;
}
