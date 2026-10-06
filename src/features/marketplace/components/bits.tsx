import type { LucideIcon } from 'lucide-react';
import { Star } from 'lucide-react';
import Link from 'next/link';

import { discountPercent, formatBRL, installmentLabel } from '@/features/marketplace/money';
import type { OrderStatus } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export const controlClass =
  'h-12 w-full rounded-xl border border-input bg-card px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmado: 'Confirmado',
  preparando: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  confirmado: 'bg-info/12 text-info',
  preparando: 'bg-warning/15 text-warning',
  enviado: 'bg-primary/10 text-primary',
  entregue: 'bg-success/12 text-success',
};

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(iso));
}

export function Price({
  cents,
  compareAt,
  size = 'md',
}: {
  cents: number;
  compareAt?: number | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const discount = discountPercent(cents, compareAt ?? null);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        className={cn(
          'font-semibold tracking-tight text-foreground',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-2xl',
        )}
      >
        {formatBRL(cents)}
      </span>
      {compareAt && compareAt > cents ? (
        <span className="text-xs text-muted-foreground line-through">{formatBRL(compareAt)}</span>
      ) : null}
      {discount ? (
        <span className="rounded-md bg-success/12 px-1.5 py-0.5 text-[11px] font-semibold text-success">
          -{discount}%
        </span>
      ) : null}
    </div>
  );
}

export function Installments({ cents }: { cents: number }) {
  const label = installmentLabel(cents);
  if (!label) return null;
  return <p className="text-xs text-muted-foreground">{label}</p>;
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      <span className="font-medium text-foreground">{rating.toFixed(1).replace('.', ',')}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SectionHeader({
  title,
  href,
  action = 'Ver tudo',
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {href ? (
        <Link href={href} className="text-sm font-medium text-primary">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-6 w-full max-w-xs">{action}</div> : null}
    </div>
  );
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex h-11 items-center rounded-xl border border-border bg-red-500"
      role="group"
      aria-label={label}
    >
      <Button
        type="button"
        variant="ghost"
        tooltip={false}
        className="size-11 rounded-xl"
        aria-label="Diminuir quantidade"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </Button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        tooltip={false}
        className="size-11 rounded-xl"
        aria-label="Aumentar quantidade"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:items-start md:gap-6">
      <div className="hidden space-y-3 md:block" aria-hidden>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <ul
      className="scrollbar-none -mx-4 flex gap-3 overflow-hidden px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:px-0 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      aria-hidden
    >
      {Array.from({ length: 6 }, (_, index) => (
        <li
          key={index}
          className="w-[min(78vw,18.5rem)] shrink-0 min-[480px]:w-[min(46vw,18.5rem)] md:w-auto"
        >
          <div className="space-y-2 rounded-2xl bg-card p-2 shadow-card ring-1 ring-border">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-6 w-2/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FullButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button size="xl" className="w-full" tooltip={false} {...props}>
      {children}
    </Button>
  );
}
