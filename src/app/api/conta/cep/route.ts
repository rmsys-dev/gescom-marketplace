import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { lookupCep } from '@/shared/lib/addresses';
import { GescomError } from '@/shared/lib/gescom';
import { withAuthRetry } from '@/shared/lib/session';

export async function GET(request: Request) {
  try {
    const cep = new URL(request.url).searchParams.get('cep') ?? '';
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      throw new GescomError(422, 'VALIDATION_ERROR', 'Informe um CEP com 8 dígitos.');
    }

    const { data, message } = await withAuthRetry((accessToken) =>
      lookupCep(accessToken, digits),
    );

    return jsonOk({
      cepId: data.cepId,
      cepNumber: data.cepNumber,
      address: data.address,
      neighborhood: data.neighborhood,
      cityName: data.cityName,
      uf: data.uf,
      cityId: data.cityId,
      message,
    });
  } catch (error) {
    return jsonError(error);
  }
}
