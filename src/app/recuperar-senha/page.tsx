import type { Metadata } from 'next';

import { RecoveryView } from '@/features/marketplace/components/auth-views';
import { StoreShell } from '@/features/marketplace/components/store-shell';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default function RecoveryPage() {
  return (
    <StoreShell mode="focus" title="Recuperar senha" backHref="/entrar">
      <RecoveryView />
    </StoreShell>
  );
}
