'use client';

import { Camera, Package, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState, formatWhen } from '@/features/marketplace/components/bits';
import { getProductById } from '@/features/marketplace/catalog';
import {
  createReviewHref,
  formatDayMonthShort,
} from '@/features/marketplace/order-helpers';
import {
  pendingReviewItems,
  saveUserReview,
  useMarketplace,
} from '@/features/marketplace/store';
import type { UserReview } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/lib/utils';

const COMMENT_MAX = 1500;

export function ReviewsView() {
  const { orders, reviews, hydrated } = useMarketplace();
  const pending = useMemo(() => pendingReviewItems(orders, reviews), [orders, reviews]);

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Carregando avaliações…</p>;
  }

  return (
    <div className="space-y-0">
      <h1 className="mb-4 hidden text-2xl font-semibold tracking-tight md:block">Avaliações</h1>

      <Tabs defaultValue="pendentes" className="gap-0">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-0 rounded-none border-none bg-transparent p-0"
        >
          <TabsTrigger
            value="pendentes"
            className="h-11 flex-none rounded-none px-4 pb-3 data-active:shadow-none"
          >
            Pendentes
          </TabsTrigger>
          <TabsTrigger
            value="realizadas"
            className="h-11 flex-none rounded-none px-4 pb-3 data-active:shadow-none"
          >
            Realizadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-0 space-y-0">
          {pending.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Nenhuma avaliação pendente"
              description="Quando uma compra for entregue, o produto aparece aqui para você opinar."
              action={
                <Button asChild className="h-12 w-full" tooltip={false}>
                  <Link href="/conta/pedidos">Ver compras</Link>
                </Button>
              }
            />
          ) : (
            <ul className="mt-3 space-y-3">
              {pending.map((item) => (
                <li key={`${item.orderId}-${item.productId}`}>
                  <PendingReviewCard
                    name={item.name}
                    image={item.image}
                    purchasedAt={item.purchasedAt}
                    href={createReviewHref(item.orderId, item.productId)}
                    orderId={item.orderId}
                    productId={item.productId}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="realizadas" className="mt-3 space-y-3">
          {reviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Nenhuma avaliação realizada"
              description="Suas opiniões publicadas ficam salvas neste aparelho."
            />
          ) : (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <DoneReviewCard review={review} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingReviewCard({
  name,
  image,
  purchasedAt,
  href,
  orderId,
  productId,
}: {
  name: string;
  image: string;
  purchasedAt: string;
  href: string;
  orderId: string;
  productId: string;
}) {
  return (
    <article className="rounded-2xl bg-card px-4 py-4 shadow-card ring-1 ring-foreground/8 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
            {image ? (
              <Image src={image} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <Package className="absolute inset-0 m-auto size-6 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">{name}</span>
        </Link>

        <div
          className="flex items-center justify-center gap-1 sm:flex-1"
          role="group"
          aria-label={`Avaliar ${name}`}
        >
          {Array.from({ length: 5 }, (_, index) => {
            const rating = index + 1;
            return (
              <Link
                key={rating}
                href={createReviewHref(orderId, productId, rating)}
                className="rounded-md p-1 text-border transition-colors hover:text-primary"
                aria-label={`${rating} estrela${rating > 1 ? 's' : ''}`}
              >
                <Star className="size-6 fill-transparent sm:size-7" strokeWidth={1.5} />
              </Link>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground sm:min-w-40 sm:text-right">
          Comprado em {formatDayMonthShort(purchasedAt)}.
        </p>
      </div>
    </article>
  );
}

function DoneReviewCard({ review }: { review: UserReview }) {
  const { orders } = useMarketplace();
  const order = orders.find((item) => item.id === review.orderId);
  const item = order?.items.find((line) => line.productId === review.productId);
  const product = getProductById(review.productId);
  const name = item?.name ?? product?.name ?? 'Produto';
  const image = item?.image ?? product?.images[0] ?? '';

  return (
    <article className="rounded-2xl bg-card px-4 py-4 shadow-card ring-1 ring-foreground/8 sm:px-5">
      <div className="flex gap-3">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
          {image ? <Image src={image} alt="" fill sizes="56px" className="object-cover" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5" aria-label={`${review.rating} de 5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={cn(
                    'size-4',
                    index < review.rating
                      ? 'fill-primary text-primary'
                      : 'fill-transparent text-border',
                  )}
                  aria-hidden
                />
              ))}
            </span>
            <span className="text-xs text-muted-foreground">{formatWhen(review.createdAt)}</span>
          </div>
          {review.comment ? (
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{review.comment}</p>
          ) : null}
          {review.anonymous ? (
            <p className="mt-1 text-xs text-muted-foreground">Publicada anonimamente</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CreateReviewView({
  orderId,
  productId,
  initialRating = 0,
}: {
  orderId: string;
  productId: string;
  initialRating?: number;
}) {
  const router = useRouter();
  const { orders, reviews, hydrated, user } = useMarketplace();
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const order = orders.find((item) => item.id === orderId);
  const item = order?.items.find((line) => line.productId === productId);
  const already = reviews.some(
    (review) => review.orderId === orderId && review.productId === productId,
  );

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!order || !item || order.status !== 'entregue') {
    return (
      <EmptyState
        icon={Package}
        title="Produto não disponível para avaliação"
        description="Só é possível avaliar itens de compras entregues salvas neste aparelho."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/conta/avaliacoes">Voltar às avaliações</Link>
          </Button>
        }
      />
    );
  }

  if (already) {
    return (
      <EmptyState
        icon={Star}
        title="Avaliação já publicada"
        description="Você já opinou sobre este produto nesta compra."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/conta/avaliacoes">Ver avaliações</Link>
          </Button>
        }
      />
    );
  }

  function publish() {
    if (rating < 1) {
      toast.error('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }
    setSubmitting(true);
    saveUserReview({
      productId,
      orderId,
      rating,
      comment,
      anonymous,
      photoCount,
    });
    toast.success(
      anonymous || !user
        ? 'Opinião publicada anonimamente neste aparelho.'
        : 'Opinião publicada neste aparelho.',
    );
    router.push('/conta/avaliacoes');
  }

  const activeStars = hover || rating;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="hidden text-2xl font-semibold tracking-tight md:block">Criar avaliação</h1>

      <section className="rounded-2xl bg-card px-5 py-8 text-center shadow-card ring-1 ring-foreground/8">
        <div className="relative mx-auto size-20 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
          {item.image ? (
            <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
          ) : null}
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight">
          O que você achou do produto?
        </h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">{item.name}</p>
        <div
          className="mt-5 flex items-center justify-center gap-1"
          role="radiogroup"
          aria-label="Nota do produto"
          onMouseLeave={() => setHover(0)}
        >
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const filled = value <= activeStars;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} estrela${value > 1 ? 's' : ''}`}
                className="rounded-md p-1 transition-colors"
                onMouseEnter={() => setHover(value)}
                onFocus={() => setHover(value)}
                onBlur={() => setHover(0)}
                onClick={() => setRating(value)}
              >
                <Star
                  className={cn(
                    'size-9 transition-colors',
                    filled ? 'fill-primary text-primary' : 'fill-transparent text-border',
                  )}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-card px-5 py-6 text-center shadow-card ring-1 ring-foreground/8">
        <h2 className="text-lg font-semibold tracking-tight">Compartilhe fotos do seu produto</h2>
        <div className="mt-5 flex items-start gap-3 text-left">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Camera className="size-6" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ao compartilhá-las, você ajuda outras pessoas na decisão de compra.
          </p>
        </div>
        <label className="mt-5 inline-flex">
          <span className="sr-only">Enviar fotos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              const count = event.target.files?.length ?? 0;
              setPhotoCount(count);
              if (count > 0) {
                toast.message(
                  count === 1 ? '1 foto selecionada' : `${count} fotos selecionadas`,
                  { description: 'As imagens ficam só neste aparelho (demo).' },
                );
              }
            }}
          />
          <span className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-secondary px-5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
            {photoCount > 0
              ? `${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}`
              : 'Enviar fotos'}
          </span>
        </label>
      </section>

      <section className="rounded-2xl bg-card px-5 py-6 shadow-card ring-1 ring-foreground/8">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          Dê mais detalhes sobre seu produto
        </h2>
        <label className="mt-5 block">
          <span className="sr-only">Comentário da avaliação</span>
          <textarea
            value={comment}
            maxLength={COMMENT_MAX}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Eu achei que o meu produto..."
            rows={5}
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          {comment.length} / {COMMENT_MAX}
        </p>
        <label className="mt-4 flex items-center justify-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(event) => setAnonymous(event.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          Avaliar anonimamente
        </label>
      </section>

      <Button
        type="button"
        className="h-12 w-full"
        tooltip={false}
        disabled={submitting}
        onClick={publish}
      >
        Publicar opinião
      </Button>
    </div>
  );
}
