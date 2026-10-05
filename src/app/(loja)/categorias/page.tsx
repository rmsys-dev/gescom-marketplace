import type { Metadata } from 'next';

import { CategoriesView } from '@/features/marketplace/components/home-view';

export const metadata: Metadata = {
  title: 'Categorias',
};

export default function CategoriesPage() {
  return <CategoriesView />;
}
