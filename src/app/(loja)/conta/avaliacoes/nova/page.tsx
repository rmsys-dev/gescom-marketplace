import type { Metadata } from 'next';

import { CreateReviewView } from '@/features/marketplace/components/account-views';

export const metadata: Metadata = { title: 'Criar avaliação' };

export default async function CreateReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string; produto?: string; nota?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.pedido?.trim() ?? '';
  const productId = params.produto?.trim() ?? '';
  const parsed = Number(params.nota);
  const initialRating =
    Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? Math.round(parsed) : 0;

  return (
    <CreateReviewView orderId={orderId} productId={productId} initialRating={initialRating} />
  );
}
