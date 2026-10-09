'use client';

import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { startTransition, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { AuthApiError, lookupCep } from '@/features/marketplace/address-api';
import { EmptyState, Field } from '@/features/marketplace/components/bits';
import { maskZip, onlyDigits } from '@/features/marketplace/masks';
import {
  createUserAddress,
  loadAddresses,
  removeAddress,
  updateUserAddress,
  useMarketplace,
} from '@/features/marketplace/store';
import type { Address, AddressType } from '@/features/marketplace/types';
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
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

const fieldInputClass = 'h-12 px-3 text-base md:text-base';

const ADDRESS_TYPES: { value: AddressType; label: string }[] = [
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'ENTREGA', label: 'Entrega' },
  { value: 'COBRANCA', label: 'Cobrança' },
  { value: 'RESIDENCIAL', label: 'Residencial' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OUTRO', label: 'Outro' },
];

type AddressDraft = {
  resolved: boolean;
  adressType: AddressType;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

const EMPTY_DRAFT: AddressDraft = {
  resolved: false,
  adressType: 'ENTREGA',
  zip: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
};

const addressSchema = z.object({
  resolved: z
    .boolean()
    .refine((value) => value, 'Consulte um CEP válido antes de salvar.'),
  adressType: z.enum([
    'PRINCIPAL',
    'ENTREGA',
    'COBRANCA',
    'RESIDENCIAL',
    'COMERCIAL',
    'FATURAMENTO',
    'SECUNDARIO',
    'OUTRO',
  ]),
  zip: z
    .string()
    .refine((value) => onlyDigits(value).length === 8, 'Informe um CEP com 8 dígitos.'),
  street: z.string().trim().min(1, 'Consulte o CEP para preencher a rua.'),
  number: z.string().trim().min(1, 'Informe o número.').max(255),
  complement: z.string().max(255),
  district: z.string().trim().min(1, 'Consulte o CEP para preencher o bairro.'),
  city: z.string().trim().min(1, 'Consulte o CEP para preencher a cidade.'),
  state: z.string().length(2, 'Consulte o CEP para preencher a UF.'),
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
  const cityState = address.state
    ? `${address.city}/${address.state}`
    : address.city;
  return `${address.district} · ${cityState} · CEP ${address.zip}`;
}

function draftFrom(editing: Address | null, hasPrincipal: boolean): AddressDraft {
  if (editing) {
    return {
      resolved: onlyDigits(editing.zip).length === 8 && Boolean(editing.street),
      adressType: editing.adressType ?? 'ENTREGA',
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
    adressType: hasPrincipal ? 'ENTREGA' : 'PRINCIPAL',
  };
}

export function AddressesView() {
  const { addresses, user, hydrated } = useMarketplace();
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<Address | null | 'new'>(null);
  const [pendingRemove, setPendingRemove] = useState<Address | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!hydrated || !user?.id) {
      startTransition(() => setLoading(false));
      return;
    }

    let active = true;
    let timer: number | undefined;
    startTransition(() => setLoading(true));

    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => {
        reject(new Error('ADDRESS_LOAD_TIMEOUT'));
      }, 20_000);
    });

    void Promise.race([loadAddresses(), timeout])
      .catch(() => {
        if (active) toast.error('Não foi possível carregar os endereços.');
      })
      .finally(() => {
        if (timer !== undefined) window.clearTimeout(timer);
        if (active) startTransition(() => setLoading(false));
      });

    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [hydrated, user?.id]);

  const open = editor !== null;
  const editing = editor !== null && editor !== 'new' ? editor : null;
  const hasPrincipal = addresses.some((item) => item.adressType === 'PRINCIPAL');

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-11 w-36 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

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
          description="Cadastre um local para usar no checkout. Ele fica salvo na sua conta."
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
                        {address.adressType === 'PRINCIPAL' ? (
                          <span className="text-xs font-medium text-primary">Padrão</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-foreground">{formatAddressLine(address)}</p>
                      <p className="text-sm text-muted-foreground">{formatCityLine(address)}</p>
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
        hasPrincipal={hasPrincipal}
        onOpenChange={(next) => {
          if (!next) setEditor(null);
        }}
        onSaved={() => setEditor(null)}
      />

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${pendingRemove?.label ?? 'Este endereço'} será removido da sua conta.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold text-muted-foreground bg-transparent border-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removing}
              onClick={() => {
                if (!pendingRemove) return;
                setRemoving(true);
                void removeAddress(pendingRemove.id)
                  .then(() => {
                    toast.success('Endereço removido.');
                    setPendingRemove(null);
                  })
                  .catch((error) => {
                    toast.error(
                      error instanceof AuthApiError
                        ? error.message
                        : 'Não foi possível remover o endereço.',
                    );
                  })
                  .finally(() => setRemoving(false));
              }}
            >
              {removing ? 'Removendo…' : 'Remover'}
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
  hasPrincipal,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  editing: Address | null;
  hasPrincipal: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AddressDraft>(() => draftFrom(editing, hasPrincipal));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [pending, setPending] = useState(false);

  function set<K extends keyof AddressDraft>(key: K, next: AddressDraft[K]) {
    setForm((current) => ({ ...current, [key]: next }));
    setErrors((current) => {
      if (!current[key]) return current;
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
  }

  async function resolveCep(rawZip: string) {
    const digits = onlyDigits(rawZip);
    if (digits.length !== 8) return;

    setLookingUp(true);
    setFormError('');
    try {
      const data = await lookupCep(digits);
      setForm((current) => ({
        ...current,
        resolved: true,
        zip: maskZip(data.cepNumber),
        street: data.address,
        district: data.neighborhood,
        city: data.cityName,
        state: data.uf,
      }));
      setErrors((current) => {
        const next = { ...current };
        delete next.zip;
        delete next.resolved;
        delete next.street;
        delete next.district;
        delete next.city;
        delete next.state;
        return next;
      });
    } catch (error) {
      setForm((current) => ({
        ...current,
        resolved: false,
        street: '',
        district: '',
        city: '',
        state: '',
      }));
      setErrors((current) => ({
        ...current,
        zip:
          error instanceof AuthApiError
            ? error.message
            : 'Não foi possível consultar o CEP.',
      }));
    } finally {
      setLookingUp(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(issuesOf(parsed.error));
      return;
    }

    const cepNumber = onlyDigits(parsed.data.zip);
    setPending(true);
    try {
      if (editing) {
        await updateUserAddress(editing.id, {
          cepNumber,
          number: parsed.data.number,
          complement: parsed.data.complement || null,
          adressType: parsed.data.adressType,
        });
        toast.success('Endereço atualizado.');
      } else {
        await createUserAddress({
          cepNumber,
          number: parsed.data.number,
          complement: parsed.data.complement || undefined,
          adressType: parsed.data.adressType,
        });
        toast.success('Endereço salvo na sua conta.');
      }
      onSaved();
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === 'USER_ADDRESS_PRINCIPAL_ALREADY_EXISTS') {
          setFormError('Já existe um endereço principal. Escolha outro tipo ou edite o atual.');
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError('Não foi possível salvar o endereço.');
      }
    } finally {
      setPending(false);
    }
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
          <DialogDescription>
            Digite o CEP para preencher rua, bairro, cidade e UF automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            void submit(event);
          }}
          data-lenis-prevent-touch
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-6">
            {formError ? (
              <p
                className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {formError}
              </p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo" htmlFor="addr-type" error={errors.adressType}>
                <Select
                  value={form.adressType}
                  onValueChange={(value) => set('adressType', value as AddressType)}
                >
                  <SelectTrigger
                    id="addr-type"
                    aria-invalid={Boolean(errors.adressType)}
                    className={cn(
                      fieldInputClass,
                      'w-full min-w-0 justify-between border-primary/30 bg-transparent shadow-none',
                      'data-[size=default]:h-12 dark:hover:bg-transparent',
                    )}
                  >
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPES.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        disabled={
                          type.value === 'PRINCIPAL' &&
                          hasPrincipal &&
                          editing?.adressType !== 'PRINCIPAL'
                        }
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="CEP"
                htmlFor="addr-zip"
                error={errors.zip || errors.resolved}
                hint={lookingUp ? 'Consultando CEP…' : 'Ao completar 8 dígitos, buscamos o endereço.'}
              >
                <Input
                  id="addr-zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={fieldInputClass}
                  value={form.zip}
                  aria-invalid={Boolean(errors.zip || errors.resolved)}
                  onChange={(event) => {
                    const next = maskZip(event.target.value);
                    set('zip', next);
                    set('resolved', false);
                    if (onlyDigits(next).length === 8) {
                      void resolveCep(next);
                    }
                  }}
                  onBlur={() => {
                    if (onlyDigits(form.zip).length === 8 && !form.resolved) {
                      void resolveCep(form.zip);
                    }
                  }}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Rua" htmlFor="addr-street" error={errors.street}>
                  <Input
                    id="addr-street"
                    autoComplete="address-line1"
                    className={fieldInputClass}
                    value={form.street}
                    readOnly
                    aria-invalid={Boolean(errors.street)}
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
                <Field label="Complemento" htmlFor="addr-complement" error={errors.complement}>
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
                  readOnly
                  aria-invalid={Boolean(errors.district)}
                />
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3 md:contents">
                <Field label="Cidade" htmlFor="addr-city" error={errors.city}>
                  <Input
                    id="addr-city"
                    autoComplete="address-level2"
                    className={fieldInputClass}
                    value={form.city}
                    readOnly
                    aria-invalid={Boolean(errors.city)}
                  />
                </Field>
                <Field label="UF" htmlFor="addr-state" error={errors.state}>
                  <Input
                    id="addr-state"
                    className={fieldInputClass}
                    value={form.state}
                    readOnly
                    aria-invalid={Boolean(errors.state)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-4 py-4 md:px-6">
            <Button
              type="submit"
              className="h-12 w-full md:w-auto md:min-w-44"
              tooltip={false}
              disabled={pending || lookingUp}
            >
              {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar endereço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
