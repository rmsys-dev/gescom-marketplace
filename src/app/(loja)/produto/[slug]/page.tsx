import type { Metadata } from 'next';

import { ProductView } from '@/features/marketplace/components/product-view';
import { fetchStoreProduct } from '@/features/marketplace/gescom-catalog';
import { GescomError } from '@/shared/lib/gescom';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product } = await fetchStoreProduct(slug);
    return {
      title: product.name,
      description: product.summary,
    };
  } catch (error) {
    if (error instanceof GescomError && error.code === 'PRODUCT_NOT_FOUND') {
      return { title: 'Produto' };
    }
    return { title: 'Produto' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductView key={slug} slug={slug} />;
}
