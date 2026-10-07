import { AccountShell } from '@/features/marketplace/components/account-shell';

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
