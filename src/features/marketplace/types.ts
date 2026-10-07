export type ProductCondition = 'novo' | 'usado';

export type Category = {
  slug: string;
  name: string;
  description: string;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  label: string;
  swatch?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  categorySlug: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  condition: ProductCondition;
  freeShipping: boolean;
  specs: ProductSpec[];
  variantLabel?: string;
  variants?: ProductVariant[];
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type SessionUser = {
  name: string;
  email: string;
  phone: string;
};

export type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export type PaymentMethod = 'pix' | 'credito' | 'boleto';

export type OrderStatus = 'confirmado' | 'preparando' | 'enviado' | 'entregue';

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  contactName: string;
  contactEmail: string;
  address: Address;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shipping: number;
  total: number;
  demo?: boolean;
};

export type PriceBand = '' | 'ate-50' | '50-150' | '150-400' | '400-mais';

export type CatalogSort = 'relevancia' | 'menor-preco' | 'maior-preco' | 'avaliacao';

export type CatalogQuery = {
  q?: string;
  category?: string;
  freeShipping?: boolean;
  condition?: ProductCondition | '';
  price?: PriceBand;
  priceMin?: number | null;
  priceMax?: number | null;
  onSale?: boolean;
  sort?: CatalogSort;
  favoriteIds?: string[];
  favoritesOnly?: boolean;
};
