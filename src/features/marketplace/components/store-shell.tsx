'use client';

import {
  ChevronLeft,
  Heart,
  Home,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { CategoryBar } from '@/features/marketplace/components/category-bar';
import { footerReserveClass, SiteFooter } from '@/features/marketplace/components/site-footer';
import {
  countActiveFilters,
  FilterDialog,
  readFilters,
} from '@/features/marketplace/components/filter-dialog';
import { PromoCarousel } from '@/features/marketplace/components/promo-carousel';
import { SearchForm } from '@/features/marketplace/components/search-form';
import { useMarketplace } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type MobileNavItem =
  | { kind: 'link'; href: string; label: string; icon: LucideIcon }
  | { kind: 'filter'; label: string; icon: LucideIcon };

const MOBILE_NAV: MobileNavItem[] = [
  { kind: 'link', href: '/', label: 'Início', icon: Home },
  { kind: 'filter', label: 'Filtrar', icon: SlidersHorizontal },
  { kind: 'link', href: '/conta/favoritos', label: 'Favoritos', icon: Heart },
  { kind: 'link', href: '/conta', label: 'Conta', icon: UserRound },
];

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href === '/conta') {
    return (
      pathname === '/conta' ||
      (pathname.startsWith('/conta/') && !pathname.startsWith('/conta/favoritos'))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CartLink() {
  const { cart } = useMarketplace();
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <Link
      href="/carrinho"
      className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-accent/10"
      aria-label={count > 0 ? `Carrinho, ${count} itens` : 'Carrinho'}
    >
      <ShoppingBag className="size-5" />
      {count > 0 ? (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  );
}

function BrandLink() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <Image
        src="/enterprise-logo-icon.png"
        alt=""
        width={36}
        height={36}
        priority
        className="size-9 object-contain"
      />
      <span className="sr-only md:not-sr-only md:leading-tight">
        <span className="md:block md:text-sm md:font-semibold">Gescom</span>
        <span className="md:block md:text-[11px] md:text-muted-foreground">Marketplace</span>
      </span>
    </Link>
  );
}

function HeaderSearch() {
  return (
    <Suspense fallback={<SearchForm />}>
      <HeaderSearchQuery />
    </Suspense>
  );
}

function HeaderSearchQuery() {
  const params = useSearchParams();
  return <SearchForm defaultQuery={params.get('q') ?? ''} />;
}

function AccountActions() {
  const { user } = useMarketplace();

  if (user) {
    return (
      <Button
        asChild
        variant="outline"
        size="icon"
        className="size-10 rounded-full"
        tooltip={false}
      >
        <Link href="/conta" aria-label="Conta">
          <UserRound />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="outline" className="h-10 rounded-full px-4" tooltip={false}>
        <Link href="/entrar">Entrar</Link>
      </Button>
      <Button asChild className="h-10 rounded-full px-4" tooltip={false}>
        <Link href="/cadastro">Criar conta</Link>
      </Button>
    </>
  );
}

function MobileNav({
  pathname,
  filtersOpen,
  onOpenFilters,
}: {
  pathname: string;
  filtersOpen: boolean;
  onOpenFilters: () => void;
}) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-14 w-full grid-cols-4">
        {MOBILE_NAV.map((item) =>
          item.kind === 'filter' ? (
            <li key={item.label}>
              <FilterNavButton expanded={filtersOpen} onClick={onOpenFilters} />
            </li>
          ) : (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href, pathname) ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                  isActive(item.href, pathname) ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

function FilterNavButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <Suspense fallback={<FilterNavButtonView expanded={expanded} count={0} onClick={onClick} />}>
      <FilterNavButtonQuery expanded={expanded} onClick={onClick} />
    </Suspense>
  );
}

function FilterNavButtonQuery({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  const params = useSearchParams();
  return (
    <FilterNavButtonView
      expanded={expanded}
      count={countActiveFilters(readFilters(params))}
      onClick={onClick}
    />
  );
}

function FilterNavButtonView({
  expanded,
  count,
  onClick,
}: {
  expanded: boolean;
  count: number;
  onClick: () => void;
}) {
  const label =
    count > 0 ? `Filtrar, ${count} ${count === 1 ? 'filtro ativo' : 'filtros ativos'}` : 'Filtrar';

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
        expanded ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <span className="relative">
        <SlidersHorizontal className="size-5" aria-hidden />
        {count > 0 ? (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count}
          </span>
        ) : null}
      </span>
      Filtrar
    </button>
  );
}

function StoreChrome({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lockUntil = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden((current) => {
        if (!current && y > 48) {
          lockUntil = performance.now() + 400;
          return true;
        }
        if (current && y < 8 && performance.now() > lockUntil) return false;
        return current;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
        hidden ? 'pointer-events-none grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export function StoreShell({
  children,
  mode = 'browse',
  title,
  backHref = '/',
}: {
  children: React.ReactNode;
  mode?: 'browse' | 'focus';
  title?: string;
  backHref?: string;
}) {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    const shell = shellRef.current;
    if (!header || !shell) return;
    const apply = () => {
      shell.style.setProperty('--store-header-h', `${header.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, [mode]);

  return (
    <div ref={shellRef} className="flex min-h-dvh flex-col bg-background text-foreground">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:shadow-card"
      >
        Pular para o conteúdo
      </a>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md"
      >
        {mode === 'focus' ? (
          <div className="mx-auto flex h-14 w-full items-center px-1 md:px-4">
            <Button asChild variant="ghost" size="icon" className="size-11" tooltip={false}>
              <Link href={backHref} aria-label="Voltar">
                <ChevronLeft />
              </Link>
            </Button>
            <p className="flex-1 truncate text-center text-base font-semibold">{title}</p>
            <span className="size-11" aria-hidden />
          </div>
        ) : (
          <>
            <div className="mx-auto flex w-full items-center gap-2 px-3 py-2 md:hidden">
              <BrandLink />
              <div className="min-w-0 flex-1">
                <HeaderSearch />
              </div>
              <CartLink />
            </div>
            <div className="mx-auto hidden min-h-16 w-full items-center gap-3 px-4 md:flex">
              <BrandLink />
              <div className="min-w-0 flex-1">
                <HeaderSearch />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <AccountActions />
                <CartLink />
              </div>
            </div>
          </>
        )}
      </header>
      {mode === 'browse' && pathname === '/' ? (
        <StoreChrome>
          <PromoCarousel />
          <CategoryBar />
        </StoreChrome>
      ) : null}
      <main id="conteudo" className="mx-auto w-full flex-1 px-4 pt-4 pb-8 md:pb-12">
        {children}
      </main>
      <SiteFooter className={footerReserveClass(pathname, mode === 'browse')} />
      {mode === 'browse' ? (
        <MobileNav
          pathname={pathname}
          filtersOpen={filtersOpen}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      ) : null}
      {mode === 'browse' ? (
        <Suspense fallback={null}>
          <FilterDialog open={filtersOpen} onOpenChange={setFiltersOpen} />
        </Suspense>
      ) : null}
    </div>
  );
}
