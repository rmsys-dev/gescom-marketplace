import type { Metadata } from 'next';

import { AccountHome } from '@/features/marketplace/components/account-views';

export const metadata: Metadata = { title: 'Conta' };

export default function AccountPage() {
  return <AccountHome />;
}
