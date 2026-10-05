'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { countInCategory } from '@/features/marketplace/catalog';
import { SectionHeader } from '@/features/marketplace/components/bits';
import { CATEGORY_ICONS } from '@/features/marketplace/components/category-bar';
import { ProductGrid } from '@/features/marketplace/components/product-card';
import { CATEGORIES } from '@/features/marketplace/data';
import { useMarketplace } from '@/features/marketplace/store';

export function HomeView() {
  const { products } = useMarketplace();
  const offers = products
    .filter((product) => product.compareAtPrice && product.stock > 0)
    .slice(0, 4);
  const rated = [...products]
    .filter((product) => product.stock > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeader title="Ofertas" href="/busca?ordem=menor-preco" />
        <ProductGrid products={offers} />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Bem avaliados" href="/busca?ordem=avaliacao" />
        <ProductGrid products={rated} />
      </section>
    </div>
  );
}

export function CategoriesView() {
  const { products } = useMarketplace();

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-sm text-muted-foreground">Escolha um grupo para ver os anúncios.</p>
      </header>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
          return (
            <li key={category.slug}>
              <Link
                href={`/categoria/${category.slug}`}
                className="flex min-h-32 flex-col justify-between rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <Icon className="size-6 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {countInCategory(category.slug, products)} produtos
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
