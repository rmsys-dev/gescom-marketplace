'use client';

import {
  ChevronDown,
  FileText,
  MessageCircle,
  Package,
  Search,
  Star,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getProductById } from '@/features/marketplace/catalog';
import { EmptyState, STATUS_LABEL } from '@/features/marketplace/components/bits';
import { formatBRL } from '@/features/marketplace/money';
import {
  createReviewHref,
  estimatedArrival,
  formatDayMonth,
  itemMetaLine,
  itemQuantityLabel,
  orderStatusHeadline,
  paymentMethodLabel,
} from '@/features/marketplace/order-helpers';
import {
  addToCart,
  ORDER_FLOW,
  pendingReviewItems,
  useMarketplace,
} from '@/features/marketplace/store';
import type { Order, OrderItem, OrderStatus } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';

type DateFilter = 'todas' | '30d' | '6m' | 'ano';

function statusTone(status: OrderStatus) {
  if (status === 'entregue') return 'text-success';
  if (status === 'enviado') return 'text-primary';
  if (status === 'preparando') return 'text-warning';
  return 'text-info';
}

function buyAgain(productId: string) {
  const result = addToCart(productId, 1);
  if (!result.ok) {
    toast.error(
      result.reason === 'stock' ? 'Estoque insuficiente para este produto.' : 'Produto indisponível.',
    );
    return;
  }
  toast.success('Adicionado ao carrinho', {
    action: {
      label: 'Ver carrinho',
      onClick: () => {
        window.location.href = '/carrinho';
      },
    },
  });
}

function matchesDate(iso: string, filter: DateFilter) {
  if (filter === 'todas') return true;
  const created = new Date(iso).getTime();
  const now = Date.now();
  if (filter === '30d') return now - created <= 30 * 24 * 60 * 60 * 1000;
  if (filter === '6m') return now - created <= 182 * 24 * 60 * 60 * 1000;
  return new Date(iso).getFullYear() === new Date().getFullYear();
}

export function OrdersView() {
  const { orders, reviews, categories } = useMarketplace();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todas');

  const pending = useMemo(() => pendingReviewItems(orders, reviews), [orders, reviews]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    return orders.filter((order) => {
      if (!matchesDate(order.createdAt, dateFilter)) return false;
      if (category) {
        const inCategory = order.items.some(
          (item) => getProductById(item.productId)?.categorySlug === category,
        );
        if (!inCategory) return false;
      }
      if (!term) return true;
      const haystack = [
        order.code,
        ...order.items.map((item) => item.name),
        ...order.items.map((item) => getProductById(item.productId)?.summary ?? ''),
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      return haystack.includes(term);
    });
  }, [orders, query, category, dateFilter]);

  return (
    <div className="space-y-4">
      <h1 className="hidden text-2xl font-semibold tracking-tight md:block">Compras</h1>

      <div className="flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/8 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar compras</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por compra, marca e mais..."
            className="h-11 rounded-full border-border bg-background pl-9"
          />
        </label>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
          <Select
            value={category || 'todas'}
            onValueChange={(value) => setCategory(value === 'todas' ? '' : value)}
          >
            <SelectTrigger
              aria-label="Filtrar por categoria"
              size="default"
              className="h-11 w-full min-w-0 flex-1 border-border bg-background sm:w-44 sm:flex-none"
            >
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="min-w-(--radix-select-trigger-width)"
            >
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as DateFilter)}
          >
            <SelectTrigger
              aria-label="Filtrar por data"
              size="default"
              className="h-11 w-full min-w-0 flex-1 border-border bg-background sm:w-44 sm:flex-none"
            >
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="end"
              className="min-w-(--radix-select-trigger-width)"
            >
              <SelectItem value="todas">Sempre</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {orders.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'compra' : 'compras'}
        </p>
      ) : null}

      {pending.length > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-card ring-1 ring-foreground/8">
          <div className="relative size-12 shrink-0">
            <span className="absolute inset-0 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
              {pending[0]?.image ? (
                <Image src={pending[0].image} alt="" fill sizes="48px" className="object-cover" />
              ) : null}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-warning text-white shadow-sm">
              <Star className="size-3 fill-current" aria-hidden />
            </span>
          </div>
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {pending.length}{' '}
            {pending.length === 1 ? 'produto espera' : 'produtos esperam'} sua opinião
          </p>
          <Button asChild variant="secondary" className="h-10 shrink-0 px-5" tooltip={false}>
            <Link href="/conta/avaliacoes">Opinar</Link>
          </Button>
        </div>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum pedido"
          description="Quando você confirmar um checkout, ele aparece aqui."
          action={
            <Button asChild className="h-12 w-full" tooltip={false}>
              <Link href="/busca">Ver produtos</Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma compra encontrada"
          description="Ajuste a busca ou os filtros para ver outros pedidos."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((order) => (
            <li key={order.id}>
              <OrderPurchaseCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderPurchaseCard({ order }: { order: Order }) {
  const cover = order.items[0];
  if (!cover) return null;

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-foreground/8">
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-foreground">{formatDayMonth(order.createdAt)}</p>
      </header>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/8 sm:size-24">
            {cover.image ? (
              <Image src={cover.image} alt="" fill sizes="96px" className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className={cn('text-sm font-semibold', statusTone(order.status))}>
              {STATUS_LABEL[order.status]}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
              <span>{orderStatusHeadline(order.status, order.createdAt)}</span>
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{cover.name}</p>
            <p className="text-xs text-muted-foreground">
              {order.items.length > 1
                ? `${order.items.length} itens · ${itemQuantityLabel(cover.quantity)}`
                : itemMetaLine(cover)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-44 sm:justify-center">
          <Button asChild className="h-11 w-full" tooltip={false}>
            <Link href={`/conta/pedidos/${order.id}`}>Ver compra</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full"
            tooltip={false}
            onClick={() => buyAgain(cover.productId)}
          >
            Comprar novamente
          </Button>
        </div>
      </div>
    </article>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const { orders, reviews, hydrated } = useMarketplace();
  const order = orders.find((item) => item.id === id);

  if (!hydrated) return <p className="text-sm text-muted-foreground">Carregando pedido…</p>;
  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Pedido não encontrado"
        description="Ele não está salvo neste aparelho."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/conta/pedidos">Ver pedidos</Link>
          </Button>
        }
      />
    );
  }

  return <OrderStatusView order={order} reviews={reviews} />;
}

function OrderStatusView({
  order,
  reviews,
}: {
  order: Order;
  reviews: { orderId: string; productId: string }[];
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const cover = order.items[0];
  const product = cover ? getProductById(cover.productId) : null;
  const arrival = estimatedArrival(order.createdAt);
  const pendingItem = cover
    ? !reviews.some((review) => review.orderId === order.id && review.productId === cover.productId)
    : false;
  const addressLine = `${order.address.street} ${order.address.number}${order.address.complement ? `, ${order.address.complement}` : ''
    }, ${order.address.district}, ${order.address.city}, ${order.address.state}`;

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="hidden text-sm text-muted-foreground md:block">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/conta/pedidos" className="hover:text-foreground">
              Compras
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-foreground">Status da compra</li>
        </ol>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {cover ? (
            <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    {cover.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {itemQuantityLabel(cover.quantity)}
                    {product ? (
                      <>
                        {' · '}
                        <Link
                          href={`/produto/${product.slug}`}
                          className="font-medium text-primary hover:underline"
                        >
                          Ver detalhe
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/8">
                  {cover.image ? (
                    <Image src={cover.image} alt="" fill sizes="64px" className="object-cover" />
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
            <p className={cn('text-sm font-semibold', statusTone(order.status))}>
              {STATUS_LABEL[order.status]}
            </p>
            <h2 className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xl font-semibold tracking-tight">
              <span>{orderStatusHeadline(order.status, order.createdAt)}</span>
            </h2>
            {order.status === 'entregue' ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Entregamos seu pacote na {addressLine}.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Previsão: {formatDayMonth(arrival)} · {addressLine}.
              </p>
            )}
            {cover ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-4 h-11 px-5"
                tooltip={false}
                onClick={() => buyAgain(cover.productId)}
              >
                Comprar novamente
              </Button>
            ) : null}
          </section>

          {cover && pendingItem && order.status === 'entregue' ? (
            <section className="rounded-2xl bg-card px-4 py-4 shadow-card ring-1 ring-foreground/8 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-foreground">
                  O que você achou do produto?
                </p>
                <div className="flex items-center gap-1" role="group" aria-label="Avaliar produto">
                  {Array.from({ length: 5 }, (_, index) => {
                    const rating = index + 1;
                    return (
                      <Link
                        key={rating}
                        href={createReviewHref(order.id, cover.productId, rating)}
                        className="rounded-md p-1 text-border transition-colors hover:text-primary"
                        aria-label={`${rating} estrela${rating > 1 ? 's' : ''}`}
                      >
                        <Star className="size-7 fill-transparent" strokeWidth={1.5} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-foreground/8">
            <h2 className="px-4 pt-4 text-base font-semibold tracking-tight sm:px-5">
              Ajuda com a compra
            </h2>
            <ul className="mt-2 divide-y divide-border">
              {[
                'Minha compra apresentou um problema',
                'Tenho um problema com o pagamento',
                'Preciso de ajuda com a NF-e',
              ].map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center px-4 text-left text-sm text-foreground transition-colors hover:bg-muted/50 sm:px-5"
                    onClick={() =>
                      toast.message('Ajuda simulada', {
                        description: 'Neste demo não há atendimento real.',
                      })
                    }
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
            <h2 className="text-base font-semibold tracking-tight">Informações da compra</h2>
            <div className="mt-3 flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <FileText className="size-5" strokeWidth={1.6} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{cover?.name ?? order.code}</p>
                <p className="text-sm text-muted-foreground">
                  Gerada em {formatDayMonth(order.createdAt)}
                </p>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  onClick={() =>
                    toast.message('Nota fiscal', {
                      description: 'Download simulado neste aparelho.',
                    })
                  }
                >
                  Baixar nota fiscal
                  <ChevronDown className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
            <h2 className="text-base font-semibold tracking-tight">Mensagens da compra</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <MessageCircle className="size-5" strokeWidth={1.6} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">Assistente da loja</p>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() =>
                    toast.message('Mensagens', {
                      description: 'Não há mensagens neste pedido de demonstração.',
                    })
                  }
                >
                  Ver mensagens
                </button>
              </div>
            </div>
          </section>

          <OrderTimeline status={order.status} />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[calc(var(--store-header-h,4rem)+1.5rem)] lg:self-start">
          <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
            <h2 className="text-base font-semibold tracking-tight">Detalhe da compra</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDayMonth(order.createdAt)} | # {order.code}
            </p>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Produto</dt>
                <dd>{formatBRL(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Frete</dt>
                <dd>{order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatBRL(order.subtotal + order.shipping)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Pagamento</dt>
                <dd className="text-right">{paymentMethodLabel(order.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2.5 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatBRL(order.total)}</dd>
              </div>
            </dl>
          </section>

          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-primary">
                Detalhes do pagamento e envio
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 transition-transform',
                    detailsOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-3">
                <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/8">
                  <p className="text-sm font-medium">{paymentMethodLabel(order.paymentMethod)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDayMonth(order.createdAt)} · {order.code}
                  </p>
                  <p className="mt-2 text-sm font-medium text-success">Pagamento aprovado</p>
                </div>
                <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/8">
                  <div className="flex gap-3">
                    <Truck className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-sm font-medium">Endereço de entrega</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.address.recipient}
                        <br />
                        {addressLine}
                        <br />
                        CEP {order.address.zip}
                      </p>
                    </div>
                  </div>
                </div>
                {order.items.map((item) => (
                  <OrderSidebarItem key={`${item.productId}-${item.name}`} item={item} />
                ))}
              </CollapsibleContent>
            </section>
          </Collapsible>
        </aside>
      </div>
    </div>
  );
}

function OrderSidebarItem({ item }: { item: OrderItem }) {
  return (
    <div className="flex gap-3 rounded-xl bg-background p-3 ring-1 ring-foreground/8">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatBRL(item.price)} · {itemQuantityLabel(item.quantity)}
        </p>
      </div>
    </div>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const step = ORDER_FLOW.indexOf(status);
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
      <h2 className="text-base font-semibold tracking-tight">Acompanhamento</h2>
      <ol className="mt-3 grid grid-cols-4 gap-2" aria-label="Situação do pedido">
        {ORDER_FLOW.map((item, index) => (
          <li key={item} className="space-y-1">
            <span
              className={cn('block h-1 rounded-full', index <= step ? 'bg-primary' : 'bg-muted')}
            />
            <span className="block text-[11px] leading-tight text-muted-foreground">
              {STATUS_LABEL[item]}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function OrderPanel({
  order,
  confirmation = false,
}: {
  order: Order;
  confirmation?: boolean;
}) {
  const step = ORDER_FLOW.indexOf(order.status);
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {confirmation ? 'Pedido registrado' : 'Pedido'}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{order.code}</h1>
        <p className="text-sm text-muted-foreground">{formatDayMonth(order.createdAt)}</p>
      </header>
      {confirmation ? (
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          Guardamos o pedido neste navegador. Nenhum pagamento foi processado.
        </p>
      ) : null}
      <ol className="grid grid-cols-4 gap-2" aria-label="Situação do pedido">
        {ORDER_FLOW.map((status, index) => (
          <li key={status} className="space-y-1">
            <span
              className={cn('block h-1 rounded-full', index <= step ? 'bg-primary' : 'bg-muted')}
            />
            <span className="block text-[11px] leading-tight text-muted-foreground">
              {STATUS_LABEL[status]}
            </span>
          </li>
        ))}
      </ol>
      <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-foreground/10">
        {order.items.map((item) => (
          <li
            key={`${item.productId}-${item.name}`}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span>
              <span className="block font-medium">{item.name}</span>
              <span className="text-muted-foreground">Qtd. {item.quantity}</span>
            </span>
            <span className="font-medium">{formatBRL(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <section className="space-y-1 rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10">
        <h2 className="font-semibold">Entrega</h2>
        <p>{order.address.recipient}</p>
        <p className="text-muted-foreground">
          {order.address.street}, {order.address.number}
          {order.address.complement ? ` · ${order.address.complement}` : ''} ·{' '}
          {order.address.district} · {order.address.city}/{order.address.state}
        </p>
        <p className="text-muted-foreground">CEP {order.address.zip}</p>
      </section>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatBRL(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Frete</dt>
          <dd>{order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatBRL(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
