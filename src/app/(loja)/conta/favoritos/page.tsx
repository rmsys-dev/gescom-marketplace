import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProductGridSkeleton } from '@/features/marketplace/components/bits';
import { CatalogView } from '@/features/marketplace/components/catalog-view';

export const metadata: Metadata = { title: 'Favoritos' };

export default function FavoritesPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <CatalogView title="Favoritos" description="Produtos salvos neste aparelho." favoritesOnly />
    </Suspense>
  );
}
