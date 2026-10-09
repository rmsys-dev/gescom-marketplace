/** Placeholder local quando o listing não traz fotos. */
export const PRODUCT_IMAGE_FALLBACK = '/images/product-placeholder.svg';

const MAX_GALLERY_PHOTOS = 6;

function apiBaseUrl() {
  const raw = process.env.GESCOM_API_URL ?? process.env.API_URL ?? '';
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '');
}

/**
 * Monta o `src` absoluto a partir do path relativo da API (`/fotos/...`).
 * Assets locais da loja (`/images/...`) e URLs http(s) passam intactos.
 */
export function productImageSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/images/')) return trimmed;

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = apiBaseUrl();
  return base ? `${base}${normalized}` : normalized;
}

/**
 * Galeria do produto: usa `photos` da API (principal + extras, máx. 6).
 * Fallback de capa: `photos[0] ?? photoUrl`. Sem imagem → placeholder local.
 */
export function resolveProductImages(
  photos: Array<string | null | undefined> | null | undefined,
  photoUrl?: string | null,
): string[] {
  const paths =
    photos && photos.length > 0
      ? photos
      : photoUrl
        ? [photoUrl]
        : [];

  const unique = [
    ...new Set(
      paths.map(productImageSrc).filter((src): src is string => Boolean(src)),
    ),
  ].slice(0, MAX_GALLERY_PHOTOS);

  return unique.length > 0 ? unique : [PRODUCT_IMAGE_FALLBACK];
}

/** Capa do card: primeira da galeria (já resolvida) ou placeholder. */
export function productCoverImage(images: string[] | undefined | null) {
  return images?.[0] || PRODUCT_IMAGE_FALLBACK;
}
