'use client';

import {
  Dumbbell,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CATEGORIES } from '@/features/marketplace/data';
import { cn } from '@/shared/lib/utils';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  eletronicos: Smartphone,
  casa: Sofa,
  moda: Shirt,
  beleza: Sparkles,
  esportes: Dumbbell,
  mercado: ShoppingBasket,
};

export function CategoryBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Categorias" className="border-b border-border bg-background">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="mx-auto flex w-max min-w-full items-start justify-start gap-2 px-3 py-3 md:justify-center md:px-4">
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
            const active = pathname === `/categoria/${category.slug}`;
            return (
              <li key={category.slug}>
                <Link
                  href={`/categoria/${category.slug}`}
                  aria-current={active ? 'page' : undefined}
                  className="flex w-19 flex-col items-center gap-1.5 text-center"
                >
                  <span
                    className={cn(
                      'flex size-14 items-center justify-center rounded-full ring-1 transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground ring-primary'
                        : 'bg-secondary text-primary ring-border hover:bg-primary/10',
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      'text-[11px] leading-tight font-medium',
                      active ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {category.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
