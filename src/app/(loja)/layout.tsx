import { StoreShell } from '@/features/marketplace/components/store-shell';

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
