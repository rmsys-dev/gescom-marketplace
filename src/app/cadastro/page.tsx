import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RegisterView } from '@/features/marketplace/components/auth-views';
import { StoreShell } from '@/features/marketplace/components/store-shell';

export const metadata: Metadata = { title: 'Criar conta' };

export default function RegisterPage() {
  return (
    <StoreShell mode="focus" title="Criar conta" backHref="/entrar">
      <Suspense>
        <RegisterView />
      </Suspense>
    </StoreShell>
  );
}
