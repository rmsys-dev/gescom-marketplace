'use client';

import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Price, Stars } from '@/features/marketplace/components/bits';
import { toggleFavorite, useMarketplace } from '@/features/marketplace/store';
import type { Product } from '@/features/marketplace/types';
import { cn } from '@/shared/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const { favorites } = useMarketplace();
  const saved = favorites.includes(product.id);
  const image = product.images[0];

  return (
    <article className="relative flex h-full flex-col">
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
          {product.stock <= 0 ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-foreground/85 px-2 py-0.5 text-[11px] font-medium text-background">
              Esgotado
            </span>
          ) : product.freeShipping ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-medium text-foreground">
              Frete grátis
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-0.5">
          <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">{product.name}</h3>
          <div className="mt-auto space-y-1 pt-1">
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
        className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card"
      >
        <Heart className={cn('size-5', saved && 'fill-destructive text-destructive')} />
      </button>
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
