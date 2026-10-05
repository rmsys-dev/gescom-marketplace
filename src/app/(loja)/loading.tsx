import { ProductGridSkeleton } from '@/features/marketplace/components/bits';

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-40 rounded-lg bg-muted" />
      <ProductGridSkeleton />
    </div>
  );
}
