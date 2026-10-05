export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Conheça-nos',
    links: [
      { label: 'Sobre nós', href: '/institucional/sobre' },
      { label: 'Informações corporativas', href: '/institucional/corporativo' },
      { label: 'Acessibilidade', href: '/institucional/acessibilidade' },
    ],
  },
  {
    title: 'Pagamento',
    links: [
      { label: 'Segurança', href: '/institucional/seguranca' },
      { label: 'Meios de pagamento', href: '/institucional/pagamentos#pix' },
    ],
  },
  {
    title: 'Deixe-nos ajudar você',
    links: [
      { label: 'Sua conta', href: '/conta' },
      { label: 'Frete e prazo de entrega', href: '/institucional/frete' },
      { label: 'Devoluções e reembolsos', href: '/institucional/devolucoes' },
      { label: 'Seus pedidos', href: '/conta/pedidos' },
      { label: 'Ajuda', href: '/institucional/ajuda' },
    ],
  },
];

export const LEGAL_LINKS: FooterLink[] = [
  { label: 'Condições de Uso', href: '/institucional/condicoes' },
  { label: 'Notificação de Privacidade', href: '/institucional/privacidade' },
  { label: 'Cookies', href: '/institucional/cookies' },
  { label: 'Acessibilidade', href: '/institucional/acessibilidade' },
];

export const CONTACT_HREF = '/institucional/ajuda';
