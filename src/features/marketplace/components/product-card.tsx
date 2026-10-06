'use client';

import { Expand, Heart, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Installments, Stars } from '@/features/marketplace/components/bits';
import { CartAddedDialog } from '@/features/marketplace/components/cart-added-dialog';
import { discountPercent, formatBRL } from '@/features/marketplace/money';
import { addToCart, toggleFavorite, useMarketplace } from '@/features/marketplace/store';
import type { Product } from '@/features/marketplace/types';
import { cn } from '@/shared/lib/utils';

function CardPrice({ cents, compareAt }: { cents: number; compareAt: number | null }) {
  const discount = discountPercent(cents, compareAt);
  const reais = Math.trunc(cents / 100).toLocaleString('pt-BR');
  const centsPart = String(Math.abs(cents) % 100).padStart(2, '0');

  return (
    <div className="space-y-0.5">
      {discount && compareAt ? (
        <p className="text-xs text-muted-foreground line-through">{formatBRL(compareAt)}</p>
      ) : null}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-start text-2xl leading-none font-semibold tracking-tight text-foreground">
          <span className="mr-1 self-center text-xs leading-none font-medium">R$</span>
          <span>{reais}</span>
          <span className="self-start text-xs leading-none font-semibold">,{centsPart}</span>
        </span>
        {discount ? (
          <span className="rounded-md bg-success/12 px-1.5 py-0.5 text-[11px] font-semibold text-success">
            {discount}% OFF
          </span>
        ) : null}
      </p>
    </div>
  );
}

function InfoBadges({ product }: { product: Product }) {
  const badges = [
    product.freeShipping
      ? { key: 'ship', label: 'Frete grátis', className: 'bg-success/12 text-success' }
      : null,
    product.condition === 'usado'
      ? { key: 'used', label: 'Usado', className: 'bg-secondary text-secondary-foreground' }
      : null,
  ].filter((badge) => badge !== null);

  if (badges.length === 0) return null;

  return (
    <ul className="flex flex-col items-start gap-1.5">
      {badges.map((badge) => (
        <li key={badge.key}>
          <span
            className={cn(
              'inline-flex rounded-md px-2 py-1 text-[11px] leading-none font-semibold',
              badge.className,
            )}
          >
            {badge.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { favorites } = useMarketplace();
  const saved = favorites.includes(product.id);
  const image = product.images[0];
  const soldOut = product.stock <= 0;
  const onSale = discountPercent(product.price, product.compareAtPrice) !== null;
  const [cartDialogMounted, setCartDialogMounted] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const wasSaved = useRef(saved);
  const href = `/produto/${product.slug}`;

  useEffect(() => {
    if (!saved) {
      wasSaved.current = false;
      return;
    }
    if (wasSaved.current) return;

    setHeartPop(true);
    const timeout = window.setTimeout(() => {
      setHeartPop(false);
      wasSaved.current = true;
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [saved]);

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
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border transition-[transform,box-shadow] duration-300 ease-out md:hover:z-20 md:hover:scale-[1.04] md:hover:shadow-[0_18px_40px_-8px_rgb(15_23_42/0.28)]">
      <div className="@container relative m-2 aspect-square overflow-hidden rounded-xl bg-muted">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 768px) 78vw, (max-width: 1280px) 30vw, 16vw"
            className="object-cover"
          />
        ) : null}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0" />
        {soldOut ? (
          <span className="absolute bottom-2 left-2 z-20 rounded-md bg-foreground/85 px-2 py-1 text-[11px] leading-none font-semibold text-background">
            Esgotado
          </span>
        ) : onSale ? (
          <span className="absolute bottom-2 left-2 z-20 rounded-md bg-primary px-2 py-1 text-[11px] leading-none font-semibold text-primary-foreground">
            Oferta
          </span>
        ) : null}
        <button
          type="button"
          aria-pressed={saved}
          aria-label={
            saved
              ? `Remover ${product.name} dos favoritos`
              : `Salvar ${product.name} nos favoritos`
          }
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-2 right-2 z-20 flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-card ring-1 ring-border transition-opacity duration-200 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:focus-visible:pointer-events-auto md:focus-visible:opacity-100"
        >
          <Heart
            className={cn(
              'size-5 fill-transparent text-foreground transition-[fill,color] duration-300 ease-out',
              saved && 'fill-primary text-primary',
              heartPop && 'heart-pop',
            )}
          />
        </button>
        {soldOut ? null : (
          <button
            type="button"
            aria-label={`Adicionar ${product.name} ao carrinho`}
            onClick={handleAdd}
            className="pointer-events-none absolute inset-0 z-10 hidden md:block md:group-hover:pointer-events-auto"
          >
            <span className="absolute inset-0 bg-primary/40 opacity-0 transition-opacity duration-300 ease-out md:group-hover:opacity-100" />
            <span className="pointer-events-auto absolute right-2 bottom-2 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-[translate,background-color,box-shadow] duration-300 ease-out md:group-hover:-translate-x-[calc(50cqw-1.75rem)] md:group-hover:-translate-y-[calc(50cqw-1.75rem)] md:group-hover:bg-transparent md:group-hover:shadow-none">
              <ShoppingCart className="size-5 drop-shadow-sm transition-transform duration-300 ease-out md:group-hover:scale-125" />
            </span>
            <span
              aria-hidden
              className="absolute top-[calc(50%+1.85rem)] left-1/2 -translate-x-1/2 translate-y-2 text-sm font-medium whitespace-nowrap text-primary-foreground opacity-0 drop-shadow-sm transition-[opacity,translate] duration-500 ease-out md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-hover:delay-150"
            >
              Adicionar ao carrinho
            </span>
          </button>
        )}
      </div>
      <Link href={href} className="flex flex-1 flex-col gap-1.5 px-3 pt-1 pb-3 md:pb-12">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">{product.name}</h3>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <Stars rating={product.rating} />
          <span aria-hidden="true">·</span>
          <span>
            {product.reviewCount.toLocaleString('pt-BR')}{' '}
            {product.reviewCount === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>
        <div className="mt-1 space-y-1">
          <CardPrice cents={product.price} compareAt={product.compareAtPrice} />
          <Installments cents={product.price} />
        </div>
        <InfoBadges product={product} />
        <span
          aria-hidden
          className="absolute bottom-3 right-3 z-20 hidden size-8 translate-y-1 items-center justify-center rounded-full bg-card text-primary opacity-0 shadow-card ring-1 ring-border transition-[opacity,translate] duration-300 ease-out md:flex md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <Expand className="size-4" />
        </span>
      </Link>
      <div className="mt-auto px-3 pb-3 md:hidden">
        <button
          type="button"
          disabled={soldOut}
          onClick={handleAdd}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary/10 text-sm font-medium text-primary disabled:opacity-50"
        >
          <ShoppingCart className="size-4" aria-hidden />
          {soldOut ? 'Esgotado' : 'Adicionar ao carrinho'}
        </button>
      </div>
      {cartDialogMounted ? <CartAddedDialog open={cartOpen} onOpenChange={setCartOpen} /> : null}
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul
      className="scrollbar-none -mx-4 flex snap-x snap-proximity items-stretch gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 py-1 motion-safe:scroll-smooth md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      data-lenis-prevent-touch
    >
      {products.map((product) => (
        <li
          key={product.id}
          className="flex w-[min(78vw,18.5rem)] shrink-0 snap-start min-[480px]:w-[min(46vw,18.5rem)] md:w-auto md:snap-align-none"
        >
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
