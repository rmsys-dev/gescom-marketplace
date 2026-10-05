import type { Metadata } from 'next';

import { AddressesView } from '@/features/marketplace/components/account-views';

export const metadata: Metadata = { title: 'Endereços' };

export default function AddressesPage() {
  return <AddressesView />;
}
