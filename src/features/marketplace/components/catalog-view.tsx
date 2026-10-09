'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useMemo } from 'react';

import {
  filterCatalog,
  formatSearchTerm,
  relatedCategories,
  relatedSubcategories,
} from '@/features/marketplace/catalog';
import { EmptyState, SectionHeader } from '@/features/marketplace/components/bits';
import { FilterSidebar, ListingFrame } from '@/features/marketplace/components/filter-sidebar';
import { ProductGrid } from '@/features/marketplace/components/product-card';
import {
  countActiveFilters,
  filtersToCatalogQuery,
  readFilters,
} from '@/features/marketplace/filters';
import { rememberQuery, useMarketplace } from '@/features/marketplace/store';
import type { CatalogQuery } from '@/features/marketplace/types';
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
  subcategorySlug,
  favoritesOnly = false,
  showRecent = false,
}: {
  title: string;
  description?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  favoritesOnly?: boolean;
  showRecent?: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { products, favorites, recentQueries, hydrated, catalogReady, catalogError } =
    useMarketplace();

  const q = params.get('q') ?? '';
  const filterKey = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(filterKey)), [filterKey]);

  useEffect(() => {
    if (q) rememberQuery(q);
  }, [q]);

  const query = useMemo<CatalogQuery>(
    () => ({
      q,
      category: categorySlug,
      subcategory: subcategorySlug,
      favoritesOnly,
      favoriteIds: favorites,
      ...(favoritesOnly ? {} : filtersToCatalogQuery(filters)),
    }),
    [q, categorySlug, subcategorySlug, favoritesOnly, favorites, filters],
  );
  const result = useMemo(() => filterCatalog(products, query), [products, query]);

  function write(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) search.delete(key);
      else search.set(key, value);
    }
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const activeFilters = favoritesOnly ? 0 : countActiveFilters(filters);

  const term = formatSearchTerm(q);
  const searching = pathname === '/busca' && term.length > 0;
  const categories = searching ? relatedCategories(result) : [];
  const subcategories = searching ? relatedSubcategories(result) : [];
  const resultLabel = `${result.length} ${result.length === 1 ? 'resultado' : 'resultados'}`;
  const scopedHeading = categorySlug || subcategorySlug ? title : 'Todas';
  const listingScope = {
    q,
    category: categorySlug,
    subcategory: subcategorySlug,
    favoritesOnly,
    favoriteIds: favorites,
  };

  if (!catalogReady) {
    const loading = (
      <EmptyState
        icon={Search}
        title="Carregando catálogo"
        description="Buscando produtos publicados na loja."
      />
    );
    if (favoritesOnly) return loading;
    return (
      <ListingFrame
        sidebar={
          <FilterSidebar products={[]} heading={scopedHeading} scope={listingScope} />
        }
      >
        {loading}
      </ListingFrame>
    );
  }

  if (catalogError && products.length === 0) {
    return (
      <EmptyState icon={Search} title="Catálogo indisponível" description={catalogError} />
    );
  }

  const listing = (
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
            {categories.length > 0 || subcategories.length > 0 ? (
              <Breadcrumb aria-label="Categorias relacionadas">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">Início</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {categories.map((category, index) => (
                    <Fragment key={`cat-${category.slug}`}>
                      <BreadcrumbSeparator>{index === 0 ? undefined : '·'}</BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`/categoria/${category.slug}`}>{category.name}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                  {subcategories.map((subcategory, index) => (
                    <Fragment key={`sub-${subcategory.slug}`}>
                      <BreadcrumbSeparator>
                        {categories.length === 0 && index === 0 ? undefined : '·'}
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`/subcategoria/${subcategory.slug}`}>
                            {subcategory.name}
                          </Link>
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
            <h1
              className={
                favoritesOnly
                  ? 'hidden text-2xl font-semibold tracking-tight md:block'
                  : 'text-2xl font-semibold tracking-tight'
              }
            >
              {title}
            </h1>
            {description ? (
              <p
                className={
                  favoritesOnly
                    ? 'hidden text-sm text-muted-foreground md:block'
                    : 'text-sm text-muted-foreground'
                }
              >
                {description}
              </p>
            ) : null}
          </>
        )}
      </header>

      {showRecent && !q && recentQueries.length > 0 ? (
        <div className="space-y-2">
          <SectionHeader title="Buscas recentes" />
          <div
            className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
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
        <p className="text-sm text-muted-foreground md:hidden" aria-live="polite">
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
                  write({
                    q: null,
                    preco: null,
                    min: null,
                    max: null,
                    condicao: null,
                    frete: null,
                    ordem: null,
                    oferta: null,
                  })
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
        <ProductGrid products={result} fit={favoritesOnly ? 'page' : 'aside'} />
      )}
    </div>
  );

  if (favoritesOnly) return listing;

  return (
    <ListingFrame
      sidebar={
        <FilterSidebar
          products={products}
          heading={scopedHeading}
          scope={listingScope}
        />
      }
    >
      {listing}
    </ListingFrame>
  );
}
