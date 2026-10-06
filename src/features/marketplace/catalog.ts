import { CATEGORIES, PRODUCTS } from '@/features/marketplace/data';
import type { CartLine, CatalogQuery, Product } from '@/features/marketplace/types';

export function catalogOf() {
  return PRODUCTS;
}

export function getCategory(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug) ?? null;
}

export function getProductBySlug(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export function getProductById(id: string) {
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

function fold(value: string) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
}

function matchesPrice(price: number, band: CatalogQuery['price']) {
  const reais = price / 100;
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
    if (query.freeShipping && !product.freeShipping) return false;
    if (query.condition && product.condition !== query.condition) return false;
    if (!matchesPrice(product.price, query.price)) return false;
    if (query.favoritesOnly && !query.favoriteIds?.includes(product.id)) return false;
    if (!term) return true;
    const category = getCategory(product.categorySlug);
    const haystack = fold([product.name, product.summary, category?.name ?? ''].join(' '));
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

export function relatedProducts(product: Product, products: Product[]) {
  return products
    .filter(
      (item) =>
        item.categorySlug === product.categorySlug && item.id !== product.id && item.stock > 0,
    )
    .slice(0, 4);
}

export function countInCategory(slug: string, products: Product[]) {
  return products.filter((product) => product.categorySlug === slug).length;
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
