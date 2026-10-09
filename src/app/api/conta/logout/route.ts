import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { gescomAuthed } from '@/shared/lib/gescom';
import { clearSession, getAccessToken } from '@/shared/lib/session';

export async function POST() {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      try {
        await gescomAuthed('/api/v1/auth/logout', { method: 'POST' }, accessToken);
      } catch {
        // Limpa a sessão local mesmo se o access token já expirou.
      }
    }
    await clearSession();
    return jsonOk({ ok: true });
  } catch (error) {
    await clearSession();
    return jsonError(error);
  }
}
