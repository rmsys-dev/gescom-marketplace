'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { AuthApiError, lookupCep } from '@/features/marketplace/address-api';
import { resolveCart } from '@/features/marketplace/catalog';
import { controlClass, Field } from '@/features/marketplace/components/bits';
import {
  maskCardNumber,
  maskExpiry,
  maskPhone,
  maskZip,
  onlyDigits,
} from '@/features/marketplace/masks';
import { cartTotals, formatBRL } from '@/features/marketplace/money';
import { schedulePush } from '@/features/marketplace/navigate';
import {
  createUserAddress,
  getCheckoutProductIds,
  loadAddresses,
  placeOrder,
  saveAddress,
  useMarketplace,
} from '@/features/marketplace/store';
import type { Address, PaymentMethod } from '@/features/marketplace/types';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

const contactSchema = z.object({
  name: z.string().trim().min(3, 'Informe nome e sobrenome.'),
  email: z.email('Informe um e-mail válido.'),
  phone: z
    .string()
    .refine((value) => onlyDigits(value).length === 11, 'Informe um celular com DDD.'),
});

const addressSchema = z.object({
  resolved: z.boolean().optional(),
  label: z.string().trim().min(2, 'Dê um nome ao endereço.'),
  recipient: z.string().trim().min(3, 'Informe quem recebe.'),
  phone: z
    .string()
    .refine((value) => onlyDigits(value).length === 11, 'Informe um celular com DDD.'),
  zip: z
    .string()
    .refine((value) => onlyDigits(value).length === 8, 'Informe um CEP com 8 dígitos.'),
  street: z.string().trim().min(1, 'Consulte o CEP para preencher a rua.'),
  number: z.string().trim().min(1, 'Informe o número.'),
  complement: z.string(),
  district: z.string().trim().min(1, 'Consulte o CEP para preencher o bairro.'),
  city: z.string().trim().min(1, 'Consulte o CEP para preencher a cidade.'),
  state: z.string().length(2, 'Consulte o CEP para preencher a UF.'),
});

const cardSchema = z.object({
  number: z.string().refine((value) => onlyDigits(value).length === 16, 'Informe os 16 dígitos.'),
  name: z.string().trim().min(3, 'Informe o nome impresso no cartão.'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Use o formato MM/AA.'),
  cvv: z.string().refine((value) => onlyDigits(value).length >= 3, 'Informe o CVV.'),
});

type Contact = z.infer<typeof contactSchema>;
type AddressDraft = z.infer<typeof addressSchema>;

const EMPTY_ADDRESS: AddressDraft = {
  resolved: false,
  label: 'Entrega',
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

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function issuesOf(error: z.ZodError) {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

export function CheckoutView() {
  const { hydrated } = useMarketplace();
  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Carregando checkout…</p>;
  }
  return <CheckoutReady />;
}

function CheckoutReady() {
  const router = useRouter();
  const { cart, products, user, addresses } = useMarketplace();
  const picked = getCheckoutProductIds();
  const lines = resolveCart(cart, products)
    .flatMap((line) => (line.product ? [{ ...line, product: line.product }] : []))
    .filter((line) => (picked ? picked.includes(line.product.id) : true));
  const totals = cartTotals(
    lines.map((line) => ({
      price: line.product.price,
      quantity: line.quantity,
      freeShipping: line.product.freeShipping,
    })),
  );

  const steps = useMemo(
    () =>
      user ? ['entrega', 'pagamento', 'revisao'] : ['contato', 'entrega', 'pagamento', 'revisao'],
    [user],
  );
  const [step, setStep] = useState<(typeof steps)[number]>(user ? 'entrega' : 'contato');
  const current = steps.includes(step) ? step : (steps[0] ?? 'contato');
  const [contact, setContact] = useState<Contact>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>(
    addresses[0]?.id ?? 'new',
  );
  const [address, setAddress] = useState<AddressDraft>({
    ...EMPTY_ADDRESS,
    recipient: user?.name ?? '',
    phone: user?.phone ?? '',
  });
  const [saveForLater, setSaveForLater] = useState(true);
  const [payment, setPayment] = useState<PaymentMethod>('pix');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void loadAddresses()
      .then((items) => {
        if (items[0]?.id) setSelectedAddressId(items[0].id);
      })
      .catch(() => {
        // Checkout segue; o usuário pode cadastrar/selecionar endereço depois.
      });
  }, [user?.id]);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <h1 className="text-xl font-semibold">Não há itens para fechar</h1>
        <Button asChild className="h-12" tooltip={false}>
          <Link href="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </div>
    );
  }

  const activeContact = user
    ? { name: user.name, email: user.email, phone: contact.phone || user.phone }
    : contact;

  function validateContact() {
    const parsed = contactSchema.safeParse(contact);
    if (!parsed.success) {
      setErrors(issuesOf(parsed.error));
      return false;
    }
    setErrors({});
    return true;
  }

  function chosenAddress(): Address | null {
    if (selectedAddressId !== 'new') {
      return addresses.find((item) => item.id === selectedAddressId) ?? null;
    }
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) {
      setErrors(issuesOf(parsed.error));
      return null;
    }
    if (user && !parsed.data.resolved) {
      setErrors({ zip: 'Consulte um CEP válido antes de continuar.' });
      return null;
    }
    setErrors({});
    return {
      ...parsed.data,
      id: newId('addr'),
      adressType: 'ENTREGA',
    };
  }

  async function goNext() {
    if (current === 'contato' && !validateContact()) return;
    if (current === 'entrega') {
      const nextAddress = chosenAddress();
      if (!nextAddress) return;
      if (selectedAddressId === 'new' && user && saveForLater) {
        const cepNumber = onlyDigits(nextAddress.zip);
        if (cepNumber.length !== 8) {
          setErrors({ zip: 'Consulte um CEP válido antes de salvar.' });
          return;
        }
        setSavingAddress(true);
        try {
          const created = await createUserAddress({
            cepNumber,
            number: nextAddress.number,
            complement: nextAddress.complement || undefined,
            adressType: addresses.some((item) => item.adressType === 'PRINCIPAL')
              ? 'ENTREGA'
              : 'PRINCIPAL',
          });
          if (created?.id) setSelectedAddressId(created.id);
        } catch (error) {
          setErrors({
            zip:
              error instanceof AuthApiError
                ? error.message
                : 'Não foi possível salvar o endereço na conta.',
          });
          setSavingAddress(false);
          return;
        } finally {
          setSavingAddress(false);
        }
      } else if (selectedAddressId === 'new' && !user) {
        saveAddress(nextAddress);
      }
    }
    if (current === 'pagamento' && payment === 'credito') {
      const parsed = cardSchema.safeParse(card);
      if (!parsed.success) {
        setErrors(issuesOf(parsed.error));
        return;
      }
      setErrors({});
    }
    const index = steps.indexOf(current);
    const next = steps[index + 1];
    if (next) setStep(next);
  }

  function confirm() {
    const delivery = chosenAddress();
    if (!delivery) {
      setStep('entrega');
      return;
    }
    const payer = user
      ? { name: user.name, email: user.email, phone: contact.phone || user.phone || delivery.phone }
      : contact;
    const contactParsed = contactSchema.safeParse({
      name: payer.name,
      email: payer.email,
      phone: payer.phone || delivery.phone,
    });
    if (!contactParsed.success) {
      setErrors(issuesOf(contactParsed.error));
      setStep(user ? 'entrega' : 'contato');
      return;
    }
    const order = placeOrder({
      contact: contactParsed.data,
      address: delivery,
      paymentMethod: payment,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      items: lines.map((line) => ({
        productId: line.product.id,
        name: line.product.name,
        image: line.product.images[0] ?? '',
        price: line.product.price,
        quantity: line.quantity,
      })),
    });
    schedulePush(() => router.push(`/pedido/${order.id}`));
  }

  const index = steps.indexOf(current);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-28">
      <ol
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        aria-label="Etapas do checkout"
      >
        {steps.map((item, stepIndex) => (
          <li key={item} className="space-y-1">
            <span
              className={cn(
                'block h-1 rounded-full',
                stepIndex <= index ? 'bg-primary' : 'bg-muted',
              )}
            />
            <span
              className={cn(
                'block text-[11px] capitalize',
                stepIndex === index ? 'font-semibold' : 'text-muted-foreground',
              )}
            >
              {item}
            </span>
          </li>
        ))}
      </ol>

      {current === 'contato' ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Quem está comprando</h2>
          <Field label="Nome completo" htmlFor="checkout-name" error={errors.name}>
            <input
              id="checkout-name"
              autoComplete="name"
              className={controlClass}
              value={contact.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => setContact({ ...contact, name: event.target.value })}
            />
          </Field>
          <Field label="E-mail" htmlFor="checkout-email" error={errors.email}>
            <input
              id="checkout-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={controlClass}
              value={contact.email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => setContact({ ...contact, email: event.target.value })}
            />
          </Field>
          <Field label="Celular" htmlFor="checkout-phone" error={errors.phone}>
            <input
              id="checkout-phone"
              inputMode="tel"
              autoComplete="tel"
              className={controlClass}
              value={contact.phone}
              aria-invalid={Boolean(errors.phone)}
              onChange={(event) => setContact({ ...contact, phone: maskPhone(event.target.value) })}
            />
          </Field>
        </section>
      ) : null}

      {current === 'entrega' ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Onde entregar</h2>
          <p className="text-sm text-muted-foreground">
            {user
              ? 'Digite o CEP para preencher o endereço automaticamente.'
              : 'Informe o endereço completo para a entrega.'}
          </p>
          {user && addresses.length > 0 ? (
            <div className="space-y-2" role="radiogroup" aria-label="Endereços salvos">
              {addresses.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedAddressId === item.id}
                  onClick={() => setSelectedAddressId(item.id)}
                  className={cn(
                    'w-full rounded-2xl p-4 text-left ring-1',
                    selectedAddressId === item.id
                      ? 'bg-secondary ring-primary'
                      : 'bg-card ring-foreground/10',
                  )}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.street}, {item.number} · {item.district} · {item.city}/{item.state}
                  </span>
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={selectedAddressId === 'new'}
                onClick={() => setSelectedAddressId('new')}
                className={cn(
                  'min-h-12 w-full rounded-2xl px-4 text-left text-sm font-medium ring-1',
                  selectedAddressId === 'new'
                    ? 'bg-secondary ring-primary'
                    : 'bg-card ring-foreground/10',
                )}
              >
                Usar outro endereço
              </button>
            </div>
          ) : null}
          {selectedAddressId === 'new' || addresses.length === 0 ? (
            <AddressFields
              value={address}
              errors={errors}
              requireCepLookup={Boolean(user)}
              onChange={setAddress}
            />
          ) : null}
          {user && selectedAddressId === 'new' ? (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveForLater}
                onChange={(event) => setSaveForLater(event.target.checked)}
              />
              Salvar este endereço na conta
            </label>
          ) : null}
        </section>
      ) : null}

      {current === 'pagamento' ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Como pagar</h2>
          <p className="text-sm text-muted-foreground">
            Nenhum pagamento é enviado agora. A escolha fica registrada no pedido local.
          </p>
          <div className="grid gap-2" role="radiogroup" aria-label="Forma de pagamento">
            {(
              [
                ['pix', 'Pix', 'Confirmação imediata quando o provedor existir'],
                ['credito', 'Cartão de crédito', 'Dados usados só para validar o formulário'],
                ['boleto', 'Boleto', 'Vencimento simulado em 2 dias úteis'],
              ] as const
            ).map(([id, label, hint]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={payment === id}
                onClick={() => setPayment(id)}
                className={cn(
                  'min-h-14 rounded-2xl px-4 py-3 text-left ring-1',
                  payment === id ? 'bg-secondary ring-primary' : 'bg-card ring-foreground/10',
                )}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
          {payment === 'credito' ? (
            <div className="space-y-4">
              <Field label="Número do cartão" htmlFor="card-number" error={errors.number}>
                <input
                  id="card-number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className={controlClass}
                  value={card.number}
                  aria-invalid={Boolean(errors.number)}
                  onChange={(event) =>
                    setCard({ ...card, number: maskCardNumber(event.target.value) })
                  }
                />
              </Field>
              <Field label="Nome impresso" htmlFor="card-name" error={errors.name}>
                <input
                  id="card-name"
                  autoComplete="cc-name"
                  className={controlClass}
                  value={card.name}
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => setCard({ ...card, name: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Validade" htmlFor="card-expiry" error={errors.expiry}>
                  <input
                    id="card-expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    className={controlClass}
                    value={card.expiry}
                    aria-invalid={Boolean(errors.expiry)}
                    onChange={(event) =>
                      setCard({ ...card, expiry: maskExpiry(event.target.value) })
                    }
                  />
                </Field>
                <Field label="CVV" htmlFor="card-cvv" error={errors.cvv}>
                  <input
                    id="card-cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className={controlClass}
                    value={card.cvv}
                    aria-invalid={Boolean(errors.cvv)}
                    onChange={(event) =>
                      setCard({ ...card, cvv: onlyDigits(event.target.value).slice(0, 4) })
                    }
                  />
                </Field>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {current === 'revisao' ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Revise o pedido</h2>
          <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-foreground/10">
            {lines.map((line) => (
              <li
                key={line.product.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{line.product.name}</span>
                  <span className="text-muted-foreground">Qtd. {line.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatBRL(line.product.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Contato</dt>
              <dd>{activeContact.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd>{totals.shipping === 0 ? 'Grátis' : formatBRL(totals.shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatBRL(totals.total)}</dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ao confirmar, o pedido fica salvo neste navegador. Não há cobrança nem envio para uma
            loja real.
          </p>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-2">
          {index > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-12"
              tooltip={false}
              onClick={() => setStep(steps[index - 1] ?? current)}
            >
              Voltar
            </Button>
          ) : null}
          {current === 'revisao' ? (
            <Button type="button" className="h-12 flex-1" tooltip={false} onClick={confirm}>
              Confirmar pedido · {formatBRL(totals.total)}
            </Button>
          ) : (
            <Button
              type="button"
              className="h-12 flex-1"
              tooltip={false}
              disabled={savingAddress}
              onClick={() => {
                void goNext();
              }}
            >
              {savingAddress ? 'Salvando…' : 'Continuar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressFields({
  value,
  errors,
  requireCepLookup,
  onChange,
}: {
  value: AddressDraft;
  errors: Record<string, string>;
  requireCepLookup: boolean;
  onChange: (value: AddressDraft) => void;
}) {
  const [lookingUp, setLookingUp] = useState(false);
  const [cepError, setCepError] = useState('');

  function set<K extends keyof AddressDraft>(key: K, next: AddressDraft[K]) {
    onChange({ ...value, [key]: next });
  }

  async function resolveCep(rawZip: string) {
    if (!requireCepLookup) return;
    const digits = onlyDigits(rawZip);
    if (digits.length !== 8) return;
    setLookingUp(true);
    setCepError('');
    try {
      const data = await lookupCep(digits);
      onChange({
        ...value,
        resolved: true,
        zip: maskZip(data.cepNumber),
        street: data.address,
        district: data.neighborhood,
        city: data.cityName,
        state: data.uf,
      });
    } catch (error) {
      onChange({
        ...value,
        resolved: false,
        zip: maskZip(digits),
        street: '',
        district: '',
        city: '',
        state: '',
      });
      setCepError(
        error instanceof AuthApiError ? error.message : 'Não foi possível consultar o CEP.',
      );
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Destinatário" htmlFor="addr-recipient" error={errors.recipient}>
        <input
          id="addr-recipient"
          autoComplete="name"
          className={controlClass}
          value={value.recipient}
          aria-invalid={Boolean(errors.recipient)}
          onChange={(event) => set('recipient', event.target.value)}
        />
      </Field>
      <Field label="Celular" htmlFor="addr-phone" error={errors.phone}>
        <input
          id="addr-phone"
          inputMode="tel"
          autoComplete="tel"
          className={controlClass}
          value={value.phone}
          aria-invalid={Boolean(errors.phone)}
          onChange={(event) => set('phone', maskPhone(event.target.value))}
        />
      </Field>
      <Field
        label="CEP"
        htmlFor="addr-zip"
        error={errors.zip || cepError}
        hint={
          lookingUp
            ? 'Consultando CEP…'
            : requireCepLookup
              ? 'Ao completar 8 dígitos, buscamos o endereço.'
              : undefined
        }
      >
        <input
          id="addr-zip"
          inputMode="numeric"
          autoComplete="postal-code"
          className={controlClass}
          value={value.zip}
          aria-invalid={Boolean(errors.zip || cepError)}
          onChange={(event) => {
            const next = maskZip(event.target.value);
            setCepError('');
            onChange({
              ...value,
              zip: next,
              resolved: requireCepLookup ? false : value.resolved,
            });
            if (requireCepLookup && onlyDigits(next).length === 8) {
              void resolveCep(next);
            }
          }}
        />
      </Field>
      <Field label="Rua" htmlFor="addr-street" error={errors.street}>
        <input
          id="addr-street"
          autoComplete="address-line1"
          className={controlClass}
          value={value.street}
          readOnly={requireCepLookup}
          aria-invalid={Boolean(errors.street)}
          onChange={(event) => set('street', event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número" htmlFor="addr-number" error={errors.number}>
          <input
            id="addr-number"
            className={controlClass}
            value={value.number}
            aria-invalid={Boolean(errors.number)}
            onChange={(event) => set('number', event.target.value)}
          />
        </Field>
        <Field label="Complemento" htmlFor="addr-complement" error={errors.complement}>
          <input
            id="addr-complement"
            className={controlClass}
            value={value.complement}
            onChange={(event) => set('complement', event.target.value)}
          />
        </Field>
      </div>
      <Field label="Bairro" htmlFor="addr-district" error={errors.district}>
        <input
          id="addr-district"
          className={controlClass}
          value={value.district}
          readOnly={requireCepLookup}
          aria-invalid={Boolean(errors.district)}
          onChange={(event) => set('district', event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
        <Field label="Cidade" htmlFor="addr-city" error={errors.city}>
          <input
            id="addr-city"
            autoComplete="address-level2"
            className={controlClass}
            value={value.city}
            readOnly={requireCepLookup}
            aria-invalid={Boolean(errors.city)}
            onChange={(event) => set('city', event.target.value)}
          />
        </Field>
        <Field label="UF" htmlFor="addr-state" error={errors.state}>
          <input
            id="addr-state"
            className={controlClass}
            value={value.state}
            readOnly={requireCepLookup}
            maxLength={2}
            aria-invalid={Boolean(errors.state)}
            onChange={(event) => set('state', event.target.value.toUpperCase())}
          />
        </Field>
      </div>
    </div>
  );
}
