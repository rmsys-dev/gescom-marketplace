import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ListingSkeleton } from '@/features/marketplace/components/bits';
import { CatalogView } from '@/features/marketplace/components/catalog-view';
import { findStoreCategoryBySlug } from '@/features/marketplace/gescom-catalog';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await findStoreCategoryBySlug(slug);
    return { title: category?.name ?? 'Categoria' };
  } catch {
    return { title: 'Categoria' };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  let category = null;
  try {
    category = await findStoreCategoryBySlug(slug);
  } catch {
    notFound();
  }
  if (!category) notFound();

  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CatalogView
        title={category.name}
        description={category.description}
        categorySlug={category.slug}
      />
    </Suspense>
  );
}
