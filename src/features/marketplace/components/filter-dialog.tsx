'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import type { CatalogSort, PriceBand, ProductCondition } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';

const SORTS: { id: CatalogSort; label: string }[] = [
  { id: 'relevancia', label: 'Relevância' },
  { id: 'menor-preco', label: 'Menor preço' },
  { id: 'maior-preco', label: 'Maior preço' },
  { id: 'avaliacao', label: 'Avaliação' },
];

const PRICES: { id: PriceBand; label: string }[] = [
  { id: 'ate-50', label: 'Até R$ 50' },
  { id: '50-150', label: 'R$ 50 a R$ 150' },
  { id: '150-400', label: 'R$ 150 a R$ 400' },
  { id: '400-mais', label: 'Acima de R$ 400' },
];

type FilterDraft = {
  sort: CatalogSort;
  price: PriceBand;
  condition: ProductCondition | '';
  freeShipping: boolean;
};

const EMPTY_FILTERS: FilterDraft = {
  sort: 'relevancia',
  price: '',
  condition: '',
  freeShipping: false,
};

function isCatalogPath(pathname: string) {
  return (
    pathname === '/busca' ||
    pathname.startsWith('/categoria/') ||
    pathname === '/conta/favoritos'
  );
}

export function readFilters(params: { get(name: string): string | null }): FilterDraft {
  const sort = params.get('ordem');
  const price = params.get('preco');
  return {
    sort:
      sort === 'menor-preco' || sort === 'maior-preco' || sort === 'avaliacao'
        ? sort
        : 'relevancia',
    price:
      price === 'ate-50' || price === '50-150' || price === '150-400' || price === '400-mais'
        ? price
        : '',
    condition:
      params.get('condicao') === 'usado'
        ? 'usado'
        : params.get('condicao') === 'novo'
          ? 'novo'
          : '',
    freeShipping: params.get('frete') === 'gratis',
  };
}

export function countActiveFilters(filters: FilterDraft) {
  return (
    Number(filters.sort !== 'relevancia') +
    Number(Boolean(filters.price)) +
    Number(Boolean(filters.condition)) +
    Number(filters.freeShipping)
  );
}

export function FilterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const query = params.toString();
  const [draft, setDraft] = useState<FilterDraft>(() => readFilters(params));
  const [seenOpen, setSeenOpen] = useState(open);

  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) setDraft(readFilters(new URLSearchParams(query)));
  }

  function commit(next: FilterDraft) {
    const search = new URLSearchParams(params.toString());
    const entries: Record<string, string | null> = {
      ordem: next.sort === 'relevancia' ? null : next.sort,
      preco: next.price || null,
      condicao: next.condition || null,
      frete: next.freeShipping ? 'gratis' : null,
    };
    for (const [key, value] of Object.entries(entries)) {
      if (!value) search.delete(key);
      else search.set(key, value);
    }
    const query = search.toString();
    const target = isCatalogPath(pathname) ? pathname : '/busca';
    const href = query ? `${target}?${query}` : target;
    if (!isCatalogPath(pathname) && countActiveFilters(next) === 0) {
      onOpenChange(false);
      return;
    }
    if (target === pathname) router.replace(href, { scroll: false });
    else router.push(href);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-auto right-0 bottom-0 left-0 flex max-h-[85dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none rounded-t-3xl p-0 sm:right-auto sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 data-open:zoom-in-100 data-open:slide-in-from-bottom data-closed:zoom-out-100 data-closed:slide-out-to-bottom"
        overlayClassName="bg-foreground/40"
      >
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <DialogHeader className="px-4 pt-3 pb-1 text-left">
          <DialogTitle>Filtros</DialogTitle>
          <DialogDescription>Escolha ordenação, preço, condição e frete.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 py-3">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Ordenar</legend>
            <div className="grid grid-cols-2 gap-2">
              {SORTS.map((item) => (
                <Choice
                  key={item.id}
                  pressed={draft.sort === item.id}
                  onClick={() => setDraft((current) => ({ ...current, sort: item.id }))}
                >
                  {item.label}
                </Choice>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Preço</legend>
            <div className="grid grid-cols-2 gap-2">
              {PRICES.map((item) => (
                <Choice
                  key={item.id}
                  pressed={draft.price === item.id}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      price: current.price === item.id ? '' : item.id,
                    }))
                  }
                >
                  {item.label}
                </Choice>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Condição</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['novo', 'Novo'],
                  ['usado', 'Usado'],
                ] as const
              ).map(([id, label]) => (
                <Choice
                  key={id}
                  pressed={draft.condition === id}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      condition: current.condition === id ? '' : id,
                    }))
                  }
                >
                  {label}
                </Choice>
              ))}
            </div>
          </fieldset>
          <Choice
            pressed={draft.freeShipping}
            onClick={() =>
              setDraft((current) => ({ ...current, freeShipping: !current.freeShipping }))
            }
          >
            Só com frete grátis
          </Choice>
        </div>
        <DialogFooter className="flex-row border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1"
            tooltip={false}
            onClick={() => commit(EMPTY_FILTERS)}
          >
            Limpar
          </Button>
          <Button
            type="button"
            className="h-12 flex-1"
            tooltip={false}
            onClick={() => commit(draft)}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Choice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-xl px-3 text-sm font-medium',
        pressed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
      )}
    >
      {children}
    </button>
  );
}
