import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginView } from '@/features/marketplace/components/auth-views';
import { AuthShell } from '@/features/marketplace/components/auth-shell';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <AuthShell backHref="/">
      <Suspense>
        <LoginView />
      </Suspense>
    </AuthShell>
  );
}
