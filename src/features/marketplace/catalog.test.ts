import { beforeEach, describe, expect, it } from 'vitest';

import {
  catalogFacets,
  filterCatalog,
  formatSearchTerm,
  paginate,
  relatedCategories,
  resolveCart,
  setCatalogData,
} from '@/features/marketplace/catalog';
import { decimalToCents, mapStoreProductListItem, parseStock } from '@/features/marketplace/catalog-map';
import { CATEGORIES, PRODUCTS } from '@/features/marketplace/data';
import { countActiveFilters, readFilters } from '@/features/marketplace/filters';
import {
  cartTotals,
  discountPercent,
  formatPriceParam,
  parseReais,
} from '@/features/marketplace/money';
import { PRODUCT_IMAGE_FALLBACK, resolveProductImages } from '@/features/marketplace/product-images';
import type { StoreProductListItem } from '@/features/marketplace/catalog-types';

beforeEach(() => {
  setCatalogData(PRODUCTS, CATEGORIES);
});

describe('catálogo', () => {
  it('deixa maiúscula só a primeira letra do termo', () => {
    expect(formatSearchTerm('casa')).toBe('Casa');
    expect(formatSearchTerm('  fone bluetooth  ')).toBe('Fone bluetooth');
    expect(formatSearchTerm('Época')).toBe('Época');
  });

  it('encontra produto ignorando acento', () => {
    const result = filterCatalog(PRODUCTS, { q: 'cafe' });
    expect(result.map((product) => product.id)).toContain('p-cafe');
  });

  it('aplica faixa de preço', () => {
    const result = filterCatalog(PRODUCTS, { price: 'ate-50' });
    expect(result.map((product) => product.id).sort()).toEqual(['p-cafe', 'p-livro']);
  });

  it('aplica mínimo e máximo no lugar da faixa', () => {
    const result = filterCatalog(PRODUCTS, {
      price: 'ate-50',
      priceMin: 100_000,
      priceMax: 200_000,
    });
    expect(result.map((product) => product.id)).toEqual(['p-celular']);
  });

  it('filtra produtos em oferta', () => {
    const result = filterCatalog(PRODUCTS, { onSale: true });
    expect(result.map((product) => product.id).sort()).toEqual([
      'p-fone',
      'p-luminaria',
      'p-tenis',
    ]);
  });

  it('conta as categorias sem prender a categoria atual', () => {
    const facets = catalogFacets(PRODUCTS, { category: 'moda', freeShipping: true });
    expect(facets.total).toBe(
      filterCatalog(PRODUCTS, { category: 'moda', freeShipping: true }).length,
    );
    expect(
      facets.categories.find((category) => category.slug === 'eletronicos')?.count,
    ).toBeGreaterThan(0);
    expect(facets.categories.find((category) => category.slug === 'moda')?.count).toBe(
      facets.total,
    );
  });

  it('lê faixa livre e oferta na query', () => {
    const filters = readFilters(new URLSearchParams('preco=ate-50&min=10&oferta=1&frete=gratis'));
    expect(filters.price).toBe('');
    expect(filters.priceMin).toBe(1_000);
    expect(filters.onSale).toBe(true);
    expect(countActiveFilters(filters)).toBe(3);
  });

  it('ordena as categorias da busca pela quantidade de produtos', () => {
    const picked = PRODUCTS.filter((product) =>
      ['p-luminaria', 'p-planta', 'p-panelas', 'p-fone', 'p-tenis', 'p-relogio'].includes(
        product.id,
      ),
    );
    expect(relatedCategories(picked).map((category) => category.slug)).toEqual([
      'casa',
      'moda',
      'eletronicos',
    ]);
  });

  it('ordena pelo menor preço', () => {
    const result = filterCatalog(PRODUCTS, { sort: 'menor-preco' });
    const first = result[0];
    const last = result.at(-1);
    expect(first && last && first.price <= last.price).toBe(true);
  });

  it('pagina o catálogo e limita a página ao intervalo válido', () => {
    const page = paginate(PRODUCTS, 2, 5);
    expect(page.items).toHaveLength(5);
    expect(page.from).toBe(6);
    expect(page.to).toBe(10);
    expect(page.pages).toBe(Math.ceil(PRODUCTS.length / 5));

    expect(paginate(PRODUCTS, 99, 5).page).toBe(Math.ceil(PRODUCTS.length / 5));
    expect(paginate([], 1, 6)).toMatchObject({ items: [], page: 1, pages: 1, from: 0, to: 0 });
  });
});

describe('mapeamento da API', () => {
  const sample: StoreProductListItem = {
    id: 'listing-1',
    slug: 'produto-01',
    featured: true,
    name: 'Produto Marketplace 01',
    photoUrl: null,
    stockBalance: '11.0000',
    group: { id: 'g1', name: 'Eletronicos' },
    subgroup: { id: 's1', name: 'Smartphones' },
    brand: { id: 'b1', name: 'TechNova' },
    price: '23.40',
    promotionalPrice: '19.89',
    promotion: {
      id: 'promo-1',
      price: '19.89',
      description: 'Promo seed 1',
    },
  };

  it('converte preço decimal em centavos e estoque truncado', () => {
    expect(decimalToCents('23.40')).toBe(2340);
    expect(decimalToCents('19.89')).toBe(1989);
    expect(parseStock('11.0000')).toBe(11);
  });

  it('usa placeholder quando photoUrl é nulo', () => {
    expect(resolveProductImages(null)).toEqual([PRODUCT_IMAGE_FALLBACK]);
    const mapped = mapStoreProductListItem(sample);
    expect(mapped.images).toEqual([PRODUCT_IMAGE_FALLBACK]);
    expect(mapped.price).toBe(1989);
    expect(mapped.compareAtPrice).toBe(2340);
    expect(mapped.categorySlug).toBe('eletronicos');
    expect(mapped.featured).toBe(true);
    expect(mapped.stock).toBe(11);
  });
});

describe('carrinho', () => {
  it('cobra frete padrão abaixo de R$ 199 quando algum item não tem frete grátis', () => {
    const totals = cartTotals([{ price: 2_890, quantity: 2, freeShipping: false }]);
    expect(totals).toEqual({ subtotal: 5_780, shipping: 1_990, total: 7_770 });
  });

  it('zera o frete quando o subtotal passa de R$ 199', () => {
    const totals = cartTotals([
      { price: 2_890, quantity: 1, freeShipping: false },
      { price: 18_990, quantity: 1, freeShipping: true },
    ]);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(21_880);
  });

  it('resolve linhas e descarta produto ausente', () => {
    const lines = resolveCart(
      [
        { productId: 'p-fone', quantity: 1 },
        { productId: 'sumiu', quantity: 1 },
      ],
      PRODUCTS,
    );
    expect(lines[0]?.product?.slug).toBe('fone-sem-fio-norte');
    expect(lines[1]?.product).toBeNull();
  });
});

describe('preço', () => {
  it('calcula desconto e interpreta reais com vírgula', () => {
    expect(discountPercent(34_990, 42_990)).toBe(19);
    expect(parseReais('1.299,90')).toBe(129_990);
    expect(parseReais('0')).toBeNull();
    expect(formatPriceParam(5_000)).toBe('50');
    expect(formatPriceParam(129_990)).toBe('1299,90');
  });
});
