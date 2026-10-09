import 'server-only';

import {
  mapStoreGroups,
  mapStoreProductDetail,
  mapStoreProductListItem,
  mapStoreReview,
  mapStoreSubgroups,
  slugifyLabel,
} from '@/features/marketplace/catalog-map';
import type {
  StoreNamedRef,
  StoreProductDetail,
  StoreProductListItem,
  StoreQuestion,
  StoreReview,
} from '@/features/marketplace/catalog-types';
import type { Category, Product, Review } from '@/features/marketplace/types';
import { gescom, storeCatalogPath, type GescomPagination } from '@/shared/lib/gescom';

export type CatalogListQuery = {
  limit?: number;
  offset?: number;
  search?: string;
  group?: string;
  subgroup?: string;
  brand?: string;
  featured?: boolean;
  freeShipping?: boolean;
};

function toQuery(params: CatalogListQuery) {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.search?.trim()) search.set('search', params.search.trim());
  if (params.group?.trim()) search.set('group', params.group.trim());
  if (params.subgroup?.trim()) search.set('subgroup', params.subgroup.trim());
  if (params.brand?.trim()) search.set('brand', params.brand.trim());
  if (params.featured != null) search.set('featured', String(params.featured));
  if (params.freeShipping != null) search.set('freeShipping', String(params.freeShipping));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchStoreProducts(query: CatalogListQuery = {}) {
  const { data, message, pagination } = await gescom<StoreProductListItem[]>(
    storeCatalogPath(`/products${toQuery({ limit: 100, offset: 0, ...query })}`),
    { method: 'GET' },
  );

  const items = Array.isArray(data) ? data.map(mapStoreProductListItem) : [];
  return { products: items, message, pagination };
}

/** Busca todas as páginas (limit máx. 100) até cobrir o total. */
export async function fetchAllStoreProducts(query: Omit<CatalogListQuery, 'limit' | 'offset'> = {}) {
  const pageSize = 100;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  const products: Product[] = [];
  let message = 'OK';
  let lastPagination: GescomPagination | undefined;

  while (offset < total) {
    const page = await fetchStoreProducts({ ...query, limit: pageSize, offset });
    products.push(...page.products);
    message = page.message;
    lastPagination = page.pagination;
    total = page.pagination?.total ?? page.products.length;
    if (page.products.length === 0) break;
    offset += pageSize;
    if (!page.pagination) break;
  }

  return { products, message, pagination: lastPagination };
}

export async function fetchStoreProduct(idOrSlug: string) {
  const { data, message } = await gescom<StoreProductDetail>(
    storeCatalogPath(`/products/${encodeURIComponent(idOrSlug)}`),
    { method: 'GET' },
  );
  return { product: mapStoreProductDetail(data), raw: data, message };
}

export async function fetchStoreGroups() {
  const { data, message } = await gescom<StoreNamedRef[]>(storeCatalogPath('/groups'), {
    method: 'GET',
  });
  const groups = Array.isArray(data) ? data : [];
  return { categories: mapStoreGroups(groups), groups, message };
}

export async function fetchStoreSubgroups() {
  const { data, message } = await gescom<StoreNamedRef[]>(storeCatalogPath('/subgroups'), {
    method: 'GET',
  });
  const subgroups = Array.isArray(data) ? data : [];
  return { subcategories: mapStoreSubgroups(subgroups), subgroups, message };
}

export async function fetchStoreBrands() {
  const { data, message } = await gescom<StoreNamedRef[]>(storeCatalogPath('/brands'), {
    method: 'GET',
  });
  return { brands: Array.isArray(data) ? data : [], message };
}

export async function fetchStoreProductReviews(productId: string, query?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (query?.limit != null) search.set('limit', String(query.limit));
  if (query?.offset != null) search.set('offset', String(query.offset));
  const qs = search.toString();
  const { data, message, pagination } = await gescom<StoreReview[]>(
    storeCatalogPath(`/products/${encodeURIComponent(productId)}/reviews${qs ? `?${qs}` : ''}`),
    { method: 'GET' },
  );
  const reviews: Review[] = Array.isArray(data)
    ? data.map((item) => mapStoreReview(item, productId))
    : [];
  return { reviews, message, pagination };
}

export async function fetchStoreProductQuestions(productId: string) {
  const { data, message } = await gescom<StoreQuestion[]>(
    storeCatalogPath(`/products/${encodeURIComponent(productId)}/questions`),
    { method: 'GET' },
  );
  return { questions: Array.isArray(data) ? data : [], message };
}

export async function findStoreCategoryBySlug(slug: string): Promise<Category | null> {
  const { categories } = await fetchStoreGroups();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function findStoreSubcategoryBySlug(slug: string): Promise<Category | null> {
  const { subcategories } = await fetchStoreSubgroups();
  return subcategories.find((item) => item.slug === slug) ?? null;
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1))
    .join(' ');
}

function mergeNamedCatalog(
  fromApi: Category[],
  refs: StoreNamedRef[],
  fromProducts: Map<string, Category>,
) {
  const bySlug = new Map<string, Category>();
  for (const item of [...fromApi, ...fromProducts.values()]) {
    bySlug.set(item.slug, item);
  }

  for (const ref of refs) {
    const slug = slugifyLabel(ref.name);
    const current = bySlug.get(slug);
    if (current) {
      bySlug.set(slug, {
        ...current,
        name: ref.name,
        description: `Produtos em ${ref.name}.`,
      });
    }
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function loadStoreCatalog() {
  const [productsResult, groupsResult, subgroupsResult] = await Promise.all([
    fetchAllStoreProducts(),
    fetchStoreGroups(),
    fetchStoreSubgroups(),
  ]);

  // Garante categorias presentes nos produtos mesmo se /groups vier vazio.
  const categoriesFromProducts = new Map<string, Category>();
  const subcategoriesFromProducts = new Map<string, Category>();
  for (const product of productsResult.products) {
    if (product.categorySlug && !categoriesFromProducts.has(product.categorySlug)) {
      const groupName =
        groupsResult.categories.find((item) => item.slug === product.categorySlug)?.name ??
        product.categorySlug;
      categoriesFromProducts.set(product.categorySlug, {
        slug: product.categorySlug,
        name: titleFromSlug(groupName),
        description: `Produtos em ${groupName}.`,
      });
    }
    if (product.subcategorySlug && !subcategoriesFromProducts.has(product.subcategorySlug)) {
      const subgroupName =
        subgroupsResult.subcategories.find((item) => item.slug === product.subcategorySlug)
          ?.name ?? product.subcategorySlug;
      subcategoriesFromProducts.set(product.subcategorySlug, {
        slug: product.subcategorySlug,
        name: titleFromSlug(subgroupName),
        description: `Produtos em ${subgroupName}.`,
      });
    }
  }

  return {
    products: productsResult.products,
    categories: mergeNamedCatalog(
      groupsResult.categories,
      groupsResult.groups,
      categoriesFromProducts,
    ),
    subcategories: mergeNamedCatalog(
      subgroupsResult.subcategories,
      subgroupsResult.subgroups,
      subcategoriesFromProducts,
    ),
    message: productsResult.message,
  };
}
