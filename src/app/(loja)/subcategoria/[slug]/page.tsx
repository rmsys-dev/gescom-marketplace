import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ListingSkeleton } from '@/features/marketplace/components/bits';
import { CatalogView } from '@/features/marketplace/components/catalog-view';
import { findStoreSubcategoryBySlug } from '@/features/marketplace/gescom-catalog';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const subcategory = await findStoreSubcategoryBySlug(slug);
    return { title: subcategory?.name ?? 'Sub-categoria' };
  } catch {
    return { title: 'Sub-categoria' };
  }
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { slug } = await params;
  let subcategory = null;
  try {
    subcategory = await findStoreSubcategoryBySlug(slug);
  } catch {
    notFound();
  }
  if (!subcategory) notFound();

  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CatalogView
        title={subcategory.name}
        description={subcategory.description}
        subcategorySlug={subcategory.slug}
      />
    </Suspense>
  );
}
