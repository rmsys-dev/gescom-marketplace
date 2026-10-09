import 'server-only';

import { cookies } from 'next/headers';

import { gescom, GescomError } from '@/shared/lib/gescom';

const base = {
  httpOnly: true,
  secure: process.env.AUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const ACCESS_COOKIE = 'gescom_access';
export const REFRESH_COOKIE = 'gescom_refresh';
export const USER_ID_COOKIE = 'gescom_user_id';

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  registration?: string | null;
  onboardingCompleted?: boolean;
};

export type AuthEnterprise = {
  id: string;
  registration?: string;
  tradeName?: string;
  legalName?: string;
  memberId: string;
  class: string;
  parameters?: Record<string, unknown>;
};

export type AuthSessionData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  enterprises: AuthEnterprise[];
};

export type SessionPayload = {
  user: AuthUser;
  enterprise: AuthEnterprise | null;
};

export async function saveSession(
  accessToken: string,
  refreshToken: string,
  userId?: string,
) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: 60 * 15 });
  jar.set(REFRESH_COOKIE, refreshToken, { ...base, maxAge: 60 * 60 * 24 * 7 });
  if (userId) {
    jar.set(USER_ID_COOKIE, userId, { ...base, maxAge: 60 * 60 * 24 * 7 });
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(USER_ID_COOKIE);
}

export async function getAccessToken() {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export async function getSessionUserId() {
  const jar = await cookies();
  return jar.get(USER_ID_COOKIE)?.value;
}

export async function requireSessionUserId() {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new GescomError(401, 'UNAUTHENTICATED', 'Sessão expirada. Entre novamente.');
  }
  return userId;
}

export function toSessionPayload(data: AuthSessionData): SessionPayload {
  return {
    user: data.user,
    enterprise: data.enterprises[0] ?? null,
  };
}

export async function persistAuthSession(data: AuthSessionData): Promise<SessionPayload> {
  await saveSession(data.accessToken, data.refreshToken, data.user.id);
  return toSessionPayload(data);
}

type RefreshData = {
  accessToken: string;
  refreshToken: string;
};

export async function refreshSession(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearSession();
    return null;
  }

  try {
    const userId = await getSessionUserId();
    const { data } = await gescom<RefreshData>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    await saveSession(data.accessToken, data.refreshToken, userId);
    return data.accessToken;
  } catch {
    await clearSession();
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const access = await getAccessToken();
  if (access) return access;

  return refreshSession();
}

export async function withAuthRetry<T>(
  run: (accessToken: string) => Promise<{ data: T; message: string }>,
): Promise<{ data: T; message: string }> {
  let accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new GescomError(401, 'UNAUTHENTICATED', 'Sessão expirada. Entre novamente.');
  }

  try {
    return await run(accessToken);
  } catch (error) {
    if (
      !(error instanceof GescomError) ||
      error.status !== 401 ||
      error.code !== 'INVALID_ACCESS_TOKEN'
    ) {
      throw error;
    }

    accessToken = await refreshSession();
    if (!accessToken) {
      throw new GescomError(401, 'UNAUTHENTICATED', 'Sessão expirada. Entre novamente.');
    }
    return run(accessToken);
  }
}
