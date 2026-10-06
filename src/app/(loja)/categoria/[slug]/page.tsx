import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getCategory } from '@/features/marketplace/catalog';
import { ListingSkeleton } from '@/features/marketplace/components/bits';
import { CatalogView } from '@/features/marketplace/components/catalog-view';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return { title: category?.name ?? 'Categoria' };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategory(slug);
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
