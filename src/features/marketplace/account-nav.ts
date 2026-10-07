import { Heart, MapPin, Package, UserRound, type LucideIcon } from 'lucide-react';

export type AccountNavItem = {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
};

export const ACCOUNT_NAV: AccountNavItem[] = [
  {
    href: '/conta/pedidos',
    label: 'Pedidos',
    hint: 'Acompanhe o que você comprou.',
    icon: Package,
  },
  {
    href: '/conta/favoritos',
    label: 'Favoritos',
    hint: 'Produtos salvos neste aparelho.',
    icon: Heart,
  },
  {
    href: '/conta/enderecos',
    label: 'Endereços',
    hint: 'Endereços salvos na sua conta.',
    icon: MapPin,
  },
  {
    href: '/conta/perfil',
    label: 'Dados pessoais',
    hint: 'Dados pessoais e da conta.',
    icon: UserRound,
  },
];

export function isAccountNavActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
