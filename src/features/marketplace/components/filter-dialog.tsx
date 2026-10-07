'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  CATALOG_SORTS,
  countActiveFilters,
  EMPTY_FILTERS,
  filterPatch,
  PRICE_BANDS,
  readFilters,
  type FilterDraft,
} from '@/features/marketplace/filters';
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

function isCatalogPath(pathname: string) {
  return pathname === '/busca' || pathname.startsWith('/categoria/');
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
    const entries = filterPatch(next);
    for (const [key, value] of Object.entries(entries)) {
      if (!value) search.delete(key);
      else search.set(key, value);
    }
    const nextQuery = search.toString();
    const target = isCatalogPath(pathname) ? pathname : '/busca';
    const href = nextQuery ? `${target}?${nextQuery}` : target;
    if (!isCatalogPath(pathname) && countActiveFilters(next) === 0) {
      if (nextQuery !== query) {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      }
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
        <div className="flex flex-col gap-5 overflow-y-auto px-4 py-3" data-lenis-prevent-touch>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Ordenar</legend>
            <div className="grid grid-cols-2 gap-2">
              {CATALOG_SORTS.map((item) => (
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
              {PRICE_BANDS.map((item) => (
                <Choice
                  key={item.id}
                  pressed={draft.price === item.id}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      price: current.price === item.id ? '' : item.id,
                      priceMin: null,
                      priceMax: null,
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
