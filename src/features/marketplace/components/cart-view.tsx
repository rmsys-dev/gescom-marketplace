'use client';

import { ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

import { resolveCart } from '@/features/marketplace/catalog';
import { EmptyState, Price, QuantityStepper } from '@/features/marketplace/components/bits';
import { cartTotals, formatBRL } from '@/features/marketplace/money';
import {
  removeFromCart,
  restoreCartLine,
  setQuantity,
  useMarketplace,
} from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';

export function CartView() {
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

  if (lines.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Carrinho</h1>
        <ul className="space-y-3">
          {lines.map((line) => {
            if (!line.product) {
              return (
                <li
                  key={line.productId}
                  className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <p className="text-sm font-medium">Produto indisponível</p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-primary"
                    onClick={() => removeFromCart(line.productId)}
                  >
                    Remover
                  </button>
                </li>
              );
            }
            const product = line.product;
            const image = product.images[0];
            return (
              <li
                key={product.id}
                className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10"
              >
                <Link
                  href={`/produto/${product.slug}`}
                  className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  {image ? (
                    <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                  ) : null}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/produto/${product.slug}`}
                      className="line-clamp-2 text-sm font-medium"
                    >
                      {product.name}
                    </Link>
                    <button
                      type="button"
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground"
                      aria-label={`Remover ${product.name}`}
                      onClick={() => {
                        const removed = removeFromCart(product.id);
                        if (!removed) return;
                        toast('Item removido', {
                          action: { label: 'Desfazer', onClick: () => restoreCartLine(removed) },
                        });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <Price cents={product.price * line.quantity} size="sm" />
                  <QuantityStepper
                    value={line.quantity}
                    max={Math.max(product.stock, 1)}
                    onChange={(value) => setQuantity(product.id, value)}
                    label={`Quantidade de ${product.name}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="h-fit space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 lg:sticky lg:top-24">
        <h2 className="text-base font-semibold">Resumo</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatBRL(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Frete</dt>
            <dd>{totals.shipping === 0 ? 'Grátis' : formatBRL(totals.shipping)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatBRL(totals.total)}</dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {totals.shipping === 0
            ? 'Este pedido já tem frete grátis.'
            : 'Faltam itens ou valor para liberar o frete grátis a partir de R$ 199.'}
        </p>
        <Button
          asChild
          size="xl"
          className="w-full"
          tooltip={false}
          disabled={available.length === 0}
        >
          <Link href="/checkout">Continuar para o checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
