'use client';

import {
  Eye,
  EyeOff,
  IdCard,
  Mail,
  Smartphone,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useEffect, useState } from 'react';
import { z } from 'zod';

import {
  authFetch,
  authFieldErrors,
  AuthApiError,
  toSessionUser,
  type AuthSessionResponse,
  type PasswordResetVerifyResponse,
  type RegisterResponse,
} from '@/features/marketplace/auth-api';
import { controlClass, Field } from '@/features/marketplace/components/bits';
import {
  isValidCpfCnpj,
  maskCpfCnpj,
  maskPhone,
  onlyDigits,
  resolveLoginType,
  safeNextPath,
  toE164Phone,
} from '@/features/marketplace/masks';
import { schedulePush } from '@/features/marketplace/navigate';
import { setSessionUser } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

const CONFIRM_EMAIL_KEY = 'gescom-confirm-email';

const loginSchema = z.object({
  login: z.string().trim().min(1, 'Informe e-mail ou CPF/CNPJ.'),
  password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome completo.').max(255),
    email: z.email('Informe um e-mail válido.'),
    registration: z
      .string()
      .refine((value) => isValidCpfCnpj(value), 'Informe um CPF ou CNPJ válido.'),
    phone: z
      .string()
      .refine(
        (value) => !value || onlyDigits(value).length === 11,
        'Informe um celular com DDD.',
      ),
    password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
    confirm: z.string(),
    accepted: z.boolean().refine((value) => value, 'Aceite os termos para criar a conta.'),
  })
  .refine((value) => value.password === value.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem.',
  });

const confirmSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  code: z
    .string()
    .regex(/^\d{6}$/, 'Informe o código de 6 dígitos.'),
});

const recoveryEmailSchema = z.email('Informe um e-mail válido.');

const recoveryCodeSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  code: z.string().regex(/^\d{6}$/, 'Informe o código de 6 dígitos.'),
});

const recoveryPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
    confirm: z.string(),
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

function mapApiFieldErrors(error: AuthApiError) {
  const api = authFieldErrors(error);
  const mapped: Record<string, string> = {};
  const aliases: Record<string, string> = {
    userName: 'name',
    userEmail: 'email',
    userRegistration: 'registration',
    userPhone: 'phone',
    confirmPassword: 'confirm',
    login: 'login',
    password: 'password',
    email: 'email',
    code: 'code',
  };
  for (const [key, message] of Object.entries(api)) {
    mapped[aliases[key] ?? key] = message;
  }
  return mapped;
}

function rememberConfirmEmail(email: string) {
  try {
    sessionStorage.setItem(CONFIRM_EMAIL_KEY, email);
  } catch {
    // sessionStorage pode estar indisponível.
  }
}

function readConfirmEmail() {
  try {
    return sessionStorage.getItem(CONFIRM_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

function confirmHref(email: string, next: string) {
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (next) params.set('next', next);
  const query = params.toString();
  return query ? `/cadastro/confirmar?${query}` : '/cadastro/confirmar';
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
  maxLength,
  disabled,
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
  maxLength?: number;
  disabled?: boolean;
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
          maxLength={maxLength}
          disabled={disabled}
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

function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function FormNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground" role="status">
      {message}
    </p>
  );
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'), '/');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex w-full flex-col gap-4 lg:gap-5 [@media(max-height:720px)]:gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setFormError('');
        const parsed = loginSchema.safeParse({ login, password });
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          return;
        }

        setPending(true);
        try {
          const resolved = resolveLoginType(parsed.data.login);
          if (resolved.loginType === 'CPF/CNPJ' && !isValidCpfCnpj(resolved.login)) {
            setErrors({ login: 'Informe um e-mail ou CPF/CNPJ válido.' });
            return;
          }

          const data = await authFetch<AuthSessionResponse>('/api/conta/login', {
            method: 'POST',
            body: JSON.stringify({
              loginType: resolved.loginType,
              login: resolved.login,
              password: parsed.data.password,
            }),
          });
          setSessionUser(toSessionUser(data.user));
          schedulePush(() => router.push(next));
        } catch (error) {
          if (error instanceof AuthApiError) {
            if (error.code === 'EMAIL_NOT_CONFIRMED') {
              const email =
                resolveLoginType(parsed.data.login).loginType === 'EMAIL'
                  ? parsed.data.login.trim().toLowerCase()
                  : '';
              if (email) rememberConfirmEmail(email);
              schedulePush(() => router.push(confirmHref(email, next)));
              return;
            }
            const fieldErrors = mapApiFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
            else setFormError(error.message);
            return;
          }
          setFormError('Não foi possível entrar. Tente novamente.');
        } finally {
          setPending(false);
        }
      }}
    >
      <AuthIntro title="Entrar">
        Use o e-mail ou CPF/CNPJ da conta e a senha cadastrada nesta loja.
      </AuthIntro>
      <FormAlert message={formError} />
      <AuthField
        id="login-login"
        label="E-mail ou CPF/CNPJ"
        inputMode="email"
        autoComplete="username"
        placeholder="nome@email.com ou documento"
        icon={Mail}
        value={login}
        error={errors.login}
        onChange={(value) => {
          setLogin(value.includes('@') || /[a-zA-Z]/.test(value) ? value : maskCpfCnpj(value));
          clearError(setErrors, 'login');
        }}
      />
      <PasswordField
        id="login-password"
        autoComplete="current-password"
        value={password}
        error={errors.password}
        hint="Mínimo de 8 caracteres."
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
      <Button
        type="submit"
        size="xl"
        className="w-full lg:h-14 lg:text-lg"
        tooltip={false}
        disabled={pending}
      >
        {pending ? 'Entrando…' : 'Entrar'}
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
  const [form, setForm] = useState({
    name: '',
    email: '',
    registration: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    clearError(setErrors, key);
  }

  return (
    <form
      className="flex w-full flex-col gap-3.5 lg:gap-5 [@media(max-height:720px)]:gap-2.5"
      onSubmit={async (event) => {
        event.preventDefault();
        setFormError('');
        const parsed = registerSchema.safeParse({ ...form, accepted });
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          return;
        }

        setPending(true);
        try {
          const phone = toE164Phone(parsed.data.phone);
          const data = await authFetch<RegisterResponse>('/api/conta/register', {
            method: 'POST',
            body: JSON.stringify({
              userName: parsed.data.name,
              userEmail: parsed.data.email,
              userRegistration: onlyDigits(parsed.data.registration),
              ...(phone ? { userPhone: phone } : {}),
              password: parsed.data.password,
              confirmPassword: parsed.data.confirm,
            }),
          });
          rememberConfirmEmail(data.email);
          schedulePush(() => router.push(confirmHref(data.email, next)));
        } catch (error) {
          if (error instanceof AuthApiError) {
            if (error.code === 'CUSTOMER_ALREADY_REGISTERED') {
              schedulePush(() =>
                router.push(`/entrar?next=${encodeURIComponent(next)}`),
              );
              return;
            }
            if (error.code === 'EMAIL_DELIVERY_FAILED') {
              rememberConfirmEmail(parsed.data.email);
              schedulePush(() => router.push(confirmHref(parsed.data.email, next)));
              return;
            }
            const fieldErrors = mapApiFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
            else setFormError(error.message);
            return;
          }
          setFormError('Não foi possível criar a conta. Tente novamente.');
        } finally {
          setPending(false);
        }
      }}
    >
      <AuthIntro title="Criar conta">
        Depois do cadastro, confirme o e-mail com o código de 6 dígitos para ativar a conta.
      </AuthIntro>
      <FormAlert message={formError} />
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
          id="reg-registration"
          label="CPF ou CNPJ"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          icon={IdCard}
          value={form.registration}
          error={errors.registration}
          onChange={(value) => setField('registration', maskCpfCnpj(value))}
        />
        <AuthField
          id="reg-phone"
          label="Celular (opcional)"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          icon={Smartphone}
          value={form.phone}
          error={errors.phone}
          onChange={(value) => setField('phone', maskPhone(value))}
        />
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
        <PasswordField
          id="reg-password"
          autoComplete="new-password"
          value={form.password}
          error={errors.password}
          hint="Mínimo de 8 caracteres."
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
            Li e aceito as{' '}
            <Link
              href="/institucional/condicoes"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              condições de uso
            </Link>{' '}
            e a{' '}
            <Link
              href="/institucional/privacidade"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              notificação de privacidade
            </Link>
            .
          </span>
        </label>
        {errors.accepted ? (
          <p id="reg-accepted-error" className="text-xs text-destructive lg:text-sm" role="alert">
            {errors.accepted}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        size="xl"
        className="w-full lg:h-14 lg:text-lg"
        tooltip={false}
        disabled={pending}
      >
        {pending ? 'Criando conta…' : 'Criar conta'}
      </Button>
      <AuthSwitch
        href={`/entrar?next=${encodeURIComponent(next)}`}
        prompt="Já tem conta?"
        label="Entrar"
      />
    </form>
  );
}

export function ConfirmEmailView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const emailFromQuery = params.get('email')?.trim() ?? '';
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (emailFromQuery) {
      rememberConfirmEmail(emailFromQuery);
      startTransition(() => setEmail(emailFromQuery));
      return;
    }
    const stored = readConfirmEmail();
    if (stored) startTransition(() => setEmail(stored));
  }, [emailFromQuery]);

  return (
    <form
      className="flex w-full flex-col gap-4 lg:gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setFormError('');
        setNotice('');
        const parsed = confirmSchema.safeParse({ email, code });
        if (!parsed.success) {
          setErrors(issuesOf(parsed.error));
          return;
        }

        setPending(true);
        try {
          const data = await authFetch<AuthSessionResponse>('/api/conta/confirm', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
          });
          setSessionUser(toSessionUser(data.user));
          try {
            sessionStorage.removeItem(CONFIRM_EMAIL_KEY);
          } catch {
            // ignore
          }
          schedulePush(() => router.push(next));
        } catch (error) {
          if (error instanceof AuthApiError) {
            const fieldErrors = mapApiFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
            else setFormError(error.message);
            return;
          }
          setFormError('Não foi possível confirmar o e-mail. Tente novamente.');
        } finally {
          setPending(false);
        }
      }}
    >
      <AuthIntro title="Confirmar e-mail">
        Digite o código de 6 dígitos enviado para o e-mail informado no cadastro.
      </AuthIntro>
      <FormAlert message={formError} />
      <FormNotice message={notice} />
      <AuthField
        id="confirm-email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        icon={Mail}
        value={email}
        error={errors.email}
        onChange={(value) => {
          setEmail(value);
          clearError(setErrors, 'email');
        }}
      />
      <AuthField
        id="confirm-code"
        label="Código"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        maxLength={6}
        value={code}
        error={errors.code}
        hint="O código expira em até 60 minutos."
        onChange={(value) => {
          setCode(onlyDigits(value).slice(0, 6));
          clearError(setErrors, 'code');
        }}
      />
      <Button
        type="submit"
        size="xl"
        className="w-full lg:h-14 lg:text-lg"
        tooltip={false}
        disabled={pending}
      >
        {pending ? 'Confirmando…' : 'Confirmar e entrar'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full lg:h-14 lg:text-lg"
        tooltip={false}
        disabled={resending || !email}
        onClick={async () => {
          setFormError('');
          setNotice('');
          const parsed = z.email('Informe um e-mail válido.').safeParse(email);
          if (!parsed.success) {
            setErrors({ email: parsed.error.issues[0]?.message ?? 'Informe um e-mail válido.' });
            return;
          }
          setResending(true);
          try {
            await authFetch('/api/conta/resend-code', {
              method: 'POST',
              body: JSON.stringify({ email: parsed.data }),
            });
            rememberConfirmEmail(parsed.data);
            setNotice('Se houver confirmação pendente, enviamos um novo código.');
          } catch (error) {
            if (error instanceof AuthApiError) setFormError(error.message);
            else setFormError('Não foi possível reenviar o código.');
          } finally {
            setResending(false);
          }
        }}
      >
        {resending ? 'Reenviando…' : 'Reenviar código'}
      </Button>
      <AuthSwitch href={`/entrar?next=${encodeURIComponent(next)}`} prompt="Já confirmou?" label="Entrar" />
    </form>
  );
}

export function RecoveryView() {
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

  if (step === 'done') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Senha atualizada</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sua senha foi redefinida. Entre com o e-mail e a nova senha.
        </p>
        <Button asChild className="h-12 w-full" tooltip={false}>
          <Link href="/entrar">Voltar para entrar</Link>
        </Button>
      </div>
    );
  }

  if (step === 'password') {
    return (
      <form
        className="mx-auto max-w-lg space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          const parsed = recoveryPasswordSchema.safeParse({ password, confirm });
          if (!parsed.success) {
            setErrors(issuesOf(parsed.error));
            return;
          }
          setPending(true);
          try {
            await authFetch('/api/conta/password-reset/confirm', {
              method: 'POST',
              body: JSON.stringify({
                email,
                resetToken,
                password: parsed.data.password,
                confirmPassword: parsed.data.confirm,
              }),
            });
            setStep('done');
          } catch (err) {
            if (err instanceof AuthApiError) {
              const fieldErrors = mapApiFieldErrors(err);
              if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
              else setError(err.message);
            } else {
              setError('Não foi possível redefinir a senha.');
            }
          } finally {
            setPending(false);
          }
        }}
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Nova senha</h1>
          <p className="text-sm text-muted-foreground">
            Defina uma senha com pelo menos 8 caracteres para {email}.
          </p>
        </header>
        <FormAlert message={error} />
        <PasswordField
          id="recovery-password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(value) => {
            setPassword(value);
            clearError(setErrors, 'password');
          }}
        />
        <PasswordField
          id="recovery-confirm"
          label="Confirmar senha"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(value) => {
            setConfirm(value);
            clearError(setErrors, 'confirm');
          }}
        />
        <Button type="submit" className="h-12 w-full" tooltip={false} disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>
    );
  }

  if (step === 'code') {
    return (
      <form
        className="mx-auto max-w-lg space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          setNotice('');
          const parsed = recoveryCodeSchema.safeParse({ email, code });
          if (!parsed.success) {
            setErrors(issuesOf(parsed.error));
            return;
          }
          setPending(true);
          try {
            const data = await authFetch<PasswordResetVerifyResponse>(
              '/api/conta/password-reset/verify',
              {
                method: 'POST',
                body: JSON.stringify(parsed.data),
              },
            );
            setResetToken(data.resetToken);
            setStep('password');
          } catch (err) {
            if (err instanceof AuthApiError) {
              const fieldErrors = mapApiFieldErrors(err);
              if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
              else setError(err.message);
            } else {
              setError('Não foi possível validar o código.');
            }
          } finally {
            setPending(false);
          }
        }}
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Código de recuperação</h1>
          <p className="text-sm text-muted-foreground">
            Informe o código enviado para {email}. Só contas com e-mail confirmado podem recuperar a
            senha.
          </p>
        </header>
        <FormAlert message={error} />
        <FormNotice message={notice} />
        <Field label="Código" htmlFor="recovery-code" error={errors.code}>
          <input
            id="recovery-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={controlClass}
            value={code}
            aria-invalid={Boolean(errors.code)}
            onChange={(event) => {
              setCode(onlyDigits(event.target.value).slice(0, 6));
              clearError(setErrors, 'code');
            }}
          />
        </Field>
        <Button type="submit" className="h-12 w-full" tooltip={false} disabled={pending}>
          {pending ? 'Validando…' : 'Validar código'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          tooltip={false}
          disabled={pending}
          onClick={async () => {
            setError('');
            setNotice('');
            setPending(true);
            try {
              await authFetch('/api/conta/password-reset/resend', {
                method: 'POST',
                body: JSON.stringify({ email }),
              });
              setNotice('Se a conta existir e estiver ativa, enviamos um novo código.');
            } catch (err) {
              if (err instanceof AuthApiError) setError(err.message);
              else setError('Não foi possível reenviar o código.');
            } finally {
              setPending(false);
            }
          }}
        >
          Reenviar código
        </Button>
      </form>
    );
  }

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        setNotice('');
        const parsed = recoveryEmailSchema.safeParse(email);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Informe um e-mail válido.');
          return;
        }
        setPending(true);
        try {
          await authFetch('/api/conta/password-reset/request', {
            method: 'POST',
            body: JSON.stringify({ email: parsed.data }),
          });
          setEmail(parsed.data);
          setStep('code');
          setNotice('Se a conta existir e estiver ativa, enviamos um código para o e-mail.');
        } catch (err) {
          if (err instanceof AuthApiError) setError(err.message);
          else setError('Não foi possível solicitar a recuperação.');
        } finally {
          setPending(false);
        }
      }}
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe o e-mail da conta já confirmada. Enviaremos um código para redefinir a senha.
        </p>
      </header>
      <FormAlert message={error} />
      <Field label="E-mail" htmlFor="recovery-email" error={error && !email ? error : undefined}>
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
      <Button type="submit" className="h-12 w-full" tooltip={false} disabled={pending}>
        {pending ? 'Enviando…' : 'Continuar'}
      </Button>
    </form>
  );
}
