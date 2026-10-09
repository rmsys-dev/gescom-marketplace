import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { gescom, storePath } from '@/shared/lib/gescom';

type RegisterData = {
  emailConfirmationRequired: boolean;
  email: string;
  expiresInMinutes: number;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { data, message } = await gescom<RegisterData>(storePath('/register'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return jsonOk({ ...data, message }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
