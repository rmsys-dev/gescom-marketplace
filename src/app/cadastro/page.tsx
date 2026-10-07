import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RegisterView } from '@/features/marketplace/components/auth-views';
import { AuthShell } from '@/features/marketplace/components/auth-shell';
import { safeNextPath } from '@/features/marketplace/masks';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = typeof params.next === 'string' ? params.next : undefined;
  const next = rawNext ? safeNextPath(rawNext) : '';
  const backHref = next ? `/entrar?next=${encodeURIComponent(next)}` : '/entrar';

  return (
    <AuthShell backHref={backHref}>
      <Suspense>
        <RegisterView />
      </Suspense>
    </AuthShell>
  );
}
