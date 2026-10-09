import type { Metadata } from 'next';

import { SubcategoriesView } from '@/features/marketplace/components/home-view';

export const metadata: Metadata = {
  title: 'Sub-categorias',
};

export default function SubcategoriesPage() {
  return <SubcategoriesView />;
}
