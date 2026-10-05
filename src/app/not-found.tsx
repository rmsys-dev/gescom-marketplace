import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/features/marketplace/components/bits';
import { StoreShell } from '@/features/marketplace/components/store-shell';
import { Button } from '@/shared/components/ui/button';

export const metadata: Metadata = { title: 'Página não encontrada' };

export default function NotFound() {
  return (
    <StoreShell>
      <EmptyState
        icon={Search}
        title="Página não encontrada"
        description="O endereço não existe. Volte ao início ou busque um produto."
        action={
          <div className="grid gap-2">
            <Button asChild className="h-12 w-full" tooltip={false}>
              <Link href="/">Ir para o início</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full" tooltip={false}>
              <Link href="/busca">Buscar produtos</Link>
            </Button>
          </div>
        }
      />
    </StoreShell>
  );
}
