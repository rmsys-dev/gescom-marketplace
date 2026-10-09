/** Placeholder local quando o listing não traz `photoUrl`. */
export const PRODUCT_IMAGE_FALLBACK = '/images/product-placeholder.svg';

function absolutePhotoUrl(photoUrl: string) {
  const trimmed = photoUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return `/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Resolve a galeria do produto. Sem foto na API, usa o placeholder local
 * (os seeds atuais não incluem imagens).
 */
export function resolveProductImages(
  photoUrl: string | null | undefined,
  extra: Array<string | null | undefined> = [],
): string[] {
  const primary = photoUrl ? absolutePhotoUrl(photoUrl) : null;
  const rest = extra
    .map((item) => (item ? absolutePhotoUrl(item) : null))
    .filter((item): item is string => Boolean(item));

  const unique = [...new Set([primary, ...rest].filter((item): item is string => Boolean(item)))];
  return unique.length > 0 ? unique : [PRODUCT_IMAGE_FALLBACK];
}

export function productCoverImage(images: string[] | undefined | null) {
  return images?.[0] || PRODUCT_IMAGE_FALLBACK;
}
