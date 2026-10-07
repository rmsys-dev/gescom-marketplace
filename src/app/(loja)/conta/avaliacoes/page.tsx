import type { Metadata } from 'next';

import { ReviewsView } from '@/features/marketplace/components/account-views';

export const metadata: Metadata = { title: 'Avaliações' };

export default function ReviewsPage() {
  return <ReviewsView />;
}
