import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ListingSkeleton } from '@/features/marketplace/components/bits';
import { HomeView } from '@/features/marketplace/components/home-view';

export const metadata: Metadata = {
  title: 'Início',
};

export default function HomePage() {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <HomeView />
    </Suspense>
  );
}
