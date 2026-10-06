'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { resolveCart } from '@/features/marketplace/catalog';
import { cartTotals, formatBRL } from '@/features/marketplace/money';
import { removeFromCart, restoreCartLine, useMarketplace } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

export function CartAddedDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { cart, products } = useMarketplace();
  const lines = resolveCart(cart, products);
  const available = lines.flatMap((line) =>
    line.product ? [{ ...line, product: line.product }] : [],
  );
  const totals = cartTotals(
    available.map((line) => ({
      price: line.product.price,
      quantity: line.quantity,
      freeShipping: line.product.freeShipping,
    })),
  );
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const itemLabel =
    count === 0
      ? 'Carrinho vazio'
      : count === 1
        ? '1 item no carrinho'
        : `${count} itens no carrinho`;

  function removeLine(productId: string) {
    const removed = removeFromCart(productId);
    if (!removed) return;
    toast('Item removido', {
      action: { label: 'Desfazer', onClick: () => restoreCartLine(removed) },
    });
  }
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const sync = () => {
      const panel = panelRef.current;
      if (!panel) return;
      if (!viewport) {
        panel.style.bottom = '0px';
        panel.style.maxHeight = '100dvh';
        return;
      }
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      panel.style.bottom = `${offset}px`;
      panel.style.maxHeight = `${viewport.height}px`;
    };
    const frame = requestAnimationFrame(sync);
    viewport?.addEventListener('resize', sync);
    viewport?.addEventListener('scroll', sync);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', sync);
      viewport?.removeEventListener('scroll', sync);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={panelRef}
        className="top-auto right-0 bottom-0 left-0 flex w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-3xl p-0 sm:max-w-none md:right-auto md:left-1/2 md:w-full md:max-w-5xl md:-translate-x-1/2"
        overlayClassName="bg-foreground/40"
      >
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <DialogHeader className="shrink-0 px-4 pt-3 pb-1 text-left md:px-6">
          <DialogTitle>Adicionado ao carrinho</DialogTitle>
          <DialogDescription>{itemLabel}</DialogDescription>
        </DialogHeader>
        <div
          className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 py-3 md:px-6"
          data-lenis-prevent-touch
        >
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum item no carrinho.
            </p>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => {
                if (!line.product) {
                  return (
                    <li key={line.productId} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">Produto indisponível</p>
                      <button
                        type="button"
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground"
                        aria-label="Remover produto indisponível"
                        onClick={() => removeLine(line.productId)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                }
                const product = line.product;
                const image = product.images[0];
                return (
                  <li key={product.id} className="flex items-center gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {image ? (
                        <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.quantity} {line.quantity === 1 ? 'unidade' : 'unidades'}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatBRL(product.price * line.quantity)}
                    </p>
                    <button
                      type="button"
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground"
                      aria-label={`Remover ${product.name}`}
                      onClick={() => removeLine(product.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {lines.length === 0 ? null : (
            <dl className="space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatBRL(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Frete</dt>
                <dd>{totals.shipping === 0 ? 'Grátis' : formatBRL(totals.shipping)}</dd>
              </div>
              <div className="flex justify-between gap-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatBRL(totals.total)}</dd>
              </div>
            </dl>
          )}
        </div>
        <DialogFooter className="shrink-0 flex-row border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-stretch md:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-12 min-w-0 flex-1 px-3"
            tooltip={false}
            onClick={() => onOpenChange(false)}
          >
            Continuar comprando
          </Button>
          <Button asChild className="h-12 min-w-0 flex-1 px-3" tooltip={false}>
            <Link href="/carrinho">Ir para o carrinho</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
