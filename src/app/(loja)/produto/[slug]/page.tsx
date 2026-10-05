import type { Metadata } from 'next';

import { getProductBySlug } from '@/features/marketplace/catalog';
import { ProductView } from '@/features/marketplace/components/product-view';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return {
    title: product?.name ?? 'Produto',
    description: product?.summary,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
