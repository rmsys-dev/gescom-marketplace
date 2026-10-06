import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ListingSkeleton } from '@/features/marketplace/components/bits';
import { CatalogView } from '@/features/marketplace/components/catalog-view';

export const metadata: Metadata = {
  title: 'Busca',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CatalogView title="Busca" description="Encontre produtos e categorias." showRecent />
    </Suspense>
  );
}
