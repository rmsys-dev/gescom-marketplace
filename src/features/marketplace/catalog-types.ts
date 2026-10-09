/** Tipos espelhados da API pública da loja (`/api/v1/store/{enterpriseId}`). */

export type StoreNamedRef = {
  id: string;
  name: string;
};

export type StorePromotion = {
  id: string;
  price: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type StoreProductListItem = {
  id: string;
  slug: string;
  featured: boolean;
  name: string;
  photoUrl: string | null;
  stockBalance: string;
  group: StoreNamedRef | null;
  subgroup: StoreNamedRef | null;
  brand: StoreNamedRef | null;
  price: string;
  promotionalPrice: string | null;
  promotion: StorePromotion | null;
};

export type StoreCharacteristic = {
  id?: string;
  label?: string;
  name?: string;
  value: string;
};

export type StoreVariantOption = {
  id?: string;
  name: string;
  values?: string[];
};

export type StoreVariant = {
  id: string;
  label?: string;
  name?: string;
  sku?: string | null;
  stockBalance?: string | null;
  photoUrl?: string | null;
  optionValues?: Record<string, string>;
};

export type StoreRating = {
  average?: number | null;
  count?: number | null;
};

export type StoreReview = {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  createdAt?: string | null;
  authorName?: string | null;
  customerName?: string | null;
};

export type StoreQuestion = {
  id: string;
  question: string;
  answer?: string | null;
  createdAt?: string | null;
};

export type StoreProductDetail = StoreProductListItem & {
  description?: string | null;
  characteristics?: StoreCharacteristic[];
  variantOptions?: StoreVariantOption[];
  variants?: StoreVariant[];
  rating?: StoreRating | number | null;
  reviewCount?: number | null;
  reviews?: StoreReview[];
  questions?: StoreQuestion[];
  images?: Array<string | null>;
  photoUrls?: Array<string | null>;
};
