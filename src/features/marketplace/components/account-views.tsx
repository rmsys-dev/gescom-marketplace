'use client';

import { Package, UserRound } from 'lucide-react';
import Link from 'next/link';

import { ACCOUNT_NAV } from '@/features/marketplace/account-nav';
import { OrderPanel } from '@/features/marketplace/components/account-orders';
import { EmptyState } from '@/features/marketplace/components/bits';
import { useMarketplace } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export { OrdersView, OrderDetail } from '@/features/marketplace/components/account-orders';
export {
  CreateReviewView,
  ReviewsView,
} from '@/features/marketplace/components/account-reviews';
export { AddressesView } from '@/features/marketplace/components/account-addresses';
export { ProfileView } from '@/features/marketplace/components/account-profile';

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function AccountGate({ children }: { children: React.ReactNode }) {
  const { hydrated, user } = useMarketplace();
  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-3 px-4 py-8" aria-hidden>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8">
        <EmptyState
          icon={UserRound}
          title="Entre para continuar"
          description="A conta fica neste aparelho. Use um e-mail válido e uma senha com 6 caracteres ou mais."
          action={
            <Button asChild className="h-12 w-full" tooltip={false}>
              <Link href="/entrar">Entrar</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return children;
}

export function AccountHome() {
  const { user } = useMarketplace();
  if (!user) return null;

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex items-center gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold tracking-wide text-foreground"
          aria-hidden
        >
          {userInitials(user.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{user.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <section aria-label="Atalhos da conta">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ACCOUNT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full min-h-30 flex-col gap-3 rounded-2xl bg-card p-5 shadow-card ring-1 ring-foreground/8 transition-colors hover:ring-primary/25"
                >
                  <Icon className="size-6 text-foreground" strokeWidth={1.6} aria-hidden />
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold tracking-tight">{item.label}</span>
                    <span className="block text-sm leading-snug text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export function OrderConfirmation({ id }: { id: string }) {
  const { orders, hydrated } = useMarketplace();
  const order = orders.find((item) => item.id === id);
  if (!hydrated) return <p className="text-sm text-muted-foreground">Carregando pedido…</p>;
  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Pedido não encontrado"
        description="Abra a conta neste mesmo navegador para ver os pedidos salvos."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/">Ir para o início</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <OrderPanel order={order} confirmation />
      <Button asChild className="h-12 w-full" tooltip={false}>
        <Link href="/conta/pedidos">Ver meus pedidos</Link>
      </Button>
    </div>
  );
}
