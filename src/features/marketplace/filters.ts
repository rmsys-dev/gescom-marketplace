import { formatPriceParam, parseReais } from '@/features/marketplace/money';
import type {
  CatalogQuery,
  CatalogSort,
  PriceBand,
  ProductCondition,
} from '@/features/marketplace/types';

export const CATALOG_SORTS: { id: CatalogSort; label: string }[] = [
  { id: 'relevancia', label: 'Relevância' },
  { id: 'menor-preco', label: 'Menor preço' },
  { id: 'maior-preco', label: 'Maior preço' },
  { id: 'avaliacao', label: 'Avaliação' },
];

export const PRICE_BANDS: { id: Exclude<PriceBand, ''>; label: string }[] = [
  { id: 'ate-50', label: 'Até R$ 50' },
  { id: '50-150', label: 'R$ 50 a R$ 150' },
  { id: '150-400', label: 'R$ 150 a R$ 400' },
  { id: '400-mais', label: 'Acima de R$ 400' },
];

export const CONDITIONS: { id: ProductCondition; label: string }[] = [
  { id: 'novo', label: 'Novo' },
  { id: 'usado', label: 'Usado' },
];

export type FilterDraft = {
  sort: CatalogSort;
  price: PriceBand;
  priceMin: number | null;
  priceMax: number | null;
  condition: ProductCondition | '';
  freeShipping: boolean;
  onSale: boolean;
};

export const EMPTY_FILTERS: FilterDraft = {
  sort: 'relevancia',
  price: '',
  priceMin: null,
  priceMax: null,
  condition: '',
  freeShipping: false,
  onSale: false,
};

function readCents(value: string | null) {
  if (!value) return null;
  return parseReais(value);
}

export function readFilters(params: { get(name: string): string | null }): FilterDraft {
  const sort = params.get('ordem');
  const price = params.get('preco');
  const priceMin = readCents(params.get('min'));
  const priceMax = readCents(params.get('max'));
  const range = priceMin != null || priceMax != null;
  const band =
    price === 'ate-50' || price === '50-150' || price === '150-400' || price === '400-mais'
      ? price
      : '';

  return {
    sort:
      sort === 'menor-preco' || sort === 'maior-preco' || sort === 'avaliacao'
        ? sort
        : 'relevancia',
    price: range ? '' : band,
    priceMin,
    priceMax,
    condition:
      params.get('condicao') === 'usado'
        ? 'usado'
        : params.get('condicao') === 'novo'
          ? 'novo'
          : '',
    freeShipping: params.get('frete') === 'gratis',
    onSale: params.get('oferta') === '1',
  };
}

export function countActiveFilters(filters: FilterDraft) {
  return (
    Number(filters.sort !== 'relevancia') +
    Number(Boolean(filters.price) || filters.priceMin != null || filters.priceMax != null) +
    Number(Boolean(filters.condition)) +
    Number(filters.freeShipping) +
    Number(filters.onSale)
  );
}

export function filtersToCatalogQuery(
  filters: FilterDraft,
): Pick<
  CatalogQuery,
  'sort' | 'price' | 'priceMin' | 'priceMax' | 'condition' | 'freeShipping' | 'onSale'
> {
  const range = filters.priceMin != null || filters.priceMax != null;
  return {
    sort: filters.sort,
    price: range ? '' : filters.price,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    condition: filters.condition,
    freeShipping: filters.freeShipping,
    onSale: filters.onSale,
  };
}

export function filterPatch(filters: FilterDraft): Record<string, string | null> {
  const range = filters.priceMin != null || filters.priceMax != null;
  return {
    ordem: filters.sort === 'relevancia' ? null : filters.sort,
    preco: range || !filters.price ? null : filters.price,
    min: filters.priceMin != null ? formatPriceParam(filters.priceMin) : null,
    max: filters.priceMax != null ? formatPriceParam(filters.priceMax) : null,
    condicao: filters.condition || null,
    frete: filters.freeShipping ? 'gratis' : null,
    oferta: filters.onSale ? '1' : null,
  };
}
