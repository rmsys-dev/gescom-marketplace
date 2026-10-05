import type { Metadata } from 'next';

import { HomeView } from '@/features/marketplace/components/home-view';

export const metadata: Metadata = {
  title: 'Início',
};

export default function HomePage() {
  return <HomeView />;
}
