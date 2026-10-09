import { fetchStoreGroups } from '@/features/marketplace/gescom-catalog';
import { jsonError, jsonOk } from '@/shared/lib/api-route';

export async function GET() {
  try {
    const result = await fetchStoreGroups();
    return jsonOk({
      categories: result.categories,
      groups: result.groups,
      message: result.message,
    });
  } catch (error) {
    return jsonError(error);
  }
}
