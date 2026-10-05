'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import { controlClass, Field } from '@/features/marketplace/components/bits';
import { maskPhone, onlyDigits, safeNextPath } from '@/features/marketplace/masks';
import { schedulePush } from '@/features/marketplace/navigate';
import { login, register } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';

function issuesOf(error: z.ZodError) {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}

function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      label="Senha"
      htmlFor={id}
      error={error}
      hint="Mínimo de 6 caracteres. Nada é enviado para um servidor."
    >
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`${controlClass} pr-12`}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute top-0 right-0 flex size-12 items-center justify-center text-muted-foreground"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = z
          .object({
            email: z.email('Informe um e-mail válido.'),
            password: z.string().min(6, 'Use pelo menos 6 caracteres.'),
          })
          .safeParse({ email, password });
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          return;
        }
        login(parsed.data.email);
        schedulePush(() => router.push(next));
      }}
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Acesso local: qualquer e-mail válido e uma senha com 6 caracteres ou mais.
        </p>
      </header>
      <Field label="E-mail" htmlFor="login-email" error={errors.email}>
        <input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={controlClass}
          value={email}
          aria-invalid={Boolean(errors.email)}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <PasswordField
        id="login-password"
        autoComplete="current-password"
        value={password}
        error={errors.password}
        onChange={setPassword}
      />
      <Button type="submit" className="h-12 w-full" tooltip={false}>
        Entrar
      </Button>
      <p className="text-center text-sm">
        <Link href="/recuperar-senha" className="font-medium text-primary">
          Esqueci a senha
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Novo por aqui?{' '}
        <Link
          href={`/cadastro?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary"
        >
          Criar conta
        </Link>
      </p>
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

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = z
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
          })
          .safeParse({ ...form, accepted });
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          return;
        }
        register({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone });
        schedulePush(() => router.push(next));
      }}
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          A senha não é armazenada. Ela só valida este formulário.
        </p>
      </header>
      <Field label="Nome completo" htmlFor="reg-name" error={errors.name}>
        <input
          id="reg-name"
          autoComplete="name"
          className={controlClass}
          value={form.name}
          aria-invalid={Boolean(errors.name)}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </Field>
      <Field label="E-mail" htmlFor="reg-email" error={errors.email}>
        <input
          id="reg-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={controlClass}
          value={form.email}
          aria-invalid={Boolean(errors.email)}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </Field>
      <Field label="Celular" htmlFor="reg-phone" error={errors.phone}>
        <input
          id="reg-phone"
          inputMode="tel"
          autoComplete="tel"
          className={controlClass}
          value={form.phone}
          aria-invalid={Boolean(errors.phone)}
          onChange={(event) => setForm({ ...form, phone: maskPhone(event.target.value) })}
        />
      </Field>
      <PasswordField
        id="reg-password"
        autoComplete="new-password"
        value={form.password}
        error={errors.password}
        onChange={(password) => setForm({ ...form, password })}
      />
      <Field label="Confirmar senha" htmlFor="reg-confirm" error={errors.confirm}>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          className={controlClass}
          value={form.confirm}
          aria-invalid={Boolean(errors.confirm)}
          onChange={(event) => setForm({ ...form, confirm: event.target.value })}
        />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          className="mt-1 size-4"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>
          Li que a conta e os pedidos ficam apenas neste navegador, sem cadastro em um serviço
          externo.
        </span>
      </label>
      {errors.accepted ? (
        <p className="text-xs text-destructive" role="alert">
          {errors.accepted}
        </p>
      ) : null}
      <Button type="submit" className="h-12 w-full" tooltip={false}>
        Criar conta
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link
          href={`/entrar?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary"
        >
          Entrar
        </Link>
      </p>
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
