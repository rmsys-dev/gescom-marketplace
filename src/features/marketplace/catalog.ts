import { CONDITIONS, PRICE_BANDS } from '@/features/marketplace/filters';
import type { CartLine, CatalogQuery, Category, Product } from '@/features/marketplace/types';

let productsCache: Product[] = [];
let categoriesCache: Category[] = [];
let subcategoriesCache: Category[] = [];
let catalogReady = false;

export function setCatalogData(
  products: Product[],
  categories: Category[],
  subcategories: Category[] = [],
) {
  productsCache = products;
  categoriesCache = categories;
  subcategoriesCache = subcategories;
  catalogReady = true;
}

export function isCatalogReady() {
  return catalogReady;
}

export function catalogOf() {
  return productsCache;
}

export function categoriesOf() {
  return categoriesCache;
}

export function subcategoriesOf() {
  return subcategoriesCache;
}

export function getCategory(slug: string) {
  return categoriesCache.find((category) => category.slug === slug) ?? null;
}

export function getSubcategory(slug: string) {
  return subcategoriesCache.find((item) => item.slug === slug) ?? null;
}

export function getProductBySlug(slug: string) {
  return productsCache.find((product) => product.slug === slug) ?? null;
}

export function getProductById(id: string) {
  return productsCache.find((product) => product.id === id) ?? null;
}

function ensureCategory(slug: string, cache: Category[], name = slug) {
  if (!slug || cache.some((item) => item.slug === slug)) return cache;
  return [
    ...cache,
    {
      slug,
      name,
      description: `Produtos em ${name}.`,
    },
  ];
}

export function upsertCatalogProduct(product: Product) {
  const index = productsCache.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    productsCache = productsCache.map((item, i) => (i === index ? product : item));
  } else {
    productsCache = [...productsCache, product];
  }

  categoriesCache = ensureCategory(product.categorySlug, categoriesCache);
  if (product.subcategorySlug) {
    subcategoriesCache = ensureCategory(product.subcategorySlug, subcategoriesCache);
  }
}

export function formatSearchTerm(value: string) {
  const term = value.trim();
  const first = term.charAt(0);
  if (!first) return '';
  return first.toLocaleUpperCase('pt-BR') + term.slice(1);
}

function fold(value: string) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
}

export function isOnSale(product: Product) {
  return product.compareAtPrice != null && product.compareAtPrice > product.price;
}

function matchesPrice(price: number, query: CatalogQuery) {
  let min = query.priceMin ?? null;
  let max = query.priceMax ?? null;
  if (min != null && max != null && min > max) {
    const swap = min;
    min = max;
    max = swap;
  }
  if (min != null || max != null) {
    if (min != null && price < min) return false;
    if (max != null && price > max) return false;
    return true;
  }

  const reais = price / 100;
  const band = query.price;
  if (!band) return true;
  if (band === 'ate-50') return reais <= 50;
  if (band === '50-150') return reais > 50 && reais <= 150;
  if (band === '150-400') return reais > 150 && reais <= 400;
  return reais > 400;
}

export function filterCatalog(products: Product[], query: CatalogQuery) {
  const term = fold(query.q?.trim() ?? '');
  const filtered = products.filter((product) => {
    if (query.category && product.categorySlug !== query.category) return false;
    if (query.subcategory && product.subcategorySlug !== query.subcategory) return false;
    if (query.freeShipping && !product.freeShipping) return false;
    if (query.condition && product.condition !== query.condition) return false;
    if (query.onSale && !isOnSale(product)) return false;
    if (!matchesPrice(product.price, query)) return false;
    if (query.favoritesOnly && !query.favoriteIds?.includes(product.id)) return false;
    if (!term) return true;
    const category = getCategory(product.categorySlug);
    const subcategory = product.subcategorySlug
      ? getSubcategory(product.subcategorySlug)
      : null;
    const haystack = fold(
      [product.name, product.summary, category?.name ?? '', subcategory?.name ?? ''].join(' '),
    );
    return haystack.includes(term);
  });

  const sort = query.sort ?? 'relevancia';
  const ranked = [...filtered];
  if (sort === 'menor-preco') ranked.sort((a, b) => a.price - b.price);
  if (sort === 'maior-preco') ranked.sort((a, b) => b.price - a.price);
  if (sort === 'avaliacao')
    ranked.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  return ranked;
}

export function resolveCart(cart: CartLine[], products: Product[]) {
  return cart.map((line) => ({
    ...line,
    product: products.find((product) => product.id === line.productId) ?? null,
  }));
}

export function relatedCategories(products: Product[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .flatMap(([slug]) => {
      const category = getCategory(slug);
      return category ? [category] : [];
    });
}

export function relatedSubcategories(products: Product[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.subcategorySlug) continue;
    counts.set(
      product.subcategorySlug,
      (counts.get(product.subcategorySlug) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .flatMap(([slug]) => {
      const subcategory = getSubcategory(slug);
      return subcategory ? [subcategory] : [];
    });
}

export function relatedProducts(product: Product, products: Product[]) {
  const sameSubcategory = product.subcategorySlug
    ? products.filter(
        (item) =>
          item.subcategorySlug === product.subcategorySlug &&
          item.id !== product.id &&
          item.stock > 0,
      )
    : [];
  if (sameSubcategory.length > 0) return sameSubcategory.slice(0, 4);

  return products
    .filter(
      (item) =>
        item.categorySlug === product.categorySlug && item.id !== product.id && item.stock > 0,
    )
    .slice(0, 4);
}

export function catalogFacets(products: Product[], query: CatalogQuery) {
  const categoryQuery = { ...query, category: undefined };
  const subcategoryQuery = { ...query, subcategory: undefined };
  const priceQuery = { ...query, price: '' as const, priceMin: null, priceMax: null };
  const conditionQuery = { ...query, condition: '' as const };
  const shippingQuery = { ...query, freeShipping: false };
  const saleQuery = { ...query, onSale: false };
  const rangeActive = query.priceMin != null || query.priceMax != null;

  const categories = categoriesOf()
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      count: filterCatalog(products, { ...categoryQuery, category: category.slug }).length,
    }))
    .filter((item) => item.count > 0 || item.slug === query.category)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));

  const subcategories = subcategoriesOf()
    .map((subcategory) => ({
      slug: subcategory.slug,
      name: subcategory.name,
      count: filterCatalog(products, {
        ...subcategoryQuery,
        subcategory: subcategory.slug,
      }).length,
    }))
    .filter((item) => item.count > 0 || item.slug === query.subcategory)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));

  const prices = PRICE_BANDS.map((band) => ({
    ...band,
    count: filterCatalog(products, { ...priceQuery, price: band.id }).length,
  })).filter((item) => item.count > 0 || (!rangeActive && query.price === item.id));

  const conditions = CONDITIONS.map((item) => ({
    ...item,
    count: filterCatalog(products, { ...conditionQuery, condition: item.id }).length,
  })).filter((item) => item.count > 0 || query.condition === item.id);

  return {
    total: filterCatalog(products, query).length,
    categories,
    subcategories,
    prices,
    conditions,
    freeShipping: filterCatalog(products, { ...shippingQuery, freeShipping: true }).length,
    onSale: filterCatalog(products, { ...saleQuery, onSale: true }).length,
  };
}

export function countInCategory(slug: string, products: Product[]) {
  return products.filter((product) => product.categorySlug === slug).length;
}

export function countInSubcategory(slug: string, products: Product[]) {
  return products.filter((product) => product.subcategorySlug === slug).length;
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number) {
  const size = Math.max(1, Math.trunc(pageSize) || 1);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pages);
  const start = (current - 1) * size;
  const slice = items.slice(start, start + size);

  return {
    items: slice,
    page: current,
    pages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}
