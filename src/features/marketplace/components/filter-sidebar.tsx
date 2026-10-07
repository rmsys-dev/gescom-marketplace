'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type FocusEvent, type KeyboardEvent } from 'react';

import { catalogFacets } from '@/features/marketplace/catalog';
import {
  CATALOG_SORTS,
  countActiveFilters,
  filtersToCatalogQuery,
  readFilters,
} from '@/features/marketplace/filters';
import { formatPriceParam, parseReais } from '@/features/marketplace/money';
import type { CatalogQuery, CatalogSort, Product } from '@/features/marketplace/types';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/lib/utils';

const CLEAR_PATCH = {
  ordem: null,
  preco: null,
  min: null,
  max: null,
  condicao: null,
  frete: null,
  oferta: null,
};

function listingHref(
  pathname: string,
  params: URLSearchParams,
  patch: Record<string, string | null>,
  category?: string | null,
) {
  const search = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (!value) search.delete(key);
    else search.set(key, value);
  }

  let path = pathname;
  if (typeof category === 'string') path = `/categoria/${category}`;
  else if (category === null) {
    path = pathname.startsWith('/conta/') ? '/conta/favoritos' : search.get('q') ? '/busca' : '/';
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function priceDraft(value: string) {
  const cleaned = value.replace(/[^\d,]/g, '');
  const [whole = '', ...fractions] = cleaned.split(',');
  if (fractions.length === 0) return whole;
  return `${whole},${fractions.join('').slice(0, 2)}`;
}

function rangeParams(low: string, high: string) {
  let min = parseReais(low);
  let max = parseReais(high);
  if (min != null && max != null && min > max) {
    const swap = min;
    min = max;
    max = swap;
  }
  return {
    min: min != null ? formatPriceParam(min) : null,
    max: max != null ? formatPriceParam(max) : null,
  };
}

export function ListingFrame({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:items-start md:gap-6">
      {sidebar}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function FilterSidebar({
  products,
  heading,
  scope,
  countLabel,
}: {
  products: Product[];
  heading: string;
  scope?: Pick<CatalogQuery, 'q' | 'category' | 'favoritesOnly' | 'favoriteIds'>;
  countLabel?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const filters = readFilters(params);
  const query: CatalogQuery = { ...scope, ...filtersToCatalogQuery(filters) };
  const facets = catalogFacets(products, query);
  const href = (patch: Record<string, string | null>, category?: string | null) =>
    listingHref(pathname, params, patch, category);
  const rangeActive = filters.priceMin != null || filters.priceMax != null;
  const sort = filters.sort;
  const totalText =
    countLabel ??
    `${facets.total.toLocaleString('pt-BR')} ${facets.total === 1 ? 'produto' : 'produtos'}`;

  function commitRange(min: string | null, max: string | null) {
    const currentMin = filters.priceMin != null ? formatPriceParam(filters.priceMin) : null;
    const currentMax = filters.priceMax != null ? formatPriceParam(filters.priceMax) : null;
    if (min === currentMin && max === currentMax) return;
    router.replace(href({ preco: null, min, max }), { scroll: false });
  }

  return (
    <aside
      aria-label="Filtros"
      className="sticky top-[calc(var(--store-header-h,4.5rem)+0.75rem)] hidden h-[calc(100dvh-var(--store-header-h,4.5rem)-1.5rem)] w-60 min-w-60 max-w-60 shrink-0 overflow-x-hidden overflow-y-auto overscroll-contain py-0.5 pr-1 md:block"
      data-lenis-prevent
    >
      <div className="w-full min-w-0 space-y-4 overflow-x-clip">
        <header>
          <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {totalText}
          </p>
          {countActiveFilters(filters) > 0 ? (
            <Link
              href={href(CLEAR_PATCH)}
              replace
              scroll={false}
              className="mt-1 inline-block rounded-sm text-sm text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Limpar filtros
            </Link>
          ) : null}
        </header>

        <div className="flex min-w-0 items-center justify-between gap-3 overflow-x-clip bg-success/10 p-4 rounded-2xl">
          <label htmlFor="filtro-frete" className="min-w-0 cursor-pointer">
            <span className="block text-sm leading-tight font-bold text-success">Frete grátis</span>
            <span className="block text-xs leading-snug text-muted-foreground">
              Ver produtos com frete grátis
            </span>
          </label>
          <Switch
            id="filtro-frete"
            checked={filters.freeShipping}
            onCheckedChange={(checked) => {
              router.replace(href({ frete: checked ? 'gratis' : null }), { scroll: false });
            }}
          />
        </div>

        {facets.onSale > 0 || filters.onSale ? (
          <FilterSection title="Tipo de promoção">
            <ul>
              <li>
                <FilterLink
                  href={href({ oferta: filters.onSale ? null : '1' })}
                  active={filters.onSale}
                  pathname={pathname}
                >
                  Em oferta ({facets.onSale.toLocaleString('pt-BR')})
                </FilterLink>
              </li>
            </ul>
          </FilterSection>
        ) : null}

        {!scope?.favoritesOnly && facets.categories.length > 0 ? (
          <FilterSection title="Categorias">
            <ul>
              {facets.categories.map((category) => {
                const active = query.category === category.slug;
                return (
                  <li key={category.slug}>
                    <FilterLink
                      href={href({}, active ? null : category.slug)}
                      active={active}
                      pathname={pathname}
                    >
                      {category.name} ({category.count.toLocaleString('pt-BR')})
                    </FilterLink>
                  </li>
                );
              })}
            </ul>
          </FilterSection>
        ) : null}

        <FilterSection title="Preço">
          {facets.prices.length > 0 ? (
            <ul>
              {facets.prices.map((band) => {
                const active = !rangeActive && filters.price === band.id;
                return (
                  <li key={band.id}>
                    <FilterLink
                      href={href({
                        preco: active ? null : band.id,
                        min: null,
                        max: null,
                      })}
                      active={active}
                      pathname={pathname}
                    >
                      {band.label} ({band.count.toLocaleString('pt-BR')})
                    </FilterLink>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <PriceRangeFields
            min={filters.priceMin != null ? formatPriceParam(filters.priceMin) : ''}
            max={filters.priceMax != null ? formatPriceParam(filters.priceMax) : ''}
            onCommit={commitRange}
          />
        </FilterSection>

        {facets.conditions.length > 0 ? (
          <FilterSection title="Condição">
            <ul>
              {facets.conditions.map((item) => {
                const active = filters.condition === item.id;
                return (
                  <li key={item.id}>
                    <FilterLink
                      href={href({ condicao: active ? null : item.id })}
                      active={active}
                      pathname={pathname}
                    >
                      {item.label} ({item.count.toLocaleString('pt-BR')})
                    </FilterLink>
                  </li>
                );
              })}
            </ul>
          </FilterSection>
        ) : null}

        {facets.freeShipping > 0 || filters.freeShipping ? (
          <FilterSection title="Custo de envio">
            <ul>
              <li>
                <FilterLink
                  href={href({ frete: filters.freeShipping ? null : 'gratis' })}
                  active={filters.freeShipping}
                  pathname={pathname}
                >
                  Grátis ({facets.freeShipping.toLocaleString('pt-BR')})
                </FilterLink>
              </li>
            </ul>
          </FilterSection>
        ) : null}

        <FilterSection title="Ordenar por">
          <ul>
            {CATALOG_SORTS.map((item) => (
              <li key={item.id}>
                <FilterLink
                  href={sortHref(href, sort, item.id)}
                  active={sort === item.id}
                  pathname={pathname}
                >
                  {item.label}
                </FilterLink>
              </li>
            ))}
          </ul>
        </FilterSection>
      </div>
    </aside >
  );
}

function sortHref(
  href: (patch: Record<string, string | null>) => string,
  current: CatalogSort,
  next: CatalogSort,
) {
  return href({ ordem: next === 'relevancia' || current === next ? null : next });
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function FilterLink({
  href,
  active = false,
  pathname,
  children,
}: {
  href: string;
  active?: boolean;
  pathname: string;
  children: React.ReactNode;
}) {
  const path = href.split('?')[0] ?? href;
  const samePage = path === pathname;

  return (
    <Link
      href={href}
      replace={samePage}
      scroll={!samePage}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'block w-fit max-w-full rounded-sm text-sm leading-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary hover:font-bold',
      )}
    >
      {children}
      {active ? <span className="sr-only">, selecionado</span> : null}
    </Link>
  );
}

function PriceRangeFields({
  min,
  max,
  onCommit,
}: {
  min: string;
  max: string;
  onCommit: (min: string | null, max: string | null) => void;
}) {
  const [low, setLow] = useState(min);
  const [high, setHigh] = useState(max);
  const token = `${min}\n${max}`;
  const [seen, setSeen] = useState(token);

  if (seen !== token) {
    setSeen(token);
    setLow(min);
    setHigh(max);
  }

  function commitForm(form: HTMLFormElement) {
    const minField = form.elements.namedItem('min');
    const maxField = form.elements.namedItem('max');
    const next = rangeParams(
      minField instanceof HTMLInputElement ? minField.value : low,
      maxField instanceof HTMLInputElement ? maxField.value : high,
    );
    onCommit(next.min, next.max);
  }

  function leaveField(event: FocusEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const next = event.relatedTarget;
    if (next instanceof Node && form.contains(next)) return;
    commitForm(form);
  }

  return (
    <form
      className="grid grid-cols-2 gap-2 pt-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        commitForm(event.currentTarget);
      }}
    >
      <Input
        name="min"
        value={low}
        onChange={(event) => setLow(priceDraft(event.target.value))}
        onBlur={leaveField}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          const form = event.currentTarget.form;
          if (form) commitForm(form);
        }}
        inputMode="numeric"
        autoComplete="off"
        placeholder="R$ Mínimo"
        aria-label="Preço mínimo"
        maxLength={12}
        className="h-9 rounded-lg bg-card px-2.5 text-sm"
      />
      <Input
        name="max"
        value={high}
        onChange={(event) => setHigh(priceDraft(event.target.value))}
        onBlur={leaveField}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          const form = event.currentTarget.form;
          if (form) commitForm(form);
        }}
        inputMode="numeric"
        autoComplete="off"
        placeholder="R$ Máximo"
        aria-label="Preço máximo"
        maxLength={12}
        className="h-9 rounded-lg bg-card px-2.5 text-sm"
      />
    </form>
  );
}
