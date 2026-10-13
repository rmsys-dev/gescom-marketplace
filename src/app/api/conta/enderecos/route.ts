import { jsonError, jsonOk } from '@/shared/lib/api-route';
import {
  buildAddressBody,
  createUserAddressOnApi,
  fetchUserAddresses,
  mapApiAddress,
  type AddressInput,
} from '@/shared/lib/addresses';
import { requireSessionUserId, withAuthRetry } from '@/shared/lib/session';

export async function GET() {
  try {
    await requireSessionUserId();
    const { data, message } = await withAuthRetry((accessToken) =>
      fetchUserAddresses(accessToken),
    );

    return jsonOk({
      addresses: (data ?? []).map((item) => mapApiAddress(item)),
      message,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUserId();
    const payload = (await request.json()) as AddressInput;
    const body = buildAddressBody(payload);

    const { data, message } = await withAuthRetry((accessToken) =>
      createUserAddressOnApi(accessToken, body),
    );

    const listed = await withAuthRetry((accessToken) => fetchUserAddresses(accessToken));
    const createdId = data.userAddress?.id ?? null;
    const addresses = (listed.data ?? []).map((item) => mapApiAddress(item));
    const address =
      (createdId ? addresses.find((item) => item.id === createdId) : null) ??
      addresses[addresses.length - 1] ??
      null;

    return jsonOk({ address, addresses, message }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
