import { Search } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export function SearchForm({
  defaultQuery = '',
  className,
}: {
  defaultQuery?: string;
  className?: string;
}) {
  return (
    <form action="/busca" method="get" className={cn('relative min-w-0', className)} role="search">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        key={defaultQuery}
        name="q"
        defaultValue={defaultQuery}
        placeholder="Estou buscando..."
        enterKeyHint="search"
        autoComplete="off"
        aria-label="Buscar no marketplace"
        className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      />
    </form>
  );
}
