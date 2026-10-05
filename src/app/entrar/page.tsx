import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginView } from '@/features/marketplace/components/auth-views';
import { StoreShell } from '@/features/marketplace/components/store-shell';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <StoreShell mode="focus" title="Entrar" backHref="/">
      <Suspense>
        <LoginView />
      </Suspense>
    </StoreShell>
  );
}
