import type {
  StoreCharacteristic,
  StoreNamedRef,
  StoreProductDetail,
  StoreProductListItem,
  StoreRating,
  StoreReview,
  StoreVariant,
  StoreVariantOption,
} from '@/features/marketplace/catalog-types';
import { resolveProductImages } from '@/features/marketplace/product-images';
import type {
  Category,
  Product,
  ProductSpec,
  ProductVariant,
  Review,
} from '@/features/marketplace/types';

export function slugifyLabel(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function decimalToCents(value: string | number | null | undefined) {
  if (value == null || value === '') return 0;
  const amount = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function parseStock(value: string | number | null | undefined) {
  if (value == null || value === '') return 0;
  const amount = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.max(0, Math.trunc(amount));
}

export function categoryFromGroup(group: StoreNamedRef | null | undefined): Category | null {
  if (!group?.name) return null;
  const slug = slugifyLabel(group.name);
  if (!slug) return null;
  return {
    slug,
    name: group.name,
    description: `Produtos em ${group.name}.`,
  };
}

function summarize(item: StoreProductListItem) {
  const parts = [item.brand?.name, item.subgroup?.name, item.group?.name].filter(Boolean);
  return parts[0] ? String(parts[0]) : 'Produto da loja';
}

function mapSpecs(characteristics: StoreCharacteristic[] | undefined): ProductSpec[] {
  if (!characteristics?.length) return [];
  return characteristics
    .map((item) => {
      const label = (item.label ?? item.name ?? '').trim();
      const value = String(item.value ?? '').trim();
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((item): item is ProductSpec => item != null);
}

function mapVariants(
  variants: StoreVariant[] | undefined,
  options: StoreVariantOption[] | undefined,
): { variantLabel?: string; variants?: ProductVariant[] } {
  const optionLabel = options?.find((item) => item.name)?.name;
  if (variants?.length) {
    return {
      variantLabel: optionLabel,
      variants: variants.map((variant, index) => {
        const fromOptions =
          variant.optionValues && Object.values(variant.optionValues).filter(Boolean).join(' / ');
        const label = (variant.label ?? variant.name ?? fromOptions ?? `Opção ${index + 1}`).trim();
        return {
          id: variant.id || slugifyLabel(label) || `variant-${index}`,
          label,
        };
      }),
    };
  }

  const first = options?.[0];
  if (first?.values?.length) {
    return {
      variantLabel: first.name,
      variants: first.values.map((value) => ({
        id: slugifyLabel(value) || value,
        label: value,
      })),
    };
  }

  return {};
}

function mapRating(rating: StoreRating | number | null | undefined, reviewCount?: number | null) {
  if (typeof rating === 'number') {
    return { rating: rating || 0, reviewCount: reviewCount ?? 0 };
  }
  return {
    rating: Number(rating?.average ?? 0) || 0,
    reviewCount: Number(rating?.count ?? reviewCount ?? 0) || 0,
  };
}

export function mapStoreProductListItem(item: StoreProductListItem): Product {
  const listPrice = decimalToCents(item.price);
  const promo = decimalToCents(item.promotionalPrice ?? item.promotion?.price);
  const onPromo = promo > 0 && promo < listPrice;
  const category = categoryFromGroup(item.group);
  const images = resolveProductImages(item.photoUrl);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    summary: summarize(item),
    description: '',
    price: onPromo ? promo : listPrice,
    compareAtPrice: onPromo ? listPrice : null,
    categorySlug: category?.slug ?? 'outros',
    images,
    rating: 0,
    reviewCount: 0,
    stock: parseStock(item.stockBalance),
    condition: 'novo',
    freeShipping: false,
    specs: [],
    featured: Boolean(item.featured),
  };
}

export function mapStoreProductDetail(item: StoreProductDetail): Product {
  const base = mapStoreProductListItem(item);
  const extraImages = item.images ?? item.photoUrls ?? [];
  const variantPhotos = (item.variants ?? []).map((variant) => variant.photoUrl);
  const images = resolveProductImages(item.photoUrl, [...extraImages, ...variantPhotos]);
  const { rating, reviewCount } = mapRating(item.rating, item.reviewCount);
  const { variantLabel, variants } = mapVariants(item.variants, item.variantOptions);
  const description = (item.description ?? '').trim();

  return {
    ...base,
    summary: description
      ? description.split(/\n+/)[0]!.slice(0, 140)
      : base.summary,
    description: description || base.summary,
    images,
    rating,
    reviewCount,
    specs: mapSpecs(item.characteristics),
    ...(variantLabel ? { variantLabel } : {}),
    ...(variants?.length ? { variants } : {}),
  };
}

export function mapStoreReview(review: StoreReview, productId: string): Review {
  const author =
    (review.authorName ?? review.customerName ?? 'Cliente').trim() || 'Cliente';
  return {
    id: review.id,
    productId,
    author,
    rating: review.rating,
    comment: (review.comment ?? review.title ?? '').trim(),
    createdAt: review.createdAt ?? new Date().toISOString(),
  };
}

export function mapStoreGroups(groups: StoreNamedRef[]): Category[] {
  const seen = new Set<string>();
  const categories: Category[] = [];
  for (const group of groups) {
    const category = categoryFromGroup(group);
    if (!category || seen.has(category.slug)) continue;
    seen.add(category.slug);
    categories.push(category);
  }
  return categories.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
