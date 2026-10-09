import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { fetchUserDetails, mapApiAddress, type AddressType } from '@/shared/lib/addresses';
import { gescomAuthed, GescomError, userPath } from '@/shared/lib/gescom';
import { requireSessionUserId, withAuthRetry } from '@/shared/lib/session';

type PatchBody = {
  cepNumber?: string;
  cepId?: string;
  number?: string;
  complement?: string | null;
  adressType?: AddressType;
  stateRegistration?: string | null;
  softDelete?: boolean;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: addressId } = await context.params;
    const userId = await requireSessionUserId();
    const payload = (await request.json()) as PatchBody;

    if (payload.softDelete) {
      await withAuthRetry((accessToken) =>
        gescomAuthed(
          userPath(userId, `/addresses/${addressId}`),
          {
            method: 'PATCH',
            body: JSON.stringify({ softDelete: true }),
          },
          accessToken,
        ),
      );
      return jsonOk({ ok: true, id: addressId });
    }

    const body: Record<string, unknown> = {};
    const cepNumber = payload.cepNumber?.replace(/\D/g, '') ?? '';
    if (cepNumber.length === 8) body.cepNumber = cepNumber;
    else if (payload.cepId) body.cepId = payload.cepId;
    if (typeof payload.number === 'string' && payload.number.trim()) {
      body.number = payload.number.trim();
    }
    if (payload.complement !== undefined) {
      body.complement = payload.complement?.trim() || null;
    }
    if (payload.adressType) body.adressType = payload.adressType;
    if (payload.stateRegistration !== undefined) {
      body.stateRegistration = payload.stateRegistration?.trim() || null;
    }

    if (Object.keys(body).length === 0) {
      throw new GescomError(422, 'VALIDATION_ERROR', 'Envie ao menos um campo para atualizar.');
    }

    const { message } = await withAuthRetry((accessToken) =>
      gescomAuthed(
        userPath(userId, `/addresses/${addressId}`),
        {
          method: 'PATCH',
          body: JSON.stringify(body),
        },
        accessToken,
      ),
    );

    const details = await withAuthRetry((accessToken) => fetchUserDetails(accessToken, userId));
    const profile = {
      name: details.data.user.userName,
      phone: details.data.user.userPhone,
    };
    const addresses = (details.data.addresses ?? []).map((item) =>
      mapApiAddress(item, profile),
    );
    const address = addresses.find((item) => item.id === addressId) ?? null;

    return jsonOk({ address, addresses, message });
  } catch (error) {
    return jsonError(error);
  }
}
