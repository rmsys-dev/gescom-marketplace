'use client';

import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { EmptyState, Field } from '@/features/marketplace/components/bits';
import { UF_OPTIONS } from '@/features/marketplace/data';
import { maskPhone, maskZip, onlyDigits } from '@/features/marketplace/masks';
import { removeAddress, saveAddress, useMarketplace } from '@/features/marketplace/store';
import type { Address } from '@/features/marketplace/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';

const fieldInputClass = 'h-12 px-3 text-base md:text-base';

type AddressDraft = Omit<Address, 'id'>;

const EMPTY_DRAFT: AddressDraft = {
  label: 'Casa',
  recipient: '',
  phone: '',
  zip: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
};

const addressSchema = z.object({
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
});

function issuesOf(error: z.ZodError) {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

function formatAddressLine(address: Address) {
  const complement = address.complement ? `, ${address.complement}` : '';
  return `${address.street}, ${address.number}${complement}`;
}

function formatCityLine(address: Address) {
  return `${address.district} · ${address.city}/${address.state} · CEP ${address.zip}`;
}

function draftFrom(
  editing: Address | null,
  defaultRecipient: string,
  defaultPhone: string,
): AddressDraft {
  if (editing) {
    return {
      label: editing.label,
      recipient: editing.recipient,
      phone: editing.phone,
      zip: editing.zip,
      street: editing.street,
      number: editing.number,
      complement: editing.complement,
      district: editing.district,
      city: editing.city,
      state: editing.state,
    };
  }
  return {
    ...EMPTY_DRAFT,
    recipient: defaultRecipient,
    phone: defaultPhone,
  };
}

export function AddressesView() {
  const { addresses, user } = useMarketplace();
  const [editor, setEditor] = useState<Address | null | 'new'>(null);
  const [pendingRemove, setPendingRemove] = useState<Address | null>(null);

  const open = editor !== null;
  const editing = editor !== null && editor !== 'new' ? editor : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="hidden text-2xl font-semibold tracking-tight md:block">Endereços</h1>
        <Button
          type="button"
          className="ml-auto h-11 gap-2"
          tooltip={false}
          onClick={() => setEditor('new')}
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          Adicionar
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhum endereço"
          description="Cadastre um local para usar no checkout. Ele fica salvo neste aparelho."
          action={
            <Button
              type="button"
              className="h-12 w-full"
              tooltip={false}
              onClick={() => setEditor('new')}
            >
              Adicionar endereço
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {addresses.length} {addresses.length === 1 ? 'endereço' : 'endereços'}
          </p>
          <ul className="space-y-3">
            {addresses.map((address) => (
              <li key={address.id}>
                <article className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/8 sm:p-5">
                  <div className="flex gap-3 sm:gap-4">
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <MapPin className="size-5" strokeWidth={1.6} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h2 className="text-sm font-semibold tracking-tight">{address.label}</h2>
                        <span className="text-xs text-muted-foreground">{address.recipient}</span>
                      </div>
                      <p className="text-sm text-foreground">{formatAddressLine(address)}</p>
                      <p className="text-sm text-muted-foreground">{formatCityLine(address)}</p>
                      <p className="text-sm text-muted-foreground">{address.phone}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 sm:justify-end">
                    <Button
                      type="button"
                      variant="default"
                      className="h-10 flex-1 gap-2 sm:flex-none sm:px-4"
                      tooltip={false}
                      onClick={() => setEditor(address)}
                    >
                      <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-10 flex-1 gap-2 sm:flex-none sm:px-4"
                      tooltip={false}
                      onClick={() => setPendingRemove(address)}
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                      Remover
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}

      <AddressDialog
        key={open ? (editing?.id ?? 'new') : 'closed'}
        open={open}
        editing={editing}
        defaultRecipient={user?.name ?? ''}
        defaultPhone={user?.phone ?? ''}
        onOpenChange={(next) => {
          if (!next) setEditor(null);
        }}
        onSaved={() => setEditor(null)}
      />

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${pendingRemove?.label} sai da sua lista.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold text-muted-foreground bg-transparent border-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!pendingRemove) return;
                removeAddress(pendingRemove.id);
                toast.success('Endereço removido deste aparelho.');
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddressDialog({
  open,
  editing,
  defaultRecipient,
  defaultPhone,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  editing: Address | null;
  defaultRecipient: string;
  defaultPhone: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AddressDraft>(() =>
    draftFrom(editing, defaultRecipient, defaultPhone),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(issuesOf(parsed.error));
      return;
    }
    const address: Address = {
      ...parsed.data,
      id: editing?.id ?? `addr-${Date.now().toString(36)}`,
    };
    saveAddress(address);
    toast.success(
      editing ? 'Endereço atualizado neste aparelho.' : 'Endereço salvo neste aparelho.',
    );
    onSaved();
  }

  function set<K extends keyof AddressDraft>(key: K, next: AddressDraft[K]) {
    setForm((current) => ({ ...current, [key]: next }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-foreground/40"
        className={cn(
          'flex max-h-[92dvh] w-full flex-col gap-0 overflow-hidden p-0',
          'top-auto right-0 bottom-0 left-0 max-w-none translate-x-0 translate-y-0 rounded-none rounded-t-3xl',
          'pb-[env(safe-area-inset-bottom)]',
          'data-open:zoom-in-100 data-open:slide-in-from-bottom data-closed:zoom-out-100 data-closed:slide-out-to-bottom',
          'md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:pb-0',
          'md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95 md:data-closed:slide-out-to-bottom-0 md:data-closed:zoom-out-95',
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border md:hidden" aria-hidden />
        <DialogHeader className="shrink-0 px-4 pt-3 pb-1 text-left md:px-6 md:pt-6">
          <DialogTitle>{editing ? 'Editar endereço' : 'Novo endereço'}</DialogTitle>
          <DialogDescription>O CEP não busca a rua automaticamente.</DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={submit}
          data-lenis-prevent-touch
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Identificação"
                htmlFor="addr-label"
                error={errors.label}
                hint="Ex.: Casa, Trabalho"
              >
                <Input
                  id="addr-label"
                  className={fieldInputClass}
                  value={form.label}
                  aria-invalid={Boolean(errors.label)}
                  onChange={(event) => set('label', event.target.value)}
                />
              </Field>
              <Field label="Destinatário" htmlFor="addr-recipient" error={errors.recipient}>
                <Input
                  id="addr-recipient"
                  autoComplete="name"
                  className={fieldInputClass}
                  value={form.recipient}
                  aria-invalid={Boolean(errors.recipient)}
                  onChange={(event) => set('recipient', event.target.value)}
                />
              </Field>
              <Field label="Celular" htmlFor="addr-phone" error={errors.phone}>
                <Input
                  id="addr-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  className={fieldInputClass}
                  value={form.phone}
                  aria-invalid={Boolean(errors.phone)}
                  onChange={(event) => set('phone', maskPhone(event.target.value))}
                />
              </Field>
              <Field label="CEP" htmlFor="addr-zip" error={errors.zip}>
                <Input
                  id="addr-zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={fieldInputClass}
                  value={form.zip}
                  aria-invalid={Boolean(errors.zip)}
                  onChange={(event) => set('zip', maskZip(event.target.value))}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Rua" htmlFor="addr-street" error={errors.street}>
                  <Input
                    id="addr-street"
                    autoComplete="address-line1"
                    className={fieldInputClass}
                    value={form.street}
                    aria-invalid={Boolean(errors.street)}
                    onChange={(event) => set('street', event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 md:contents">
                <Field label="Número" htmlFor="addr-number" error={errors.number}>
                  <Input
                    id="addr-number"
                    className={fieldInputClass}
                    value={form.number}
                    aria-invalid={Boolean(errors.number)}
                    onChange={(event) => set('number', event.target.value)}
                  />
                </Field>
                <Field label="Complemento" htmlFor="addr-complement">
                  <Input
                    id="addr-complement"
                    className={fieldInputClass}
                    value={form.complement}
                    onChange={(event) => set('complement', event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Bairro" htmlFor="addr-district" error={errors.district}>
                <Input
                  id="addr-district"
                  className={fieldInputClass}
                  value={form.district}
                  aria-invalid={Boolean(errors.district)}
                  onChange={(event) => set('district', event.target.value)}
                />
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3 md:contents">
                <Field label="Cidade" htmlFor="addr-city" error={errors.city}>
                  <Input
                    id="addr-city"
                    autoComplete="address-level2"
                    className={fieldInputClass}
                    value={form.city}
                    aria-invalid={Boolean(errors.city)}
                    onChange={(event) => set('city', event.target.value)}
                  />
                </Field>
                <Field label="UF" htmlFor="addr-state" error={errors.state}>
                  <Select
                    value={form.state || undefined}
                    onValueChange={(value) => set('state', value)}
                  >
                    <SelectTrigger
                      id="addr-state"
                      aria-invalid={Boolean(errors.state)}
                      className={cn(
                        fieldInputClass,
                        'w-full min-w-0 justify-between border-primary/30 bg-transparent shadow-none',
                        'hover:enabled:not-focus-visible:border-ring/40',
                        'focus-visible:border-primary focus-visible:ring-0',
                        'data-[size=default]:h-12 dark:hover:bg-transparent',
                      )}
                    >
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      align="end"
                      className="max-h-60 min-w-(--radix-select-trigger-width)"
                    >
                      {UF_OPTIONS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-4 py-4 md:px-6">
            <Button type="submit" className="h-12 w-full md:w-auto md:min-w-44" tooltip={false}>
              {editing ? 'Salvar alterações' : 'Salvar endereço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
