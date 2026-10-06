'use client';

import { Heart, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Price, Stars } from '@/features/marketplace/components/bits';
import { CartAddedDialog } from '@/features/marketplace/components/cart-added-dialog';
import { addToCart, toggleFavorite, useMarketplace } from '@/features/marketplace/store';
import type { Product } from '@/features/marketplace/types';
import { cn } from '@/shared/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const { favorites } = useMarketplace();
  const saved = favorites.includes(product.id);
  const image = product.images[0];
  const soldOut = product.stock <= 0;
  const [cartDialogMounted, setCartDialogMounted] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  function handleAdd() {
    const result = addToCart(product.id);
    if (!result.ok) {
      toast.error(
        result.reason === 'stock' ? 'Quantidade maior que o estoque.' : 'Produto esgotado.',
      );
      return;
    }
    setCartDialogMounted(true);
    setCartOpen(true);
  }

  return (
    <article className="relative flex h-full flex-col bg-secondary/50 rounded-2xl">
      <Link href={`/produto/${product.slug}`} className="flex h-full flex-col gap-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 768px) 46vw, (max-width: 1280px) 22vw, 16vw"
              className="object-cover"
            />
          ) : null}
          {soldOut ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-foreground/85 px-2 py-0.5 text-[11px] font-medium text-background">
              Esgotado
            </span>
          ) : product.freeShipping ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-medium text-foreground">
              Frete grátis
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-4">
          <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">{product.name}</h3>
          <div className={cn('mt-auto space-y-1 pt-1', !soldOut && 'pr-12')}>
            <Price cents={product.price} compareAt={product.compareAtPrice} size="sm" />
            <Stars rating={product.rating} />
          </div>
        </div>
      </Link>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={
          saved ? `Remover ${product.name} dos favoritos` : `Salvar ${product.name} nos favoritos`
        }
        onClick={() => toggleFavorite(product.id)}
        className="absolute top-2 right-2 z-10 flex size-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card"
      >
        <Heart className={cn('size-5', saved && 'fill-destructive text-destructive')} />
      </button>
      {soldOut ? null : (
        <button
          type="button"
          aria-label={`Adicionar ${product.name} ao carrinho`}
          onClick={handleAdd}
          className="absolute right-4 bottom-4 z-10 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card"
        >
          <ShoppingCart className="size-5" />
        </button>
      )}
      {cartDialogMounted ? <CartAddedDialog open={cartOpen} onOpenChange={setCartOpen} /> : null}
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
