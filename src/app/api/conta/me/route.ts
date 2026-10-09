import { cookies } from 'next/headers';

import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { gescomAuthed } from '@/shared/lib/gescom';
import {
  clearSession,
  USER_ID_COOKIE,
  withAuthRetry,
  type AuthEnterprise,
  type AuthUser,
} from '@/shared/lib/session';

type MeData = {
  user: AuthUser;
  enterprise: AuthEnterprise | null;
  modules?: unknown[];
};

export async function GET() {
  try {
    const { data } = await withAuthRetry((accessToken) =>
      gescomAuthed<MeData>('/api/v1/auth/me', { method: 'GET' }, accessToken),
    );

    if (data.user?.id) {
      const jar = await cookies();
      jar.set(USER_ID_COOKIE, data.user.id, {
        httpOnly: true,
        secure: process.env.AUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return jsonOk({
      user: data.user,
      enterprise: data.enterprise ?? null,
    });
  } catch (error) {
    await clearSession();
    return jsonError(error);
  }
}
