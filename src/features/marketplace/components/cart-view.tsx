'use client';

import {
  Check,
  ChevronRight,
  Loader2,
  Share2,
  ShoppingBag,
  TicketPercent,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getCategory, isOnSale, resolveCart } from '@/features/marketplace/catalog';
import { EmptyState, QuantityStepper, SectionHeader } from '@/features/marketplace/components/bits';
import { ProductGrid } from '@/features/marketplace/components/product-card';
import {
  cartTotals,
  discountPercent,
  formatBRL,
  FREE_SHIPPING_FROM,
  STANDARD_SHIPPING,
} from '@/features/marketplace/money';
import {
  removeFromCart,
  restoreCartLine,
  setCheckoutProductIds,
  setQuantity,
  useMarketplace,
} from '@/features/marketplace/store';
import type { Product } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

const COUPONS = [
  {
    code: 'GESCOM10',
    kind: 'percent' as const,
    percent: 10,
    label: '10% no subtotal',
    description: 'Garante 10% de desconto sobre o subtotal dos produtos selecionados.',
  },
  {
    code: 'BEMVINDO',
    kind: 'amount' as const,
    cents: 2_000,
    label: 'R$ 20,00 de desconto',
    description: 'Garante R$ 20,00 de desconto no subtotal deste pedido.',
  },
  {
    code: 'FRETEGRATIS',
    kind: 'shipping' as const,
    label: 'Frete grátis',
    description: 'Garante frete grátis no envio do pedido.',
  },
];

const CHECK_STEPS = ['Conferindo o código', 'Buscando a promoção', 'Reservando o desconto'];

type Coupon = (typeof COUPONS)[number];
type ReadyLine = {
  productId: string;
  quantity: number;
  product: Product;
};
type CheckPhase = 'idle' | 'checking' | 'success' | 'error';

function findCoupon(value: string) {
  const code = value.trim().toLocaleUpperCase('pt-BR');
  return COUPONS.find((item) => item.code === code) ?? null;
}

function couponSavings(coupon: Coupon, saleSubtotal: number, shipping: number) {
  if (coupon.kind === 'percent') {
    return {
      amount: Math.min(saleSubtotal, Math.round((saleSubtotal * coupon.percent) / 100)),
      shipping,
    };
  }
  if (coupon.kind === 'amount') {
    return { amount: Math.min(saleSubtotal, coupon.cents), shipping };
  }
  return { amount: 0, shipping: 0 };
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function stockLabel(stock: number) {
  if (stock > 50) return '+50 disponíveis';
  if (stock === 1) return '1 disponível';
  return `${stock} disponíveis`;
}

function Brl({ cents, className }: { cents: number; className?: string }) {
  const absolute = Math.abs(Math.trunc(cents));
  const reais = Math.trunc(absolute / 100).toLocaleString('pt-BR');
  const fraction = String(absolute % 100).padStart(2, '0');

  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      <span className="sr-only">{formatBRL(absolute)}</span>
      <span aria-hidden>
        R$ {reais}
        <span className="align-super text-[0.65em]">,{fraction}</span>
      </span>
    </span>
  );
}

function CartCheckbox({
  checked,
  indeterminate = false,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      aria-label={label}
      onChange={(event) => onCheckedChange(event.target.checked)}
      className="size-4.5 shrink-0 cursor-pointer rounded-sm accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    />
  );
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  const instant = active && (target <= 0 || prefersReducedMotion());

  useEffect(() => {
    if (!active || instant) return;

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, instant, target]);

  if (!active) return 0;
  if (instant) return target;
  return value;
}

function CouponDialog({
  open,
  quote,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  quote: (coupon: Coupon) => { cents: number; detail: string };
  onOpenChange: (open: boolean) => void;
  onApply: (coupon: Coupon) => void;
}) {
  const inputId = useId();
  const errorId = useId();
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<CheckPhase>('idle');
  const [step, setStep] = useState(0);
  const [shake, setShake] = useState(false);
  const [resolved, setResolved] = useState<Coupon | null>(null);
  const codeRef = useRef('');
  const applied = useRef(false);
  const quoted = resolved ? quote(resolved) : null;
  const counted = useCountUp(quoted?.cents ?? 0, phase === 'success');
  const progress =
    phase === 'success' || phase === 'error'
      ? 100
      : phase === 'checking'
        ? ((step + 1) / CHECK_STEPS.length) * 100
        : 0;

  function finishCheck() {
    const coupon = findCoupon(codeRef.current);
    if (!coupon) {
      setStep(CHECK_STEPS.length - 1);
      setPhase('error');
      setShake(true);
      return;
    }
    setResolved(coupon);
    setPhase('success');
  }

  useEffect(() => {
    if (!open || phase !== 'checking') return;
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      if (current >= CHECK_STEPS.length) {
        window.clearInterval(timer);
        finishCheck();
        return;
      }
      setStep(current);
    }, 620);
    return () => window.clearInterval(timer);
  }, [open, phase]);

  useEffect(() => {
    if (!open || phase !== 'success' || !resolved) return;
    const timer = window.setTimeout(
      () => {
        if (applied.current) return;
        applied.current = true;
        onApply(resolved);
        onOpenChange(false);
      },
      prefersReducedMotion() ? 0 : 1300,
    );
    return () => window.clearTimeout(timer);
  }, [open, phase, resolved, onApply, onOpenChange]);

  function handleOpenChange(next: boolean) {
    if (!next && phase === 'success' && resolved && !applied.current) {
      applied.current = true;
      onApply(resolved);
    }
    onOpenChange(next);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim() || phase === 'checking' || phase === 'success') return;
    codeRef.current = code;
    setShake(false);
    if (prefersReducedMotion()) {
      finishCheck();
      return;
    }
    setStep(0);
    setPhase('checking');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(40rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {phase === 'success' ? 'Cupom aplicado' : 'Inserir código do cupom'}
          </DialogTitle>
          {phase === 'success' ? null : (
            <DialogDescription>
              Digite um código ou escolha um cupom disponível.
            </DialogDescription>
          )}
        </DialogHeader>

        {phase === 'success' && resolved && quoted ? (
          <div
            className="coupon-pop flex flex-col items-center gap-2 py-3 text-center"
            role="status"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-success text-white">
              <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
                <path
                  d="M5 12.5 9.5 17 19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="coupon-check"
                />
              </svg>
            </span>
            <p className="text-base font-semibold">Desconto incluído</p>
            <p className="text-sm text-muted-foreground">{quoted.detail}</p>
            {quoted.cents > 0 ? (
              <p className="text-2xl font-semibold text-success">
                − <Brl cents={counted} />
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className={cn(shake && 'coupon-shake')} onAnimationEnd={() => setShake(false)}>
              <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
                Código
              </label>
              <Input
                id={inputId}
                value={code}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                placeholder="Digite o cupom"
                aria-invalid={phase === 'error'}
                aria-describedby={phase === 'error' ? errorId : undefined}
                disabled={phase === 'checking'}
                className="h-12 px-3 text-base uppercase md:text-base"
                onChange={(event) => {
                  setCode(event.target.value.toLocaleUpperCase('pt-BR'));
                  if (phase === 'error') setPhase('idle');
                }}
              />
            </div>
            {phase === 'error' ? (
              <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
                Não encontramos esse cupom.
              </p>
            ) : null}
            <div className="space-y-2">
              <p className="text-sm font-medium" id={`${inputId}-cupons`}>
                Cupons disponíveis
              </p>
              <div role="radiogroup" aria-labelledby={`${inputId}-cupons`} className="space-y-2">
                {COUPONS.map((item) => {
                  const selected = code === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={phase === 'checking'}
                      className={cn(
                        'flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors disabled:opacity-60',
                        selected ? 'bg-secondary ring-primary' : 'bg-card ring-border hover:bg-muted',
                      )}
                      onClick={() => {
                        setCode(item.code);
                        setPhase('idle');
                        setShake(false);
                      }}
                    >
                      <span className="text-sm font-semibold">{item.code}</span>
                      <span className="text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {phase === 'checking' || phase === 'error' ? (
              <div className="space-y-3">
                {phase === 'checking' ? (
                  <p className="sr-only" aria-live="polite">
                    {CHECK_STEPS[step]}
                  </p>
                ) : null}
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full transition-[width] duration-500 ease-out',
                      phase === 'error' ? 'bg-destructive' : 'bg-primary',
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <ol className="space-y-2">
                  {CHECK_STEPS.map((label, index) => {
                    const failed = phase === 'error' && index === step;
                    const done = index < step;
                    const current = phase === 'checking' && index === step;
                    const reached = done || current || failed;
                    return (
                      <li
                        key={label}
                        className={cn(
                          'flex items-center gap-3 text-sm',
                          reached ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full border',
                            done && 'border-success bg-success text-white',
                            failed && 'border-destructive bg-destructive text-white',
                            current && 'border-primary text-primary',
                            !reached && 'border-border',
                          )}
                        >
                          {done ? (
                            <Check className="size-3.5" aria-hidden />
                          ) : failed ? (
                            <X className="size-3.5" aria-hidden />
                          ) : current ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                          )}
                        </span>
                        {label}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
            <DialogFooter>
              <Button
                type="submit"
                className="h-11 w-full sm:w-auto"
                tooltip={false}
                disabled={!code.trim() || phase === 'checking'}
              >
                {phase === 'checking' ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Validando
                  </>
                ) : (
                  'Aplicar cupom'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function groupLines(lines: ReadyLine[]) {
  const groups: { slug: string; name: string; lines: ReadyLine[] }[] = [];
  for (const line of lines) {
    const slug = line.product.categorySlug;
    const current = groups.find((group) => group.slug === slug);
    if (current) current.lines.push(line);
    else {
      groups.push({
        slug,
        name: getCategory(slug)?.name ?? 'Outros',
        lines: [line],
      });
    }
  }
  return groups;
}

export function CartView() {
  const { cart, products, hydrated } = useMarketplace();
  const lines = resolveCart(cart, products);
  const available = lines.flatMap((line) =>
    line.product ? [{ ...line, product: line.product }] : [],
  );
  const missing = lines.filter((line) => !line.product);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponSession, setCouponSession] = useState(0);
  const [pendingRemove, setPendingRemove] = useState<Product | null>(null);
  const pendingRemoveName = useRef('');

  function openCoupon() {
    setCouponSession((value) => value + 1);
    setCouponOpen(true);
  }

  const selected = available.filter((line) => !excluded.has(line.product.id));
  const selectedKey = selected.map((line) => line.product.id).join('|');
  const allSelected = available.length > 0 && selected.length === available.length;
  const someSelected = selected.length > 0 && !allSelected;

  useEffect(() => {
    if (!hydrated) return;
    if (!selectedKey) {
      setCheckoutProductIds(available.length === 0 ? null : []);
      return;
    }
    setCheckoutProductIds(selectedKey.split('|'));
  }, [hydrated, available.length, selectedKey]);

  function setIds(ids: string[], on: boolean) {
    setExcluded((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  const saleSubtotal = selected.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const listSubtotal = selected.reduce((sum, line) => {
    const list =
      line.product.compareAtPrice && line.product.compareAtPrice > line.product.price
        ? line.product.compareAtPrice
        : line.product.price;
    return sum + list * line.quantity;
  }, 0);
  const productDiscount = listSubtotal - saleSubtotal;
  const order = cartTotals(
    selected.map((line) => ({
      price: line.product.price,
      quantity: line.quantity,
      freeShipping: line.product.freeShipping,
    })),
  );
  const priced = coupon ? couponSavings(coupon, saleSubtotal, order.shipping) : null;
  const couponAmount = priced?.amount ?? 0;
  const actualShipping = priced ? priced.shipping : order.shipping;
  const listShipping = order.shipping === 0 ? STANDARD_SHIPPING : order.shipping;
  const gross = listSubtotal + (selected.length === 0 ? 0 : listShipping);
  const net = Math.max(0, saleSubtotal - couponAmount + actualShipping);
  const saved = Math.max(0, gross - net);
  const units = selected.reduce((sum, line) => sum + line.quantity, 0);
  const groups = groupLines(available);
  const firstPaidSlug = groups.find((group) => {
    const chosen = group.lines.filter((line) => !excluded.has(line.product.id));
    return chosen.some((line) => !line.product.freeShipping) && actualShipping > 0;
  })?.slug;

  const inCart = new Set(cart.map((line) => line.productId));
  const pool = products.filter((product) => product.stock > 0);
  const outside = pool.filter((product) => !inCart.has(product.id));
  const offers = [...(outside.length > 0 ? outside : pool)]
    .sort((a, b) => Number(isOnSale(b)) - Number(isOnSale(a)) || b.rating - a.rating)
    .slice(0, 6);

  function quote(next: Coupon) {
    const savings = couponSavings(next, saleSubtotal, order.shipping);
    if (next.kind === 'shipping') {
      return {
        cents: order.shipping,
        detail:
          order.shipping === 0
            ? 'O frete deste pedido já é grátis.'
            : 'O frete do pedido fica grátis.',
      };
    }
    return { cents: savings.amount, detail: next.label };
  }

  async function shareCart() {
    const text = available
      .map(
        (line) =>
          `${line.product.name} · ${line.quantity} un. · ${formatBRL(line.product.price * line.quantity)}`,
      )
      .join('\n');
    const payload = { title: 'Carrinho Gescom', text };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lista do carrinho copiada');
    } catch {
      toast.error('Não foi possível compartilhar o carrinho');
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      {lines.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Seu carrinho está vazio"
          description="Os produtos que você adicionar ficam salvos neste aparelho."
          action={
            <Button asChild className="h-12 w-full" tooltip={false}>
              <Link href="/busca">Começar a buscar</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3.5 shadow-card ring-1 ring-border">
              <label className="inline-flex min-w-0 items-center gap-2.5 text-sm font-medium">
                <CartCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  label="Selecionar todos os produtos"
                  onCheckedChange={(on) =>
                    setIds(
                      available.map((line) => line.product.id),
                      on,
                    )
                  }
                />
                Todos os produtos
              </label>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary"
                onClick={() => void shareCart()}
              >
                <Share2 className="size-4" aria-hidden />
                <span className="hidden sm:inline">Compartilhar carrinho</span>
                <span className="sm:hidden">Compartilhar</span>
              </button>
            </div>

            {groups.map((group) => {
              const ids = group.lines.map((line) => line.product.id);
              const chosen = group.lines.filter((line) => !excluded.has(line.product.id));
              const groupAll = chosen.length === group.lines.length;
              const groupSome = chosen.length > 0 && !groupAll;
              const groupFree =
                chosen.length > 0 &&
                (actualShipping === 0 || chosen.every((line) => line.product.freeShipping));
              const showAmount = groupFree || group.slug === firstPaidSlug;
              const allFreeShipping = group.lines.every((line) => line.product.freeShipping);

              return (
                <section
                  key={group.slug}
                  className="overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-border"
                >
                  <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
                    <CartCheckbox
                      checked={groupAll}
                      indeterminate={groupSome}
                      label={`Selecionar produtos de ${group.name}`}
                      onCheckedChange={(on) => setIds(ids, on)}
                    />
                    <Link
                      href={`/categoria/${group.slug}`}
                      className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold"
                    >
                      <span className="truncate">Produtos de {group.name}</span>
                      {allFreeShipping ? (
                        <span className="shrink-0 rounded-md bg-success/12 px-1.5 py-0.5 text-[11px] font-semibold text-success">
                          Frete grátis
                        </span>
                      ) : null}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </div>
                  <ul className="divide-y divide-border">
                    {group.lines.map((line) => {
                      const product = line.product;
                      const image = product.images[0];
                      const discount = discountPercent(product.price, product.compareAtPrice);
                      const compare = product.compareAtPrice;
                      return (
                        <li key={product.id} className="flex gap-3 px-4 py-4">
                          <div className="pt-1">
                            <CartCheckbox
                              checked={!excluded.has(product.id)}
                              label={`Selecionar ${product.name}`}
                              onCheckedChange={(on) => setIds([product.id], on)}
                            />
                          </div>
                          <Link
                            href={`/produto/${product.slug}`}
                            className="relative size-18 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20"
                          >
                            {image ? (
                              <Image
                                src={image}
                                alt=""
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : null}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                              <div className="flex min-w-0 items-start gap-0.5 sm:flex-1">
                                <Link
                                  href={`/produto/${product.slug}`}
                                  className="line-clamp-2 min-w-0 flex-1 text-sm leading-5 font-medium sm:flex-none"
                                >
                                  {product.name}
                                </Link>
                                <button
                                  type="button"
                                  className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors before:absolute before:-inset-2.5 hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
                                  aria-label={`Remover ${product.name}`}
                                  onClick={() => {
                                    pendingRemoveName.current = product.name;
                                    setPendingRemove(product);
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                              <div className="shrink-0 text-right">
                                {discount && compare ? (
                                  <p className="flex items-center justify-end gap-1.5">
                                    <span className="text-xs text-muted-foreground line-through">
                                      {formatBRL(compare * line.quantity)}
                                    </span>
                                    <span className="rounded-md bg-success/12 px-1.5 py-0.5 text-[11px] font-semibold text-success">
                                      {discount}% OFF
                                    </span>
                                  </p>
                                ) : null}
                                <p className="text-lg leading-tight font-semibold">
                                  <Brl cents={product.price * line.quantity} />
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <QuantityStepper
                                value={line.quantity}
                                max={Math.max(product.stock, 1)}
                                onChange={(value) => setQuantity(product.id, value)}
                                label={`Quantidade de ${product.name}`}
                              />
                              <span className="text-sm text-muted-foreground">
                                {stockLabel(product.stock)}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="space-y-2 border-t border-border px-4 py-3.5 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span>Frete</span>
                      {chosen.length === 0 ? (
                        <span className="text-muted-foreground">Fora do pedido</span>
                      ) : groupFree ? (
                        <span className="text-right">
                          <span className="mr-2 text-muted-foreground line-through">
                            {formatBRL(STANDARD_SHIPPING)}
                          </span>
                          <span className="font-semibold text-success">Grátis</span>
                        </span>
                      ) : showAmount ? (
                        <span className="font-medium">{formatBRL(actualShipping)}</span>
                      ) : (
                        <span className="text-muted-foreground">Incluso no envio do pedido</span>
                      )}
                    </div>
                    <p className="leading-relaxed text-muted-foreground">
                      {chosen.length === 0
                        ? 'Marque um produto deste grupo para incluí-lo na compra. '
                        : groupFree
                          ? `Aproveite o frete grátis adicionando mais produtos de ${group.name}. `
                          : `Frete grátis a partir de ${formatBRL(FREE_SHIPPING_FROM)} no pedido. Adicione mais produtos de ${group.name}. `}
                      <Link href={`/categoria/${group.slug}`} className="font-medium text-primary">
                        Ver produtos
                      </Link>
                    </p>
                  </div>
                </section>
              );
            })}

            {missing.map((line) => (
              <section
                key={line.productId}
                className="rounded-xl bg-card px-4 py-4 shadow-card ring-1 ring-border"
              >
                <p className="text-sm font-medium">Produto indisponível</p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-primary"
                  onClick={() => removeFromCart(line.productId)}
                >
                  Remover
                </button>
              </section>
            ))}
          </div>

          <aside className="h-fit space-y-4 rounded-xl bg-card p-6 shadow-card ring-1 ring-border lg:sticky lg:top-[calc(var(--store-header-h,4rem)+1rem)]">
            <h2 className="text-lg font-semibold tracking-tight">Resumo da compra</h2>
            <dl className="space-y-3.5 text-base">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Produtos ({units})</dt>
                <dd className="font-medium">
                  <Brl cents={listSubtotal} />
                </dd>
              </div>
              {productDiscount > 0 ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Desconto de produtos</dt>
                  <dd className="font-medium text-success">
                    − <Brl cents={productDiscount} />
                  </dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Envios</dt>
                <dd className="text-right font-medium">
                  {selected.length === 0 ? (
                    <Brl cents={0} />
                  ) : actualShipping === 0 ? (
                    <>
                      <span className="mr-2 text-sm font-normal text-muted-foreground line-through">
                        {formatBRL(listShipping)}
                      </span>
                      <span className="text-success">Grátis</span>
                    </>
                  ) : (
                    <Brl cents={actualShipping} />
                  )}
                </dd>
              </div>
              {coupon ? (
                <div
                  key={coupon.code}
                  className="coupon-in flex items-start justify-between gap-3 text-success"
                >
                  <dt className="font-medium">
                    Cupom {coupon.code}
                    <span className="mt-1 flex gap-3 text-xs">
                      <button
                        type="button"
                        className="font-semibold text-primary"
                        onClick={openCoupon}
                      >
                        Alterar
                      </button>
                      <button
                        type="button"
                        className="font-semibold text-primary"
                        onClick={() => setCoupon(null)}
                      >
                        Remover
                      </button>
                    </span>
                  </dt>
                  <dd className="font-semibold">
                    {coupon.kind === 'shipping' ? (
                      'Frete grátis'
                    ) : (
                      <>
                        − <Brl cents={couponAmount} />
                      </>
                    )}
                  </dd>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 py-1 text-sm font-medium text-primary"
                    onClick={openCoupon}
                  >
                    <TicketPercent className="size-4" aria-hidden />
                    Inserir código do cupom
                  </button>
                </div>
              )}
            </dl>
            <div
              key={coupon?.code ?? 'sem-cupom'}
              className={cn(coupon && 'coupon-in', 'space-y-1')}
            >
              <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-right">
                  {saved > 0 ? (
                    <span className="mr-2 text-sm font-normal text-muted-foreground line-through">
                      <Brl cents={gross} />
                    </span>
                  ) : null}
                  <span className="text-2xl font-semibold tracking-tight">
                    <Brl cents={net} />
                  </span>
                </p>
              </div>
              {saved > 0 ? (
                <p className="text-right text-sm font-semibold text-success">
                  Economize <Brl cents={saved} />
                </p>
              ) : null}
            </div>
            <p className="sr-only" aria-live="polite">
              {coupon ? `Cupom ${coupon.code} aplicado. Total ${formatBRL(net)}.` : ''}
            </p>
            {units === 0 ? (
              <Button
                type="button"
                size="xl"
                className="h-12 w-full text-base"
                disabled
                tooltip={false}
              >
                Continuar
              </Button>
            ) : (
              <Button asChild size="xl" className="h-12 w-full text-base" tooltip={false}>
                <Link
                  href="/checkout"
                  onClick={() => setCheckoutProductIds(selected.map((line) => line.product.id))}
                >
                  Continuar ({units})
                </Link>
              </Button>
            )}
            {coupon ? (
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                O cupom entra só neste resumo, como simulação visual.
              </p>
            ) : null}
          </aside>
        </div>
      )}

      {offers.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader title="Ofertas para você" href="/busca?oferta=1" action="Ver ofertas" />
          <p className="text-sm text-muted-foreground">
            Produtos em promoção para completar a compra.
          </p>
          <ProductGrid products={offers} layout="catalog" />
        </section>
      ) : null}

      <CouponDialog
        key={couponSession}
        open={couponOpen}
        quote={quote}
        onOpenChange={setCouponOpen}
        onApply={setCoupon}
      />

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do carrinho?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${pendingRemove?.name} sai deste carrinho.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold text-muted-foreground bg-transparent border-none">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!pendingRemove) return;
                const removed = removeFromCart(pendingRemove.id);
                if (!removed) return;
                toast('Item removido', {
                  action: {
                    label: 'Desfazer',
                    onClick: () => restoreCartLine(removed),
                  },
                });
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
