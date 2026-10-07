'use client';

import { Eye, EyeOff, Mail, Smartphone, UserRound, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import { controlClass, Field } from '@/features/marketplace/components/bits';
import { maskPhone, onlyDigits, safeNextPath } from '@/features/marketplace/masks';
import { schedulePush } from '@/features/marketplace/navigate';
import { login, register } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(6, 'Use pelo menos 6 caracteres.'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe nome e sobrenome.'),
    email: z.email('Informe um e-mail válido.'),
    phone: z
      .string()
      .refine((value) => onlyDigits(value).length === 11, 'Informe um celular com DDD.'),
    password: z.string().min(6, 'Use pelo menos 6 caracteres.'),
    confirm: z.string(),
    accepted: z.boolean().refine((value) => value, 'Aceite os termos para criar a conta.'),
  })
  .refine((value) => value.password === value.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem.',
  });

function issuesOf(error: z.ZodError) {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

function clearError(
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  key: string,
) {
  setErrors((current) => {
    if (!current[key]) return current;
    const next = { ...current };
    delete next[key];
    return next;
  });
}

const authControlClass = cn(
  controlClass,
  'h-11 border-border bg-background lg:h-14 lg:rounded-2xl lg:px-4 lg:text-lg [@media(max-height:720px)]:h-10',
);

function AuthIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <header className="space-y-1.5">
      <h1 className="font-poppins text-[1.65rem] leading-none font-semibold tracking-tight sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground lg:text-base [@media(max-height:680px)]:sr-only">
        {children}
      </p>
    </header>
  );
}

function AuthField({
  id,
  label,
  type = 'text',
  value,
  error,
  onChange,
  icon: Icon,
  labelAside,
  autoComplete,
  inputMode,
  placeholder,
  hint,
  trailing,
  inputClassName,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  labelAside?: React.ReactNode;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
  hint?: string;
  trailing?: React.ReactNode;
  inputClassName?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = !error && hint ? `${id}-hint` : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium lg:text-base">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        {Icon ? (
          <Icon
            className={cn(
              'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 lg:left-4 lg:size-5',
              error ? 'text-destructive' : 'text-muted-foreground',
            )}
            aria-hidden
          />
        ) : null}
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(authControlClass, Icon && 'pl-10 lg:pl-12', inputClassName)}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? hintId}
          onChange={(event) => onChange(event.target.value)}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive lg:text-sm" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p
          id={hintId}
          className="text-xs text-muted-foreground lg:text-sm [@media(max-height:720px)]:sr-only"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  id,
  label = 'Senha',
  value,
  onChange,
  autoComplete,
  error,
  hint,
  labelAside,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
  hint?: string;
  labelAside?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      id={id}
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      error={error}
      hint={hint}
      labelAside={labelAside}
      inputClassName="pr-11 lg:pr-14"
      onChange={onChange}
      trailing={
        <button
          type="button"
          className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-muted-foreground lg:h-14 lg:w-14 lg:[&_svg]:size-5 [@media(max-height:720px)]:h-10 [@media(max-height:720px)]:w-10"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}

function AuthSwitch({ href, prompt, label }: { href: string; prompt: string; label: string }) {
  return (
    <p className="text-center text-sm text-muted-foreground lg:text-base">
      {prompt}{' '}
      <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
        {label}
      </Link>
    </p>
  );
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'), '/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="flex w-full flex-col gap-4 lg:gap-5 [@media(max-height:720px)]:gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          return;
        }
        login(parsed.data.email);
        schedulePush(() => router.push(next));
      }}
    >
      <AuthIntro title="Entrar">
        Acesso local: qualquer e-mail válido e uma senha com 6 caracteres ou mais.
      </AuthIntro>
      <AuthField
        id="login-email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nome@email.com"
        icon={Mail}
        value={email}
        error={errors.email}
        onChange={(value) => {
          setEmail(value);
          clearError(setErrors, 'email');
        }}
      />
      <PasswordField
        id="login-password"
        autoComplete="current-password"
        value={password}
        error={errors.password}
        hint="Mínimo de 6 caracteres. Nada é enviado para um servidor."
        labelAside={
          <Link
            href="/recuperar-senha"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline lg:text-sm"
          >
            Esqueci a senha
          </Link>
        }
        onChange={(value) => {
          setPassword(value);
          clearError(setErrors, 'password');
        }}
      />
      <Button type="submit" size="xl" className="w-full lg:h-14 lg:text-lg" tooltip={false}>
        Entrar
      </Button>
      <AuthSwitch
        href={`/cadastro?next=${encodeURIComponent(next)}`}
        prompt="Novo por aqui?"
        label="Criar conta"
      />
    </form>
  );
}

export function RegisterView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    clearError(setErrors, key);
  }

  return (
    <form
      className="flex w-full flex-col gap-3.5 lg:gap-5 [@media(max-height:720px)]:gap-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = registerSchema.safeParse({ ...form, accepted });
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          return;
        }
        register({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone });
        schedulePush(() => router.push(next));
      }}
    >
      <AuthIntro title="Criar conta">
        A senha não é armazenada. Ela só valida este formulário.
      </AuthIntro>
      <div className="grid gap-3 sm:grid-cols-2 lg:gap-x-5 lg:gap-y-4 [@media(max-height:720px)]:gap-2.5">
        <AuthField
          id="reg-name"
          label="Nome completo"
          autoComplete="name"
          placeholder="Nome e sobrenome"
          icon={UserRound}
          value={form.name}
          error={errors.name}
          onChange={(value) => setField('name', value)}
        />
        <AuthField
          id="reg-phone"
          label="Celular"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          icon={Smartphone}
          value={form.phone}
          error={errors.phone}
          onChange={(value) => setField('phone', maskPhone(value))}
        />
        <div className="sm:col-span-2">
          <AuthField
            id="reg-email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nome@email.com"
            icon={Mail}
            value={form.email}
            error={errors.email}
            onChange={(value) => setField('email', value)}
          />
        </div>
        <PasswordField
          id="reg-password"
          autoComplete="new-password"
          value={form.password}
          error={errors.password}
          hint="Mínimo de 6 caracteres."
          onChange={(value) => setField('password', value)}
        />
        <PasswordField
          id="reg-confirm"
          label="Confirmar senha"
          autoComplete="new-password"
          value={form.confirm}
          error={errors.confirm}
          onChange={(value) => setField('confirm', value)}
        />
      </div>
      <div className="space-y-1">
        <label className="flex items-start gap-3 text-sm leading-snug lg:text-base">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-primary lg:size-5"
            checked={accepted}
            aria-invalid={Boolean(errors.accepted)}
            aria-describedby={errors.accepted ? 'reg-accepted-error' : undefined}
            onChange={(event) => {
              setAccepted(event.target.checked);
              clearError(setErrors, 'accepted');
            }}
          />
          <span>
            Li que a conta e os pedidos ficam apenas neste navegador, sem cadastro em um serviço
            externo.
          </span>
        </label>
        {errors.accepted ? (
          <p id="reg-accepted-error" className="text-xs text-destructive lg:text-sm" role="alert">
            {errors.accepted}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="xl" className="w-full lg:h-14 lg:text-lg" tooltip={false}>
        Criar conta
      </Button>
      <AuthSwitch
        href={`/entrar?next=${encodeURIComponent(next)}`}
        prompt="Já tem conta?"
        label="Entrar"
      />
    </form>
  );
}

export function RecoveryView() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Pedido anotado</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          O envio de e-mail ainda não está ligado. Quando estiver, as instruções saem para {email}.
          Por enquanto, entre com o mesmo e-mail e uma senha de 6 caracteres ou mais.
        </p>
        <Button asChild className="h-12 w-full" tooltip={false}>
          <Link href="/entrar">Voltar para entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = z.email('Informe um e-mail válido.').safeParse(email);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Informe um e-mail válido.');
          return;
        }
        setError('');
        setDone(true);
      }}
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe o e-mail da conta. Nenhum link é disparado ainda.
        </p>
      </header>
      <Field label="E-mail" htmlFor="recovery-email" error={error}>
        <input
          id="recovery-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={controlClass}
          value={email}
          aria-invalid={Boolean(error)}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Button type="submit" className="h-12 w-full" tooltip={false}>
        Continuar
      </Button>
    </form>
  );
}
