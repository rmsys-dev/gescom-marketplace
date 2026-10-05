'use client';

import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { getCategory, getProductBySlug, relatedProducts } from '@/features/marketplace/catalog';
import { REVIEWS } from '@/features/marketplace/data';
import {
  EmptyState,
  Installments,
  Price,
  QuantityStepper,
  Stars,
} from '@/features/marketplace/components/bits';
import { ProductGrid } from '@/features/marketplace/components/product-card';
import { schedulePush } from '@/features/marketplace/navigate';
import { addToCart, useMarketplace } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function ProductView({ slug }: { slug: string }) {
  const router = useRouter();
  const { products, hydrated } = useMarketplace();
  const product = getProductBySlug(slug);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  if (!product && !hydrated) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="-mx-4 aspect-square rounded-none md:mx-0 md:rounded-2xl" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Produto indisponível"
        description="Esse anúncio não está no catálogo deste aparelho."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/busca">Voltar para a busca</Link>
          </Button>
        }
      />
    );
  }

  const category = getCategory(product.categorySlug);
  const reviews = REVIEWS.filter((review) => review.productId === product.id);
  const related = relatedProducts(product, products);
  const soldOut = product.stock <= 0;

  function add(goToCheckout = false) {
    const result = addToCart(product!.id, quantity);
    if (!result.ok) {
      toast.error(
        result.reason === 'stock' ? 'Quantidade maior que o estoque.' : 'Produto esgotado.',
      );
      return;
    }
    if (goToCheckout) {
      schedulePush(() => router.push('/checkout'));
      return;
    }
    toast.success('Adicionado ao carrinho', {
      action: { label: 'Ver', onClick: () => schedulePush(() => router.push('/carrinho')) },
    });
  }

  return (
    <article className="pb-28 md:pb-0">
      <div className="xl:grid xl:grid-cols-[minmax(18rem,36rem)_minmax(0,1fr)] xl:items-start xl:gap-8">
        <div>
          <div
            className="-mx-4 flex snap-x snap-mandatory overflow-x-auto md:mx-0 md:overflow-hidden md:rounded-2xl"
            onScroll={(event) => {
              const element = event.currentTarget;
              if (!element.clientWidth) return;
              setImageIndex(Math.round(element.scrollLeft / element.clientWidth));
            }}
          >
            {product.images.map((src, index) => (
              <div
                key={src}
                className="relative aspect-square w-full shrink-0 snap-center bg-muted"
              >
                <Image
                  src={src}
                  alt={index === 0 ? product.name : ''}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1280px) 100vw, 36rem"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {product.images.length > 1 ? (
            <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
              {product.images.map((src, index) => (
                <span
                  key={src}
                  className={
                    index === imageIndex
                      ? 'size-1.5 rounded-full bg-primary'
                      : 'size-1.5 rounded-full bg-border'
                  }
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start xl:mt-0">
          <div className="space-y-5">
            <div className="space-y-2">
              {category ? (
                <Link
                  href={`/categoria/${category.slug}`}
                  className="text-sm font-medium text-primary"
                >
                  {category.name}
                </Link>
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.summary}</p>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <Stars rating={product.rating} />
                <span className="text-muted-foreground">{product.reviewCount} avaliações</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {product.condition === 'novo' ? 'Novo' : 'Usado'}
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <Price
                cents={product.price * quantity}
                compareAt={product.compareAtPrice ? product.compareAtPrice * quantity : null}
                size="lg"
              />
              <Installments cents={product.price} />
            </div>

            <ul className="grid gap-2 text-sm">
              <li className="flex items-center gap-2">
                <Truck className="size-4 text-primary" aria-hidden />
                {product.freeShipping
                  ? 'Frete grátis neste anúncio'
                  : 'Frete de R$ 19,90, grátis acima de R$ 199'}
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="size-4 text-primary" aria-hidden />
                Devolução em até 7 dias
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                Compra registrada só neste aparelho, sem cobrança
              </li>
            </ul>

            <div className="hidden items-center gap-3 md:flex">
              <QuantityStepper
                value={quantity}
                max={Math.max(product.stock, 1)}
                onChange={setQuantity}
                label={`Quantidade de ${product.name}`}
              />
              <span className="text-sm text-muted-foreground">
                {soldOut ? 'Esgotado' : `${product.stock} em estoque`}
              </span>
            </div>

            <div className="hidden gap-2 md:grid md:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="xl"
                tooltip={false}
                disabled={soldOut}
                onClick={() => add(false)}
              >
                Adicionar
              </Button>
              <Button
                type="button"
                size="xl"
                tooltip={false}
                disabled={soldOut}
                onClick={() => add(true)}
              >
                Comprar agora
              </Button>
            </div>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Descrição</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold">Ficha</h2>
              <dl className="divide-y divide-border rounded-2xl bg-card ring-1 ring-foreground/10">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{spec.label}</dt>
                    <dd className="text-right font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold">Avaliações</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este anúncio ainda não tem comentários publicados.
                </p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{review.author}</p>
                        <Stars rating={review.rating} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {review.comment}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <Price cents={product.price} compareAt={product.compareAtPrice} size="lg" />
              <p className="text-sm text-muted-foreground">
                {soldOut ? 'Esgotado' : 'Pronta entrega'}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Na mesma categoria</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}

      <div className="buy-bar fixed inset-x-0 z-30 border-t border-border bg-card/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <div className="mx-auto flex w-full items-center gap-2">
          <div className="min-w-0 flex-1">
            <QuantityStepper
              value={quantity}
              max={Math.max(product.stock, 1)}
              onChange={setQuantity}
              label={`Quantidade de ${product.name}`}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 px-3"
            tooltip={false}
            disabled={soldOut}
            onClick={() => add(false)}
          >
            Adicionar
          </Button>
          <Button
            type="button"
            className="h-12 px-3"
            tooltip={false}
            disabled={soldOut}
            onClick={() => add(true)}
          >
            Comprar
          </Button>
        </div>
      </div>
    </article>
  );
}
