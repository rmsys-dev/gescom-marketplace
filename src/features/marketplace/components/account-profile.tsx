'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Field } from '@/features/marketplace/components/bits';
import { maskPhone, onlyDigits } from '@/features/marketplace/masks';
import { updateProfile, useMarketplace } from '@/features/marketplace/store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const fieldInputClass = 'h-12 px-3 text-base md:text-base';

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

export function ProfileView() {
  const { user } = useMarketplace();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="hidden text-2xl font-semibold tracking-tight md:block">Dados pessoais</h1>

      <section className="rounded-2xl bg-card px-5 py-6 shadow-card ring-1 ring-foreground/8">
        <div className="flex items-center gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold tracking-wide text-foreground"
            aria-hidden
          >
            {userInitials(form.name || user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">
              {form.name.trim() || user.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {form.email.trim() || user.email}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Esses dados ficam salvos neste aparelho e são usados no checkout.
        </p>
      </section>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = profileSchema.safeParse(form);
          if (!parsed.success) {
            setErrors(issuesOf(parsed.error));
            return;
          }
          updateProfile(parsed.data);
          setErrors({});
          toast.success('Dados atualizados neste aparelho.');
        }}
      >
        <section className="space-y-4 rounded-2xl bg-card px-5 py-6 shadow-card ring-1 ring-foreground/8">
          <Field label="Nome" htmlFor="profile-name" error={errors.name}>
            <Input
              id="profile-name"
              autoComplete="name"
              className={fieldInputClass}
              value={form.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="E-mail" htmlFor="profile-email" error={errors.email}>
            <Input
              id="profile-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={fieldInputClass}
              value={form.email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field
            label="Celular"
            htmlFor="profile-phone"
            error={errors.phone}
            hint="Opcional até o checkout."
          >
            <Input
              id="profile-phone"
              inputMode="tel"
              autoComplete="tel"
              className={fieldInputClass}
              value={form.phone}
              aria-invalid={Boolean(errors.phone)}
              onChange={(event) => setForm({ ...form, phone: maskPhone(event.target.value) })}
            />
          </Field>
        </section>

        <Button type="submit" className="h-12 w-full" tooltip={false}>
          Salvar
        </Button>
      </form>
    </div>
  );
}
