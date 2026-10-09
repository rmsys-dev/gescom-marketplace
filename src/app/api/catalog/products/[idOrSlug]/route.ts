import {
  fetchStoreProduct,
  fetchStoreProductReviews,
} from '@/features/marketplace/gescom-catalog';
import { mapStoreReview } from '@/features/marketplace/catalog-map';
import { jsonError, jsonOk } from '@/shared/lib/api-route';
import { GescomError } from '@/shared/lib/gescom';

type RouteContext = { params: Promise<{ idOrSlug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { idOrSlug } = await context.params;
    const { product, raw, message } = await fetchStoreProduct(idOrSlug);

    let reviews = (raw.reviews ?? []).map((item) => mapStoreReview(item, product.id));
    if (reviews.length === 0) {
      try {
        const fetched = await fetchStoreProductReviews(product.id, { limit: 50, offset: 0 });
        reviews = fetched.reviews;
      } catch {
        // Reviews avulsas são opcionais na PDP.
      }
    }

    return jsonOk({
      product: {
        ...product,
        reviewCount: product.reviewCount || reviews.length,
      },
      reviews,
      questions: raw.questions ?? [],
      message,
    });
  } catch (error) {
    if (error instanceof GescomError && error.code === 'PRODUCT_NOT_FOUND') {
      return jsonError(error);
    }
    return jsonError(error);
  }
}
