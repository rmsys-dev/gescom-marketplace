'use client';

import type { SessionUser } from '@/features/marketplace/types';

export type AuthDetail = {
  path?: string;
  message: string;
};

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: AuthDetail[],
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export type AuthSessionResponse = {
  user: {
    id: string;
    name: string;
    email: string | null;
    registration?: string | null;
  };
  enterprise: {
    id: string;
    memberId: string;
    class: string;
    tradeName?: string;
  } | null;
  message?: string;
};

export type RegisterResponse = {
  emailConfirmationRequired: boolean;
  email: string;
  expiresInMinutes: number;
  message?: string;
};

export type ResendCodeResponse = {
  emailConfirmationRequired: boolean;
  message?: string;
};

export type PasswordResetVerifyResponse = {
  resetToken: string;
  message?: string;
};

function fieldErrorsFromDetails(details?: AuthDetail[]) {
  const map: Record<string, string> = {};
  if (!details) return map;

  for (const detail of details) {
    const raw = detail.path ?? '';
    const key = raw.replace(/^body\./, '').replace(/^query\./, '');
    if (key && !map[key]) map[key] = detail.message;
  }
  return map;
}

export function authFieldErrors(error: AuthApiError) {
  return fieldErrorsFromDetails(error.details);
}

export function toSessionUser(
  user: AuthSessionResponse['user'],
  phone = '',
): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? '',
    phone,
    registration: user.registration ?? null,
  };
}

async function parseJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new AuthApiError(
      response.status,
      typeof body.code === 'string' ? body.code : 'REQUEST_FAILED',
      typeof body.message === 'string'
        ? body.message
        : 'Não foi possível concluir a solicitação.',
      Array.isArray(body.details) ? (body.details as AuthDetail[]) : undefined,
    );
  }

  return body as T;
}
