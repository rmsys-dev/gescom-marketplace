'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useMemo } from 'react';

import { filterCatalog, formatSearchTerm, relatedCategories } from '@/features/marketplace/catalog';
import { EmptyState, SectionHeader } from '@/features/marketplace/components/bits';
import { ProductGrid } from '@/features/marketplace/components/product-card';
import { rememberQuery, useMarketplace } from '@/features/marketplace/store';
import type { CatalogSort, PriceBand, ProductCondition } from '@/features/marketplace/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { Button } from '@/shared/components/ui/button';

export function CatalogView({
  title,
  description,
  categorySlug,
  favoritesOnly = false,
  showRecent = false,
}: {
  title: string;
  description?: string;
  categorySlug?: string;
  favoritesOnly?: boolean;
  showRecent?: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { products, favorites, recentQueries, hydrated } = useMarketplace();

  const q = params.get('q') ?? '';
  const sort = (params.get('ordem') as CatalogSort | null) ?? 'relevancia';
  const price = (params.get('preco') as PriceBand | null) ?? '';
  const condition = (params.get('condicao') as ProductCondition | null) ?? '';
  const freeShipping = params.get('frete') === 'gratis';

  useEffect(() => {
    if (q) rememberQuery(q);
  }, [q]);

  const result = useMemo(
    () =>
      filterCatalog(products, {
        q,
        category: categorySlug,
        sort,
        price,
        condition,
        freeShipping,
        favoritesOnly,
        favoriteIds: favorites,
      }),
    [
      products,
      q,
      categorySlug,
      sort,
      price,
      condition,
      freeShipping,
      favoritesOnly,
      favorites,
    ],
  );

  function write(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) search.delete(key);
      else search.set(key, value);
    }
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const activeFilters =
    Number(sort !== 'relevancia') +
    Number(Boolean(price)) +
    Number(Boolean(condition)) +
    Number(freeShipping);

  const term = formatSearchTerm(q);
  const searching = pathname === '/busca' && term.length > 0;
  const categories = searching ? relatedCategories(result) : [];
  const resultLabel = `${result.length} ${result.length === 1 ? 'resultado' : 'resultados'}`;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        {searching ? (
          <>
            <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-tight">
              <span>{term}</span>
              <span className="text-sm font-normal text-muted-foreground" aria-live="polite">
                {resultLabel}
              </span>
            </h1>
            {categories.length > 0 ? (
              <Breadcrumb aria-label="Categorias relacionadas">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">Início</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {categories.map((category, index) => (
                    <Fragment key={category.slug}>
                      <BreadcrumbSeparator>{index === 0 ? undefined : '·'}</BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`/categoria/${category.slug}`}>{category.name}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </>
        )}
      </header>

      {showRecent && !q && recentQueries.length > 0 ? (
        <div className="space-y-2">
          <SectionHeader title="Buscas recentes" />
          <div
            className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4"
            data-lenis-prevent-touch
          >
            {recentQueries.map((query) => (
              <Link
                key={query}
                href={`/busca?q=${encodeURIComponent(query)}`}
                className="inline-flex h-10 shrink-0 items-center rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground"
              >
                {formatSearchTerm(query)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {searching ? null : (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hydrated || !favoritesOnly
            ? `${result.length} ${result.length === 1 ? 'produto' : 'produtos'}`
            : 'Carregando produtos'}
        </p>
      )}

      {result.length === 0 ? (
        <EmptyState
          icon={Search}
          title={favoritesOnly ? 'Nenhum favorito ainda' : 'Nada encontrado'}
          description={
            favoritesOnly
              ? 'Toque no coração de um produto para guardar aqui neste aparelho.'
              : 'Tente outro termo ou limpe os filtros para ver o catálogo de novo.'
          }
          action={
            activeFilters || q ? (
              <Button
                type="button"
                className="h-12 w-full"
                tooltip={false}
                onClick={() =>
                  write({ q: null, preco: null, condicao: null, frete: null, ordem: null })
                }
              >
                Limpar busca e filtros
              </Button>
            ) : favoritesOnly ? (
              <Button asChild className="h-12 w-full" tooltip={false}>
                <Link href="/busca">Explorar produtos</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <ProductGrid products={result} />
      )}
    </div>
  );
}
