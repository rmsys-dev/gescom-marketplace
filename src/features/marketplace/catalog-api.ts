'use client';

import type { Category, Product, Review } from '@/features/marketplace/types';

export class CatalogApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CatalogApiError';
  }
}

export type CatalogBootstrapResponse = {
  products: Product[];
  categories: Category[];
  subcategories: Category[];
  message?: string;
};

export type CatalogProductResponse = {
  product: Product;
  reviews?: Review[];
  message?: string;
};

async function parseJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function catalogFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const body = await parseJson(response);
  if (!response.ok) {
    throw new CatalogApiError(
      response.status,
      typeof body.code === 'string' ? body.code : 'REQUEST_FAILED',
      typeof body.message === 'string'
        ? body.message
        : 'Não foi possível carregar o catálogo.',
    );
  }

  return body as T;
}

export async function fetchCatalogBootstrap() {
  return catalogFetch<CatalogBootstrapResponse>('/api/catalog');
}

export async function fetchCatalogProduct(idOrSlug: string) {
  return catalogFetch<CatalogProductResponse>(
    `/api/catalog/products/${encodeURIComponent(idOrSlug)}`,
  );
}
