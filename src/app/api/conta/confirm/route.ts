import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { gescom, storePath } from '@/shared/lib/gescom';
import { persistAuthSession, type AuthSessionData } from '@/shared/lib/session';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { data, message } = await gescom<AuthSessionData>(storePath('/confirm-email'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const session = await persistAuthSession(data);
    return jsonOk({ ...session, message });
  } catch (error) {
    return jsonError(error);
  }
}
