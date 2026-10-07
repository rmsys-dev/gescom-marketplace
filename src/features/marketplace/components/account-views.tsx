'use client';

import { MapPin, Package, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

import { ACCOUNT_NAV } from '@/features/marketplace/account-nav';
import { OrderPanel } from '@/features/marketplace/components/account-orders';
import {
  controlClass,
  EmptyState,
  Field,
} from '@/features/marketplace/components/bits';
import { UF_OPTIONS } from '@/features/marketplace/data';
import { maskPhone, maskZip, onlyDigits } from '@/features/marketplace/masks';
import {
  removeAddress,
  saveAddress,
  updateProfile,
  useMarketplace,
} from '@/features/marketplace/store';
import type { Address } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Skeleton } from '@/shared/components/ui/skeleton';

export { OrdersView, OrderDetail } from '@/features/marketplace/components/account-orders';
export {
  CreateReviewView,
  ReviewsView,
} from '@/features/marketplace/components/account-reviews';

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

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
      <div className="mx-auto w-full max-w-lg space-y-3 px-4 py-8" aria-hidden>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8">
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
      </div>
    );
  }
  return children;
}

export function AccountHome() {
  const { user } = useMarketplace();
  if (!user) return null;

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex items-center gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold tracking-wide text-foreground"
          aria-hidden
        >
          {userInitials(user.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{user.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <section aria-label="Atalhos da conta">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ACCOUNT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full min-h-30 flex-col gap-3 rounded-2xl bg-card p-5 shadow-card ring-1 ring-foreground/8 transition-colors hover:ring-primary/25"
                >
                  <Icon className="size-6 text-foreground" strokeWidth={1.6} aria-hidden />
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold tracking-tight">{item.label}</span>
                    <span className="block text-sm leading-snug text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="hidden text-2xl font-semibold tracking-tight md:block">Endereços</h1>
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
  return <ProfileForm />;
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
      <h1 className="hidden text-2xl font-semibold tracking-tight md:block">Dados pessoais</h1>
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
