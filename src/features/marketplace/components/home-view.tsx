'use client';

import { ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';
import { useLenis } from 'lenis/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  countInCategory,
  countInSubcategory,
  filterCatalog,
  isOnSale,
  paginate,
} from '@/features/marketplace/catalog';
import { EmptyState, SectionHeader } from '@/features/marketplace/components/bits';
import { CATEGORY_ICONS } from '@/features/marketplace/components/category-bar';
import { FilterSidebar, ListingFrame } from '@/features/marketplace/components/filter-sidebar';
import { ProductGrid } from '@/features/marketplace/components/product-card';
import {
  countActiveFilters,
  filtersToCatalogQuery,
  readFilters,
} from '@/features/marketplace/filters';
import { useMarketplace } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/components/ui/skeleton';

const CATALOG_PAGE_QUERIES = [
  { query: '(min-width: 96rem)', size: 10 },
  { query: '(min-width: 80rem)', size: 8 },
  { query: '(min-width: 64rem)', size: 6 },
  { query: '(min-width: 48rem)', size: 6 },
] as const;

function useCatalogPageSize() {
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    const media = CATALOG_PAGE_QUERIES.map((entry) => ({
      list: window.matchMedia(entry.query),
      size: entry.size,
    }));

    const apply = () => {
      const match = media.find((entry) => entry.list.matches);
      setPageSize(match?.size ?? 6);
    };

    apply();
    for (const entry of media) entry.list.addEventListener('change', apply);
    return () => {
      for (const entry of media) entry.list.removeEventListener('change', apply);
    };
  }, []);

  return pageSize;
}

function pageItems(current: number, total: number) {
  const visible = new Set(
    [1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total),
  );
  const items: Array<number | 'gap'> = [];

  for (const page of [...visible].sort((a, b) => a - b)) {
    const previous = items.at(-1);
    if (typeof previous === 'number' && page - previous > 1) items.push('gap');
    items.push(page);
  }

  return items;
}

function CatalogPager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Paginação de todos os produtos"
      className="flex items-center justify-between gap-2 md:justify-end"
    >
      <Button
        type="button"
        variant="secondary"
        tooltip={false}
        className="h-11 rounded-xl px-3"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      <p className="text-sm font-medium tabular-nums md:hidden">
        {page} / {pages}
      </p>
      <ol className="hidden items-center gap-1 md:flex">
        {pageItems(page, pages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-sm text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                type="button"
                variant={item === page ? 'default' : 'secondary'}
                tooltip={false}
                className={cn('size-11 rounded-xl px-0', item === page && 'pointer-events-none')}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPage(item)}
              >
                {item}
              </Button>
            </li>
          ),
        )}
      </ol>

      <Button
        type="button"
        variant="secondary"
        tooltip={false}
        className="h-11 rounded-xl px-3"
        aria-label="Próxima página"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight />
      </Button>
    </nav>
  );
}

export function HomeView() {
  const { products, catalogReady, catalogError } = useMarketplace();
  const params = useSearchParams();
  const lenis = useLenis();
  const catalogRef = useRef<HTMLElement>(null);
  const pageSize = useCatalogPageSize();
  const [page, setPage] = useState(1);
  const filterKey = params.toString();
  const [filterSeen, setFilterSeen] = useState(filterKey);
  const filters = useMemo(() => readFilters(new URLSearchParams(filterKey)), [filterKey]);
  const filtering = countActiveFilters(filters) > 0;
  const available = useMemo(() => products.filter((product) => product.stock > 0), [products]);
  const filtered = useMemo(
    () => filterCatalog(available, filtersToCatalogQuery(filters)),
    [available, filters],
  );
  const offers = available
    .filter((product) => isOnSale(product) || product.featured)
    .slice(0, 4);
  const freeShipping = available.filter((product) => product.freeShipping).slice(0, 4);
  const rated = [...available]
    .sort((a, b) => b.rating - a.rating || Number(b.featured) - Number(a.featured))
    .slice(0, 4);
  const pageForList = filterSeen === filterKey ? page : 1;
  const catalog = paginate(filtering ? filtered : available, pageForList, pageSize);

  if (filterSeen !== filterKey) {
    setFilterSeen(filterKey);
    setPage(1);
  } else if (catalog.page !== page) setPage(catalog.page);

  function changePage(next: number) {
    setPage(next);
    const node = catalogRef.current;
    if (!node) return;
    const header =
      Number.parseFloat(getComputedStyle(node).getPropertyValue('--store-header-h')) || 72;
    if (lenis) {
      lenis.scrollTo(node, { offset: -(header + 12) });
      return;
    }
    const top = node.getBoundingClientRect().top + window.scrollY - header - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  if (!catalogReady) {
    return (
      <ListingFrame sidebar={<FilterSidebar products={[]} heading="Menu de filtros" />}>
        <div className="space-y-4" aria-busy aria-label="Carregando catálogo">
          <Skeleton className="h-7 w-40" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      </ListingFrame>
    );
  }

  if (catalogError && products.length === 0) {
    return (
      <ListingFrame sidebar={<FilterSidebar products={[]} heading="Menu de filtros" />}>
        <EmptyState
          icon={Search}
          title="Catálogo indisponível"
          description={catalogError}
        />
      </ListingFrame>
    );
  }

  return (
    <ListingFrame sidebar={<FilterSidebar products={available} heading="Menu de filtros" />}>
      {filtering && filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nada encontrado"
          description="Limpe os filtros para ver o catálogo de novo."
          action={
            <Button asChild className="h-12 w-full" tooltip={false}>
              <Link href="/">Limpar filtros</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {filtering ? null : (
            <>
              {offers.length > 0 ? (
                <section className="space-y-3">
                  <SectionHeader title="Ofertas" href="/busca?oferta=1" />
                  <ProductGrid products={offers} fit="aside" />
                </section>
              ) : null}

              {freeShipping.length > 0 ? (
                <section className="space-y-3">
                  <SectionHeader title="Frete grátis" href="/busca?frete=gratis" />
                  <ProductGrid products={freeShipping} fit="aside" />
                </section>
              ) : null}

              {rated.some((product) => product.rating > 0) ? (
                <section className="space-y-3">
                  <SectionHeader title="Bem avaliados" href="/busca?ordem=avaliacao" />
                  <ProductGrid products={rated} fit="aside" />
                </section>
              ) : null}
            </>
          )}

          <section
            ref={catalogRef}
            className="scroll-mt-[calc(var(--store-header-h,4.5rem)+0.75rem)] space-y-3"
            aria-labelledby="todos-os-produtos"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="todos-os-produtos" className="text-lg font-semibold tracking-tight">
                Todos os produtos
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
                {catalog.total === 0
                  ? 'Nenhum disponível'
                  : `${catalog.from}–${catalog.to} de ${catalog.total}`}
              </p>
            </div>
            <ProductGrid products={catalog.items} layout="catalog" fit="aside" />
            <CatalogPager page={catalog.page} pages={catalog.pages} onPage={changePage} />
          </section>
        </div>
      )}
    </ListingFrame>
  );
}

export function CategoriesView() {
  const { products, categories, catalogReady } = useMarketplace();

  if (!catalogReady) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-busy>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="min-h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-sm text-muted-foreground">Escolha um grupo para ver os anúncios.</p>
      </header>
      {categories.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma categoria"
          description="Publique produtos com grupo no ERP para listá-los aqui."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
            return (
              <li key={category.slug}>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="flex min-h-32 flex-col justify-between rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <Icon className="size-6 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {countInCategory(category.slug, products)} produtos
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SubcategoriesView() {
  const { products, subcategories, catalogReady } = useMarketplace();

  if (!catalogReady) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-busy>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="min-h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sub-categorias</h1>
        <p className="text-sm text-muted-foreground">Escolha um subgrupo para ver os anúncios.</p>
      </header>
      {subcategories.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma sub-categoria"
          description="Publique produtos com subgrupo no ERP para listá-los aqui."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {subcategories.map((subcategory) => {
            const Icon = CATEGORY_ICONS[subcategory.slug] ?? Sparkles;
            return (
              <li key={subcategory.slug}>
                <Link
                  href={`/subcategoria/${subcategory.slug}`}
                  className="flex min-h-32 flex-col justify-between rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <Icon className="size-6 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">{subcategory.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {countInSubcategory(subcategory.slug, products)} produtos
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
