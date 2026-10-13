import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { requireSessionUserId } from '@/shared/lib/session';
import { fetchViaCep } from '@/shared/lib/viacep';

export async function GET(request: Request) {
  try {
    await requireSessionUserId();
    const cep = new URL(request.url).searchParams.get('cep') ?? '';
    const data = await fetchViaCep(cep);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}
