'use client';

import {
  BadgeCheck,
  Battery,
  Bluetooth,
  ChevronDown,
  CircleCheck,
  Clock,
  Barcode,
  CreditCard,
  Droplets,
  Heart,
  Lightbulb,
  Mic,
  QrCode,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  type LucideIcon,
  BadgeQuestionMark,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { fetchCatalogProduct } from '@/features/marketplace/catalog-api';
import {
  getCategory,
  getProductBySlug,
  getSubcategory,
  relatedProducts,
} from '@/features/marketplace/catalog';
import {
  EmptyState,
  formatWhen,
  Installments,
  Price,
  QuantityStepper,
} from '@/features/marketplace/components/bits';
import {
  discountPercent,
  formatBRL,
  FREE_SHIPPING_FROM,
  installmentLabel,
  STANDARD_SHIPPING,
} from '@/features/marketplace/money';
import { maskZip, onlyDigits } from '@/features/marketplace/masks';
import { schedulePush } from '@/features/marketplace/navigate';
import { productCoverImage } from '@/features/marketplace/product-images';
import { addToCart, mergeCatalogProduct, toggleFavorite, useMarketplace } from '@/features/marketplace/store';
import type { Product, ProductSpec, Review } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

const SPEC_PREVIEW = 4;

const cardClass = 'rounded-2xl bg-card p-4 shadow-card ring-1 ring-border';

type AskedQuestion = {
  id: string;
  text: string;
  createdAt: string;
};

function specIcon(label: string): LucideIcon {
  const key = label.toLocaleLowerCase('pt-BR');
  if (/bluetooth|conex|sem fio|wi-?fi/.test(key)) return Bluetooth;
  if (/água|agua/.test(key)) return Droplets;
  if (/luz|led/.test(key)) return Lightbulb;
  if (/micro/.test(key)) return Mic;
  if (/bateria|autonom/.test(key)) return Battery;
  if (/medida|altura|tela|tamanho|cm/.test(key)) return Ruler;
  return CircleCheck;
}

function StarScale({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${rating.toFixed(1).replace('.', ',')} de 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'size-4',
            index < rounded ? 'fill-warning text-warning' : 'fill-transparent text-border',
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function HeroPrice({ cents, compareAt }: { cents: number; compareAt: number | null }) {
  const discount = discountPercent(cents, compareAt);
  return (
    <div className="space-y-1">
      {compareAt && compareAt > cents ? (
        <p className="text-sm text-muted-foreground line-through">{formatBRL(compareAt)}</p>
      ) : null}
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-4xl font-semibold tracking-tight">{formatBRL(cents)}</span>
        {discount ? (
          <span className="rounded-md bg-success/12 px-1.5 py-0.5 text-xs font-semibold text-success">
            {discount}% OFF
          </span>
        ) : null}
      </p>
      <Installments cents={cents} />
    </div>
  );
}

function Gallery({
  images,
  name,
  index,
  onSelect,
}: {
  images: string[];
  name: string;
  index: number;
  onSelect: (index: number) => void;
}) {
  const selected = images[index] ?? images[0];

  return (
    <>
      <div
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:max-h-112 md:flex-col md:overflow-y-auto md:px-0"
        role="listbox"
        aria-label="Imagens do produto"
        data-lenis-prevent-touch
      >
        {images.map((src, imageIndex) => {
          const active = imageIndex === index;
          return (
            <button
              key={`${src}-${imageIndex}`}
              type="button"
              role="option"
              aria-selected={active}
              aria-label={`Imagem ${imageIndex + 1} de ${images.length}`}
              onClick={() => onSelect(imageIndex)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border md:size-18',
                active && 'ring-2 ring-primary',
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
                unoptimized={src.endsWith('.svg')}
              />
            </button>
          );
        })}
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
        {selected ? (
          <Image
            key={selected}
            src={selected}
            alt={name}
            unoptimized={selected.endsWith('.svg')}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 28rem"
            className="object-cover"
          />
        ) : null}
      </div>
    </>
  );
}

function VariantPicker({
  product,
  selectedId,
  onSelect,
}: {
  product: Product;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const variants = product.variants ?? [];
  if (variants.length === 0) return null;
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];
  const group = product.variantLabel ?? 'Variação';

  return (
    <div className="space-y-2">
      <p className="text-sm">
        {group}: <span className="font-semibold">{selected?.label}</span>
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={group}>
        {variants.map((variant) => {
          const active = variant.id === selected?.id;
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(variant.id)}
              className={cn(
                'rounded-xl ring-1 ring-border transition-shadow',
                variant.swatch ? 'size-11 p-1' : 'h-11 min-w-11 px-3 text-sm font-medium',
                active ? 'ring-2 ring-primary' : 'hover:ring-primary/40',
              )}
            >
              {variant.swatch ? (
                <span
                  className="block size-full rounded-lg ring-1 ring-foreground/15"
                  style={{ backgroundColor: variant.swatch }}
                />
              ) : (
                variant.label
              )}
              {variant.swatch ? <span className="sr-only">{variant.label}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BuyBox({
  product,
  quantity,
  onQuantity,
  onAdd,
  city,
}: {
  product: Product;
  quantity: number;
  onQuantity: (value: number) => void;
  onAdd: (goToCheckout: boolean) => void;
  city: string | null;
}) {
  const soldOut = product.stock <= 0;
  const [zip, setZip] = useState('');
  const [zipError, setZipError] = useState('');
  const [quotedZip, setQuotedZip] = useState<string | null>(null);
  const arrivalDays = product.freeShipping ? 2 : 3;
  const quotedCents = product.freeShipping ? 0 : STANDARD_SHIPPING;

  function calculateZip(event: FormEvent) {
    event.preventDefault();
    const digits = onlyDigits(zip);
    if (digits.length < 8) {
      setQuotedZip(null);
      setZipError('Informe o CEP com 8 dígitos.');
      return;
    }
    setZipError('');
    setQuotedZip(maskZip(digits));
  }

  return (
    <div className={cn(cardClass, 'space-y-4')}>
      <p className="rounded-xl bg-success/12 px-3 py-2 text-center text-xs font-semibold text-success">
        {product.freeShipping
          ? 'Frete grátis neste anúncio'
          : `Frete grátis acima de ${formatBRL(FREE_SHIPPING_FROM)}`}
      </p>

      <div className="space-y-3">
        {product.freeShipping ? (
          <p className="text-sm">
            <span className="font-semibold text-success">Chega em até 2 dias úteis</span>{' '}
            <span className="text-muted-foreground line-through">
              {formatBRL(STANDARD_SHIPPING)}
            </span>{' '}
            <span className="font-semibold text-success">R$ 0</span>
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-semibold text-success">Chega em até 3 dias úteis</span> por{' '}
            {formatBRL(STANDARD_SHIPPING)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {city ? `Envio para ${city}.` : 'O endereço é informado no checkout.'} Prazo estimado para
          este anúncio.
        </p>
        <div className="space-y-2">
          <p className="text-sm font-medium">Formas de entrega</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {product.freeShipping
                ? 'Frete grátis neste anúncio, sem custo na primeira entrega.'
                : `Frete de ${formatBRL(STANDARD_SHIPPING)}, grátis acima de ${formatBRL(FREE_SHIPPING_FROM)}.`}
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Entrega em até {arrivalDays} dias úteis após a confirmação do pedido.
            </li>
          </ul>
        </div>
      </div>

      <form className="space-y-2 border-t border-border pt-4" onSubmit={calculateZip}>
        <label htmlFor="cep-frete" className="text-sm font-medium">
          Calcular frete
        </label>
        <div className="flex gap-2">
          <Input
            id="cep-frete"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={zip}
            maxLength={9}
            aria-invalid={Boolean(zipError)}
            aria-describedby={
              zipError ? 'cep-frete-erro' : quotedZip ? 'cep-frete-resultado' : undefined
            }
            className="h-12 flex-1 rounded-xl px-3"
            onChange={(event) => {
              setZip(maskZip(event.target.value));
              setZipError('');
            }}
          />
          <Button type="submit" variant="outline" size="xl" tooltip={false} className="shrink-0">
            Calcular
          </Button>
        </div>
        {zipError ? (
          <p id="cep-frete-erro" className="text-xs text-destructive" role="alert">
            {zipError}
          </p>
        ) : null}
        {quotedZip ? (
          <p id="cep-frete-resultado" className="rounded-xl bg-secondary px-3 py-2.5 text-sm">
            <span className="block text-lg font-semibold tracking-tight text-foreground">
              {formatBRL(quotedCents)}
            </span>
            <span className="block text-muted-foreground">
              Simulação para o CEP {quotedZip}. Chega em até {arrivalDays} dias úteis.
            </span>
          </p>
        ) : null}
      </form>

      <div className="hidden space-y-2 border-t border-border pt-4 md:block">
        <p className="text-sm font-medium">
          {soldOut ? 'Estoque indisponível' : 'Estoque disponível'}
        </p>
        <p className="text-sm text-muted-foreground">
          Quantidade: {quantity} {quantity === 1 ? 'unidade' : 'unidades'}
          {soldOut ? null : ` · +${product.stock} disponíveis`}
        </p>
        <QuantityStepper
          value={quantity}
          max={Math.max(product.stock, 1)}
          onChange={onQuantity}
          label={`Quantidade de ${product.name}`}
        />
      </div>

      <div className="hidden flex-col gap-2 md:flex">
        <Button
          type="button"
          size="xl"
          tooltip={false}
          disabled={soldOut}
          onClick={() => onAdd(true)}
        >
          Comprar agora
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xl"
          tooltip={false}
          disabled={soldOut}
          onClick={() => onAdd(false)}
        >
          <ShoppingCart />
          Adicionar ao carrinho
        </Button>
      </div>

      <ul className="grid gap-2 border-t border-border pt-4">
        <li className="flex gap-3 rounded-2xl bg-secondary p-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-card ring-1 ring-border">
            <BadgeCheck className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Devolução grátis</span>
            <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
              7 dias a partir do recebimento para devolver sem custo.
            </span>
          </span>
        </li>
        <li className="flex gap-3 rounded-2xl bg-primary/10 p-3 ring-1 ring-primary/15">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-card ring-1 ring-border">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Compra protegida</span>
            <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
              O pedido fica neste aparelho, sem cobrança real.
            </span>
          </span>
        </li>
      </ul>
    </div>
  );
}

function PaymentMethods({ price }: { price: number }) {
  const installments = installmentLabel(price);

  return (
    <section id="pagamentos" className={cn(cardClass, 'scroll-mt-28 space-y-4')}>
      <h2 className="text-base font-semibold">Meios de pagamento</h2>
      {installments ? (
        <p className="rounded-xl bg-success/12 px-3 py-2 text-center text-sm font-semibold text-success">
          Pague em até 3x sem juros
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">À vista neste anúncio.</p>
      )}
      <ul className="space-y-3 text-sm">
        <li className="flex items-center gap-3">
          <QrCode className="size-5 text-primary" aria-hidden />
          <span>
            <span className="block font-medium">Pix</span>
            <span className="text-xs text-muted-foreground">Confirmação no checkout</span>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <CreditCard className="size-5 text-primary" aria-hidden />
          <span>
            <span className="block font-medium">Cartão de crédito</span>
            <span className="text-xs text-muted-foreground">Visa, Mastercard e Elo</span>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <Barcode className="size-5 text-primary" aria-hidden />
          <span>
            <span className="block font-medium">Boleto bancário</span>
            <span className="text-xs text-muted-foreground">
              Vencimento simulado em 2 dias úteis
            </span>
          </span>
        </li>
      </ul>
    </section>
  );
}

function RelatedList({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className={cn(cardClass, 'space-y-3')} aria-labelledby="relacionados-titulo">
      <h2 id="relacionados-titulo" className="text-base font-semibold">
        Produtos relacionados
      </h2>
      <ul className="divide-y divide-border">
        {products.map((item) => {
          const cover = productCoverImage(item.images);
          return (
          <li key={item.id}>
            <Link href={`/produto/${item.slug}`} className="flex gap-3 py-3">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={cover.endsWith('.svg')}
                />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="line-clamp-2 text-sm font-medium">{item.name}</span>
                <Price cents={item.price} compareAt={item.compareAtPrice} size="sm" />
                <Installments cents={item.price} />
                {item.freeShipping ? (
                  <span className="inline-flex rounded-md bg-success/12 px-1.5 py-0.5 text-[11px] font-semibold text-success">
                    Frete grátis
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

function Characteristics({ specs }: { specs: ProductSpec[] }) {
  const [open, setOpen] = useState(false);
  const canToggle = specs.length > SPEC_PREVIEW;
  const visible = open || !canToggle ? specs : specs.slice(0, SPEC_PREVIEW);

  return (
    <section id="caracteristicas" className="scroll-mt-28 space-y-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold tracking-tight">Características do produto</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {visible.map((spec) => {
          const Icon = specIcon(spec.label);
          return (
            <li key={spec.label} className="flex items-center gap-3 text-sm">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="text-muted-foreground">{spec.label}: </span>
                <span className="font-medium">{spec.value}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {canToggle ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? 'Mostrar menos' : 'Conferir todas as características'}
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      ) : null}
    </section>
  );
}

function Description({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section id="descricao" className="scroll-mt-28 space-y-3 border-t border-border pt-8">
      <h2 className="text-lg font-semibold tracking-tight">Descrição</h2>
      <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-muted-foreground">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

function Questions({
  questions,
  draft,
  onDraft,
  onSubmit,
}: {
  questions: AskedQuestion[];
  draft: string;
  onDraft: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section id="perguntas" className="scroll-mt-28 space-y-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold tracking-tight">Perguntas</h2>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="pergunta" className="sr-only">
          Sua pergunta
        </label>
        <Input
          id="pergunta"
          value={draft}
          maxLength={280}
          placeholder="Digite sua pergunta..."
          className="h-12 rounded-xl px-3 sm:flex-1"
          onChange={(event) => onDraft(event.target.value)}
        />
        <Button type="submit" size="xl" tooltip={false} className="shrink-0">
          <BadgeQuestionMark className="size-5" aria-hidden />
          Perguntar
        </Button>
      </form>
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma pergunta ainda. A sua fica registrada só neste aparelho.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {questions.map((question) => (
            <li key={question.id} className="py-3">
              <p className="text-sm">{question.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Você · {formatWhen(question.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ratingBuckets(reviews: Review[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    const index = Math.min(5, Math.max(1, Math.round(review.rating))) - 1;
    counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts;
}

function Reviews({
  product,
  reviews,
  sort,
  onSort,
  onPickImage,
}: {
  product: Product;
  reviews: Review[];
  sort: 'recentes' | 'nota';
  onSort: (sort: 'recentes' | 'nota') => void;
  onPickImage: (index: number) => void;
}) {
  const buckets = ratingBuckets(reviews);
  const total = reviews.length;
  const sorted = [...reviews].sort((a, b) =>
    sort === 'nota'
      ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <section id="avaliacoes" className="scroll-mt-28 space-y-5 border-t border-border pt-8">
      <h2 className="text-lg font-semibold tracking-tight">Opiniões do produto</h2>
      <div className="grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)] md:items-center">
        <div className="space-y-1">
          <p className="text-4xl font-semibold tracking-tight">
            {product.rating.toFixed(1).replace('.', ',')}
          </p>
          <StarScale rating={product.rating} />
          <p className="text-sm text-muted-foreground">
            {product.reviewCount.toLocaleString('pt-BR')}{' '}
            {product.reviewCount === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </div>
        <ul className="space-y-1.5" aria-label="Distribuição das notas publicadas">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = buckets[score - 1] ?? 0;
            const width = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <li key={score} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-3 tabular-nums">{score}</span>
                <Star className="size-3 fill-warning text-warning" aria-hidden />
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </span>
                <span className="w-4 text-right tabular-nums">{count}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {product.images.length > 1 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Fotos do anúncio</h3>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {product.images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => onPickImage(index)}
                className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border"
                aria-label={`Ver imagem ${index + 1} na galeria`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized={src.endsWith('.svg')}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {sorted.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Ordenar opiniões">
          {(
            [
              ['recentes', 'Mais recentes'],
              ['nota', 'Melhor avaliação'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              tooltip={false}
              variant={sort === id ? 'secondary' : 'outline'}
              aria-pressed={sort === id}
              className="rounded-full px-3"
              onClick={() => onSort(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este anúncio ainda não tem comentários publicados.
        </p>
      ) : (
        <ul className="space-y-5">
          {sorted.map((review) => (
            <li key={review.id} className="space-y-2 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarScale rating={review.rating} />
                <p className="text-xs text-muted-foreground">
                  {review.author} · {formatWhen(review.createdAt)}
                </p>
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProductView({ slug }: { slug: string }) {
  const router = useRouter();
  const { products, catalogReady, favorites, addresses } = useMarketplace();
  const listed = getProductBySlug(slug);
  const [detail, setDetail] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);
  const product = detail ?? listed;
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState('');
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<AskedQuestion[]>([]);
  const [reviewSort, setReviewSort] = useState<'recentes' | 'nota'>('recentes');

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);
    setReviews([]);
    setImageIndex(0);
    setVariantId('');

    fetchCatalogProduct(slug)
      .then((data) => {
        if (cancelled) return;
        setDetail(data.product);
        setReviews(data.reviews ?? []);
        setVariantId(data.product.variants?.[0]?.id ?? '');
        mergeCatalogProduct(data.product);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = getProductBySlug(slug);
        if (fallback) {
          setDetail(fallback);
          setVariantId(fallback.variants?.[0]?.id ?? '');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if ((!catalogReady && !product) || (detailLoading && !product)) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="aspect-square rounded-2xl" />
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
        description="Esse anúncio não está no catálogo da loja."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/busca">Voltar para a busca</Link>
          </Button>
        }
      />
    );
  }

  const category = getCategory(product.categorySlug);
  const subcategory = product.subcategorySlug
    ? getSubcategory(product.subcategorySlug)
    : null;
  const related = relatedProducts(product, products);
  const soldOut = product.stock <= 0;
  const saved = favorites.includes(product.id);
  const selectedVariant = product.variants?.find((variant) => variant.id === variantId);
  const points = product.specs.slice(0, 4);
  const city = addresses[0]?.city ?? null;

  function add(goToCheckout = false) {
    const result = addToCart(product!.id, quantity);
    if (!result.ok) {
      toast.error(
        result.reason === 'stock' ? 'Quantidade maior que o estoque.' : 'Produto esgotado.',
      );
      return;
    }
    const variantNote = selectedVariant ? ` · ${selectedVariant.label}` : '';
    if (goToCheckout) {
      schedulePush(() => router.push('/checkout'));
      return;
    }
    toast.success(`Adicionado ao carrinho${variantNote}`, {
      action: { label: 'Ver', onClick: () => schedulePush(() => router.push('/carrinho')) },
    });
  }

  function submitQuestion() {
    const text = question.trim();
    if (text.length < 3) {
      toast.error('Escreva sua pergunta.');
      return;
    }
    setQuestions((current) => [
      { id: `q-${Date.now()}`, text, createdAt: new Date().toISOString() },
      ...current,
    ]);
    setQuestion('');
    toast.success('Pergunta registrada neste aparelho.');
  }

  function showImage(index: number) {
    setImageIndex(index);
    document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <article className="pb-32 md:pb-0">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_clamp(26rem,30vw,36rem)]">
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-1">
          <div
            id="galeria"
            className="grid scroll-mt-28 items-start gap-4 md:grid-cols-[4.75rem_minmax(0,1fr)] lg:grid-cols-[4.75rem_minmax(14rem,20rem)_minmax(0,1fr)] xl:grid-cols-[4.75rem_minmax(16rem,24rem)_minmax(0,1fr)]"
          >
            <Gallery
              images={product.images}
              name={product.name}
              index={imageIndex}
              onSelect={setImageIndex}
            />
            <div className="@container flex h-full w-full min-w-0 flex-col gap-5 md:col-span-2 lg:col-span-1 lg:col-start-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  {category || subcategory ? (
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                      {category ? (
                        <Link href={`/categoria/${category.slug}`} className="text-primary">
                          {category.name}
                        </Link>
                      ) : null}
                      {category && subcategory ? (
                        <span className="text-muted-foreground" aria-hidden>
                          /
                        </span>
                      ) : null}
                      {subcategory ? (
                        <Link
                          href={`/subcategoria/${subcategory.slug}`}
                          className="text-primary"
                        >
                          {subcategory.name}
                        </Link>
                      ) : null}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {product.condition === 'novo' ? 'Novo' : 'Usado'}
                    <span aria-hidden> · </span>
                    <a href="#avaliacoes" className="font-medium text-primary">
                      {product.reviewCount.toLocaleString('pt-BR')}{' '}
                      {product.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                    </a>
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {product.name}
                  </h1>
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <StarScale rating={product.rating} />
                    <span className="font-medium">
                      {product.rating.toFixed(1).replace('.', ',')}
                    </span>
                    <a href="#avaliacoes" className="text-muted-foreground">
                      ({product.reviewCount})
                    </a>
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={saved}
                  aria-label={
                    saved
                      ? `Remover ${product.name} dos favoritos`
                      : `Salvar ${product.name} nos favoritos`
                  }
                  onClick={() => toggleFavorite(product.id)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-card ring-1 ring-border"
                >
                  <Heart className={cn('size-5', saved && 'fill-primary text-primary')} />
                </button>
              </div>

              <HeroPrice cents={product.price} compareAt={product.compareAtPrice} />
              <VariantPicker product={product} selectedId={variantId} onSelect={setVariantId} />

              <div className="w-full space-y-3">
                <h2 className="text-base font-semibold">
                  O que você precisa saber sobre este produto
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">{product.summary}</p>
                {points.length > 0 ? (
                  <ul className="grid w-full list-disc gap-x-8 gap-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground @min-[24rem]:grid-cols-2 @min-[24rem]:gap-y-2">
                    {points.map((spec) => (
                      <li key={spec.label}>
                        {spec.label}: {spec.value}.
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-4 md:grid-cols-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:grid-cols-1">
          <div className="md:col-span-2 lg:col-span-1">
            <BuyBox
              product={product}
              quantity={quantity}
              onQuantity={setQuantity}
              onAdd={add}
              city={city}
            />
          </div>
          <PaymentMethods price={product.price} />
          <RelatedList products={related} />
        </aside>

        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
          <Characteristics specs={product.specs} />
          <Description text={product.description} />
          <Questions
            questions={questions}
            draft={question}
            onDraft={setQuestion}
            onSubmit={submitQuestion}
          />
          <Reviews
            product={product}
            reviews={reviews}
            sort={reviewSort}
            onSort={setReviewSort}
            onPickImage={showImage}
          />
        </div>
      </div>

      <div className="buy-bar fixed inset-x-0 z-30 border-t border-border bg-card/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <p className="mx-auto mb-1.5 w-full text-xs text-muted-foreground">
          {soldOut
            ? 'Estoque indisponível'
            : `Estoque disponível · ${product.stock} ${product.stock === 1 ? 'unidade' : 'unidades'}`}
        </p>
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
            Adicionar ao carrinho
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
