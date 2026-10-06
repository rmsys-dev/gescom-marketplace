'use client';

import { ChevronRight, Heart, LogOut, MapPin, Package, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

import {
  controlClass,
  EmptyState,
  Field,
  formatWhen,
  StatusBadge,
  STATUS_LABEL,
} from '@/features/marketplace/components/bits';
import { UF_OPTIONS } from '@/features/marketplace/data';
import { maskPhone, maskZip, onlyDigits } from '@/features/marketplace/masks';
import { formatBRL } from '@/features/marketplace/money';
import {
  ORDER_FLOW,
  logout,
  removeAddress,
  saveAddress,
  updateProfile,
  useMarketplace,
} from '@/features/marketplace/store';
import type { Address, Order } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

const profileSchema = z.object({
  name: z.string().trim().min(3, 'Informe nome e sobrenome.'),
  email: z.email('Informe um e-mail válido.'),
  phone: z
    .string()
    .refine(
      (value) => value === '' || onlyDigits(value).length === 11,
      'Informe um celular com DDD.',
    ),
});

function issuesOf(error: z.ZodError) {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

export function AccountGate({ children }: { children: React.ReactNode }) {
  const { hydrated, user } = useMarketplace();
  if (!hydrated) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    );
  }
  if (!user) {
    return (
      <EmptyState
        icon={UserRound}
        title="Entre para continuar"
        description="A conta fica neste aparelho. Use um e-mail válido e uma senha com 6 caracteres ou mais."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/entrar">Entrar</Link>
          </Button>
        }
      />
    );
  }
  return children;
}

const MENU = [
  { href: '/conta/pedidos', label: 'Pedidos', hint: 'Acompanhe o que você comprou', icon: Package },
  {
    href: '/conta/favoritos',
    label: 'Favoritos',
    hint: 'Produtos salvos neste aparelho',
    icon: Heart,
  },
  {
    href: '/conta/enderecos',
    label: 'Endereços',
    hint: 'Onde os pedidos podem chegar',
    icon: MapPin,
  },
  {
    href: '/conta/perfil',
    label: 'Dados pessoais',
    hint: 'Nome, e-mail e celular',
    icon: UserRound,
  },
] as const;

export function AccountHome() {
  const { user } = useMarketplace();
  return (
    <AccountGate>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {user?.name.slice(0, 1)}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{user?.name}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </header>
        <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {MENU.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href} className="border-b border-border last:border-b-0">
                <Link href={item.href} className="flex min-h-16 items-center gap-3 px-4">
                  <Icon className="size-5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          tooltip={false}
          onClick={() => logout()}
        >
          <LogOut />
          Sair
        </Button>
      </div>
    </AccountGate>
  );
}

export function OrdersView() {
  const { orders } = useMarketplace();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
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
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const cover = order.items[0];
  return (
    <Link
      href={`/conta/pedidos/${order.id}`}
      className="block rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{order.code}</p>
          <p className="text-xs text-muted-foreground">{formatWhen(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm">{order.items.map((item) => item.name).join(', ')}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {cover
            ? `${order.items.length} ${order.items.length === 1 ? 'item' : 'itens'}`
            : 'Sem itens'}
        </span>
        <span className="font-semibold">{formatBRL(order.total)}</span>
      </div>
      {order.demo ? (
        <p className="mt-2 text-xs text-muted-foreground">Pedido de demonstração</p>
      ) : null}
    </Link>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const { orders, hydrated } = useMarketplace();
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
  return <OrderPanel order={order} />;
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
        <p className="text-sm text-muted-foreground">{formatWhen(order.createdAt)}</p>
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

export function OrderConfirmation({ id }: { id: string }) {
  const { orders, hydrated } = useMarketplace();
  const order = orders.find((item) => item.id === id);
  if (!hydrated) return <p className="text-sm text-muted-foreground">Carregando pedido…</p>;
  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Pedido não encontrado"
        description="Abra a conta neste mesmo navegador para ver os pedidos salvos."
        action={
          <Button asChild className="h-12 w-full" tooltip={false}>
            <Link href="/">Ir para o início</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <OrderPanel order={order} confirmation />
      <Button asChild className="h-12 w-full" tooltip={false}>
        <Link href="/conta/pedidos">Ver meus pedidos</Link>
      </Button>
    </div>
  );
}

export function AddressesView() {
  const { addresses } = useMarketplace();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <AccountGate>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Endereços</h1>
          <Button type="button" className="h-11" tooltip={false} onClick={() => setOpen(true)}>
            Adicionar
          </Button>
        </div>
        {addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Nenhum endereço"
            description="Cadastre um local para usar no checkout."
          />
        ) : (
          <ul className="space-y-3">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <p className="text-sm font-semibold">{address.label}</p>
                <p className="mt-1 text-sm">{address.recipient}</p>
                <p className="text-sm text-muted-foreground">
                  {address.street}, {address.number} · {address.city}/{address.state}
                </p>
                <button
                  type="button"
                  className="mt-3 min-h-11 text-sm font-medium text-destructive"
                  onClick={() => {
                    if (confirmId === address.id) {
                      removeAddress(address.id);
                      setConfirmId(null);
                      return;
                    }
                    setConfirmId(address.id);
                  }}
                >
                  {confirmId === address.id ? 'Confirmar remoção' : 'Remover'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <AddressSheet open={open} onOpenChange={setOpen} />
      </div>
    </AccountGate>
  );
}

function AddressSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useMarketplace();
  const [form, setForm] = useState({
    label: 'Casa',
    recipient: user?.name ?? '',
    phone: user?.phone ?? '',
    zip: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = z
      .object({
        label: z.string().trim().min(2, 'Dê um nome ao endereço.'),
        recipient: z.string().trim().min(3, 'Informe quem recebe.'),
        phone: z
          .string()
          .refine((value) => onlyDigits(value).length === 11, 'Informe um celular com DDD.'),
        zip: z
          .string()
          .refine((value) => onlyDigits(value).length === 8, 'Informe um CEP com 8 dígitos.'),
        street: z.string().trim().min(3, 'Informe a rua.'),
        number: z.string().trim().min(1, 'Informe o número.'),
        complement: z.string(),
        district: z.string().trim().min(2, 'Informe o bairro.'),
        city: z.string().trim().min(2, 'Informe a cidade.'),
        state: z.string().length(2, 'Escolha a UF.'),
      })
      .safeParse(form);
    if (!parsed.success) {
      setErrors(issuesOf(parsed.error));
      return;
    }
    const address: Address = { ...parsed.data, id: `addr-${Date.now().toString(36)}` };
    saveAddress(address);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        data-lenis-prevent-touch
      >
        <SheetHeader>
          <SheetTitle>Novo endereço</SheetTitle>
          <SheetDescription>O CEP não busca a rua automaticamente.</SheetDescription>
        </SheetHeader>
        <form className="space-y-4 px-4 pb-4" onSubmit={submit}>
          <Field label="Identificação" htmlFor="new-label" error={errors.label}>
            <input
              id="new-label"
              className={controlClass}
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
            />
          </Field>
          <Field label="Destinatário" htmlFor="new-recipient" error={errors.recipient}>
            <input
              id="new-recipient"
              className={controlClass}
              value={form.recipient}
              onChange={(event) => setForm({ ...form, recipient: event.target.value })}
            />
          </Field>
          <Field label="Celular" htmlFor="new-phone" error={errors.phone}>
            <input
              id="new-phone"
              inputMode="tel"
              className={controlClass}
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: maskPhone(event.target.value) })}
            />
          </Field>
          <Field label="CEP" htmlFor="new-zip" error={errors.zip}>
            <input
              id="new-zip"
              inputMode="numeric"
              className={controlClass}
              value={form.zip}
              onChange={(event) => setForm({ ...form, zip: maskZip(event.target.value) })}
            />
          </Field>
          <Field label="Rua" htmlFor="new-street" error={errors.street}>
            <input
              id="new-street"
              className={controlClass}
              value={form.street}
              onChange={(event) => setForm({ ...form, street: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número" htmlFor="new-number" error={errors.number}>
              <input
                id="new-number"
                className={controlClass}
                value={form.number}
                onChange={(event) => setForm({ ...form, number: event.target.value })}
              />
            </Field>
            <Field label="Complemento" htmlFor="new-complement">
              <input
                id="new-complement"
                className={controlClass}
                value={form.complement}
                onChange={(event) => setForm({ ...form, complement: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Bairro" htmlFor="new-district" error={errors.district}>
            <input
              id="new-district"
              className={controlClass}
              value={form.district}
              onChange={(event) => setForm({ ...form, district: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
            <Field label="Cidade" htmlFor="new-city" error={errors.city}>
              <input
                id="new-city"
                className={controlClass}
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </Field>
            <Field label="UF" htmlFor="new-state" error={errors.state}>
              <select
                id="new-state"
                className={controlClass}
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              >
                <option value="">UF</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button type="submit" className="h-12 w-full" tooltip={false}>
            Salvar endereço
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function ProfileView() {
  return (
    <AccountGate>
      <ProfileForm />
    </AccountGate>
  );
}

function ProfileForm() {
  const { user } = useMarketplace();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = profileSchema.safeParse(form);
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          setSaved(false);
          return;
        }
        updateProfile(parsed.data);
        setErrors({});
        setSaved(true);
      }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">Dados pessoais</h1>
      <Field label="Nome" htmlFor="profile-name" error={errors.name}>
        <input
          id="profile-name"
          autoComplete="name"
          className={controlClass}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </Field>
      <Field label="E-mail" htmlFor="profile-email" error={errors.email}>
        <input
          id="profile-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={controlClass}
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </Field>
      <Field
        label="Celular"
        htmlFor="profile-phone"
        error={errors.phone}
        hint="Opcional até o checkout."
      >
        <input
          id="profile-phone"
          inputMode="tel"
          autoComplete="tel"
          className={controlClass}
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: maskPhone(event.target.value) })}
        />
      </Field>
      {saved ? (
        <p className="text-sm text-success" role="status">
          Dados atualizados neste aparelho.
        </p>
      ) : null}
      <Button type="submit" className="h-12 w-full" tooltip={false}>
        Salvar
      </Button>
    </form>
  );
}
