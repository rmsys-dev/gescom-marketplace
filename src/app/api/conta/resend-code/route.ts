import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { gescom, storePath } from '@/shared/lib/gescom';

type ResendData = {
  emailConfirmationRequired: boolean;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { data, message } = await gescom<ResendData>(storePath('/resend-code'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return jsonOk({ ...data, message });
  } catch (error) {
    return jsonError(error);
  }
}
