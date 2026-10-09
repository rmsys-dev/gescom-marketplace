import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { fetchUserDetails, mapApiAddress, type AddressType } from '@/shared/lib/addresses';
import { gescomAuthed, GescomError, userPath } from '@/shared/lib/gescom';
import { requireSessionUserId, withAuthRetry } from '@/shared/lib/session';

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    const { data, message } = await withAuthRetry((accessToken) =>
      fetchUserDetails(accessToken, userId),
    );

    const profile = {
      name: data.user.userName,
      phone: data.user.userPhone,
    };

    return jsonOk({
      addresses: (data.addresses ?? []).map((item) => mapApiAddress(item, profile)),
      user: {
        id: data.user.id,
        name: data.user.userName,
        email: data.user.userEmail,
        phone: data.user.userPhone,
      },
      message,
    });
  } catch (error) {
    return jsonError(error);
  }
}

type CreateBody = {
  cepNumber?: string;
  cepId?: string;
  number?: string;
  complement?: string;
  adressType?: AddressType;
  stateRegistration?: string;
};

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const payload = (await request.json()) as CreateBody;

    const cepNumber = payload.cepNumber?.replace(/\D/g, '') ?? '';
    const hasCep = Boolean(payload.cepId) || cepNumber.length === 8;

    if (!hasCep || !payload.number?.trim() || !payload.adressType) {
      throw new GescomError(
        422,
        'VALIDATION_ERROR',
        'Informe CEP, número e tipo do endereço.',
      );
    }

    const body = {
      ...(cepNumber.length === 8
        ? { cepNumber }
        : { cepId: payload.cepId }),
      number: payload.number.trim(),
      ...(payload.complement?.trim() ? { complement: payload.complement.trim() } : {}),
      adressType: payload.adressType,
      ...(payload.stateRegistration?.trim()
        ? { stateRegistration: payload.stateRegistration.trim() }
        : {}),
    };

    const { data, message } = await withAuthRetry((accessToken) =>
      gescomAuthed(
        userPath(userId, '/addresses'),
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        accessToken,
      ),
    );

    const details = await withAuthRetry((accessToken) => fetchUserDetails(accessToken, userId));
    const createdId =
      typeof data === 'object' && data && 'id' in data
        ? String((data as { id: string }).id)
        : null;
    const profile = {
      name: details.data.user.userName,
      phone: details.data.user.userPhone,
    };
    const addresses = (details.data.addresses ?? []).map((item) =>
      mapApiAddress(item, profile),
    );
    const address =
      (createdId ? addresses.find((item) => item.id === createdId) : null) ??
      addresses[addresses.length - 1] ??
      null;

    return jsonOk({ address, addresses, message }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
