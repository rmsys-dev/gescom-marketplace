import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ConfirmEmailView } from '@/features/marketplace/components/auth-views';
import { AuthShell } from '@/features/marketplace/components/auth-shell';
import { safeNextPath } from '@/features/marketplace/masks';

export const metadata: Metadata = { title: 'Confirmar e-mail' };

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; email?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = typeof params.next === 'string' ? params.next : undefined;
  const next = rawNext ? safeNextPath(rawNext) : '';
  const backHref = next ? `/entrar?next=${encodeURIComponent(next)}` : '/entrar';

  return (
    <AuthShell backHref={backHref}>
      <Suspense>
        <ConfirmEmailView />
      </Suspense>
    </AuthShell>
  );
}
