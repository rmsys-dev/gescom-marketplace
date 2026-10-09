import { fetchStoreProducts } from '@/features/marketplace/gescom-catalog';
import { jsonError, jsonOk } from '@/shared/lib/api-route';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const result = await fetchStoreProducts({
      limit: Number(searchParams.get('limit') ?? 24) || 24,
      offset: Number(searchParams.get('offset') ?? 0) || 0,
      search: searchParams.get('search') ?? undefined,
      group: searchParams.get('group') ?? undefined,
      subgroup: searchParams.get('subgroup') ?? undefined,
      brand: searchParams.get('brand') ?? undefined,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    });

    return jsonOk({
      products: result.products,
      pagination: result.pagination ?? null,
      message: result.message,
    });
  } catch (error) {
    return jsonError(error);
  }
}
