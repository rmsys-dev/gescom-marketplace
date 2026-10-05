import type { Metadata } from 'next';

import { ProfileView } from '@/features/marketplace/components/account-views';

export const metadata: Metadata = { title: 'Dados pessoais' };

export default function ProfilePage() {
  return <ProfileView />;
}
