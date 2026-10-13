import { jsonError, jsonOk } from '@/shared/lib/api-route';
import {
  buildAddressBody,
  deleteUserAddressOnApi,
  fetchUserAddresses,
  mapApiAddress,
  type AddressInput,
  updateUserAddressOnApi,
} from '@/shared/lib/addresses';
import { requireSessionUserId, withAuthRetry } from '@/shared/lib/session';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ addressId: string }> },
) {
  try {
    const { addressId } = await context.params;
    await requireSessionUserId();
    const payload = (await request.json()) as AddressInput;
    const body = buildAddressBody(payload);

    const { message } = await withAuthRetry((accessToken) =>
      updateUserAddressOnApi(accessToken, addressId, body),
    );

    const listed = await withAuthRetry((accessToken) => fetchUserAddresses(accessToken));
    const addresses = (listed.data ?? []).map((item) => mapApiAddress(item));
    const address = addresses.find((item) => item.id === addressId) ?? null;

    return jsonOk({ address, addresses, message });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ addressId: string }> },
) {
  try {
    const { addressId } = await context.params;
    await requireSessionUserId();

    const { data, message } = await withAuthRetry((accessToken) =>
      deleteUserAddressOnApi(accessToken, addressId),
    );

    return jsonOk({
      ok: true,
      id: data.id ?? addressId,
      deletedAt: data.deletedAt,
      message,
    });
  } catch (error) {
    return jsonError(error);
  }
}
