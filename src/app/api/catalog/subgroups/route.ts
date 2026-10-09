import { fetchStoreSubgroups } from '@/features/marketplace/gescom-catalog';
import { jsonError, jsonOk } from '@/shared/lib/api-route';

export async function GET() {
  try {
    const result = await fetchStoreSubgroups();
    return jsonOk({
      subcategories: result.subcategories,
      subgroups: result.subgroups,
      message: result.message,
    });
  } catch (error) {
    return jsonError(error);
  }
}
