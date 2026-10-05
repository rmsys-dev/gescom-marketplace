'use client';

import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/features/marketplace/components/bits';
import { Button } from '@/shared/components/ui/button';

export default function LojaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Não foi possível abrir esta página"
      description="Tente de novo. Se continuar, volte para o início."
      action={
        <Button type="button" className="h-12 w-full" tooltip={false} onClick={() => reset()}>
          Tentar de novo
        </Button>
      }
    />
  );
}
