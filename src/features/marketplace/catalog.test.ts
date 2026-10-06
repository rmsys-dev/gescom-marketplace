import { describe, expect, it } from 'vitest';

import {
  filterCatalog,
  formatSearchTerm,
  paginate,
  relatedCategories,
  resolveCart,
} from '@/features/marketplace/catalog';
import { PRODUCTS } from '@/features/marketplace/data';
import { cartTotals, discountPercent, parseReais } from '@/features/marketplace/money';

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
  });
});
