import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { gescom } from '@/shared/lib/gescom';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { data, message } = await gescom<Record<string, never>>(
      '/api/v1/auth/password-reset/request',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return jsonOk({ ...(data ?? {}), message });
  } catch (error) {
    return jsonError(error);
  }
}
