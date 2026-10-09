import { loadStoreCatalog } from '@/features/marketplace/gescom-catalog';
import { jsonError, jsonOk } from '@/shared/lib/api-route';

export async function GET() {
  try {
    const catalog = await loadStoreCatalog();
    return jsonOk({
      products: catalog.products,
      categories: catalog.categories,
      message: catalog.message,
    });
  } catch (error) {
    return jsonError(error);
  }
}
