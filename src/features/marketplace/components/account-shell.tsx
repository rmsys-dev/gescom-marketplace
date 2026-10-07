'use client';

import { LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useState } from 'react';

import { ACCOUNT_NAV, isAccountNavActive } from '@/features/marketplace/account-nav';
import { AccountGate } from '@/features/marketplace/components/account-views';
import { logout, useMarketplace } from '@/features/marketplace/store';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { cn } from '@/shared/lib/utils';

type Crumb = { href?: string; label: string };

function accountBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/conta') return [{ label: 'Minha conta' }];

  const crumbs: Crumb[] = [{ href: '/conta', label: 'Conta' }];
  const section = ACCOUNT_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (!section) return crumbs;

  if (pathname === section.href) {
    crumbs.push({ label: section.label });
    return crumbs;
  }

  crumbs.push({ href: section.href, label: section.label });

  if (pathname.startsWith('/conta/pedidos/')) {
    crumbs.push({ label: 'Status da compra' });
  }

  if (pathname.startsWith('/conta/avaliacoes/nova')) {
    crumbs.push({ label: 'Criar avaliação' });
  }

  return crumbs;
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {ACCOUNT_NAV.map((item) => {
        const Icon = item.icon;
        const active = isAccountNavActive(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                active
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'size-4.5 shrink-0',
                  active ? 'text-primary' : 'text-foreground/70',
                )}
                strokeWidth={1.75}
                aria-hidden
              />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function AccountMobileBreadcrumb({ pathname }: { pathname: string }) {
  const crumbs = accountBreadcrumbs(pathname);

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden text-sm">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator className="shrink-0" /> : null}
            <BreadcrumbItem className="min-w-0">
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="truncate">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => logout()}
      className={cn(
        'inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground',
        className,
      )}
    >
      <LogOut className="size-4.5 shrink-0" strokeWidth={1.75} aria-hidden />
      Sair
    </button>
  );
}

function AccountSidebar({
  pathname,
  className,
  onNavigate,
  showLogout,
}: {
  pathname: string;
  className?: string;
  onNavigate?: () => void;
  showLogout: boolean;
}) {
  return (
    <aside className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2.5 px-3 pb-5">
        <Menu className="size-5 text-foreground" strokeWidth={1.75} aria-hidden />
        <p className="text-base font-semibold tracking-tight text-foreground">Minha conta</p>
      </div>
      <nav aria-label="Conta" className="min-h-0 flex-1">
        <NavList pathname={pathname} onNavigate={onNavigate} />
      </nav>
      {showLogout ? (
        <div className="mt-auto border-t border-border pt-3">
          <LogoutButton className="w-full" />
        </div>
      ) : null}
    </aside>
  );
}

function AccountShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useMarketplace();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      data-account-shell
      className="flex w-full min-h-[calc(100dvh-var(--store-header-h,4rem)-3.5rem-env(safe-area-inset-bottom))] flex-1 md:min-h-[calc(100dvh-var(--store-header-h,4rem))]"
    >
      <AccountSidebar
        pathname={pathname}
        showLogout={Boolean(user)}
        className="sticky top-(--store-header-h,4rem) hidden h-[calc(100dvh-var(--store-header-h,4rem))] w-56 shrink-0 border-r border-border bg-background px-3 py-6 md:flex lg:w-64"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-(--store-header-h,4rem) z-20 flex h-12 items-center gap-1 border-b border-border bg-background/95 px-2 backdrop-blur-md md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0"
            tooltip={false}
            aria-label="Abrir menu da conta"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </Button>
          <AccountMobileBreadcrumb pathname={pathname} />
        </div>

        <div className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-7 lg:px-10">{children}</div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(18rem,88vw)] gap-0 bg-background p-0"
          data-lenis-prevent-touch
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Minha conta</SheetTitle>
            <SheetDescription>Navegação da conta</SheetDescription>
          </SheetHeader>
          <AccountSidebar
            pathname={pathname}
            showLogout={Boolean(user)}
            className="h-full px-3 pt-14 pb-6"
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicFavorites = pathname.startsWith('/conta/favoritos');

  if (publicFavorites) {
    return <AccountShellFrame>{children}</AccountShellFrame>;
  }

  return (
    <AccountGate>
      <AccountShellFrame>{children}</AccountShellFrame>
    </AccountGate>
  );
}
