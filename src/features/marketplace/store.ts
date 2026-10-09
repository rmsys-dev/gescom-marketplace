'use client';

import { useEffect, useSyncExternalStore } from 'react';

import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
} from '@/features/marketplace/address-api';
import { authFetch, toSessionUser, type AuthSessionResponse } from '@/features/marketplace/auth-api';
import { fetchCatalogBootstrap } from '@/features/marketplace/catalog-api';
import {
  catalogOf,
  categoriesOf,
  getProductById,
  isCatalogReady,
  setCatalogData,
  subcategoriesOf,
  upsertCatalogProduct,
} from '@/features/marketplace/catalog';
import { DEMO_ORDERS } from '@/features/marketplace/data';
import type {
  Address,
  AddressType,
  CartLine,
  Category,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  SessionUser,
  UserReview,
} from '@/features/marketplace/types';

const STORAGE_KEY = 'gescom-marketplace';

type PersistedMarketplace = {
  user: SessionUser | null;
  lastUser: SessionUser | null;
  cart: CartLine[];
  favorites: string[];
  addresses: Address[];
  orders: Order[];
  reviews: UserReview[];
  recentQueries: string[];
};

export type MarketplaceState = PersistedMarketplace & {
  hydrated: boolean;
  catalogReady: boolean;
  catalogError: string | null;
};

const EMPTY: PersistedMarketplace = {
  user: null,
  lastUser: null,
  cart: [],
  favorites: [],
  addresses: [],
  orders: [],
  reviews: [],
  recentQueries: [],
};

const SERVER_STATE: MarketplaceState = {
  ...EMPTY,
  hydrated: false,
  catalogReady: false,
  catalogError: null,
};

let clientState: MarketplaceState = SERVER_STATE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(state: MarketplaceState) {
  const rest: PersistedMarketplace = {
    user: state.user,
    lastUser: state.lastUser,
    cart: state.cart,
    favorites: state.favorites,
    addresses: state.addresses,
    orders: state.orders,
    reviews: state.reviews,
    recentQueries: state.recentQueries,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
}

function commit(patch: Partial<PersistedMarketplace & Pick<MarketplaceState, 'catalogReady' | 'catalogError'>>) {
  clientState = { ...clientState, ...patch, hydrated: true };
  persist(clientState);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStorage(): PersistedMarketplace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedMarketplace>;
    return {
      user: parsed.user ?? null,
      lastUser: parsed.lastUser ?? null,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      addresses: Array.isArray(parsed.addresses) ? parsed.addresses : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    recentQueries: Array.isArray(parsed.recentQueries) ? parsed.recentQueries : [],
  };
  } catch {
    return null;
  }
}

let sessionSyncPromise: Promise<void> | null = null;
let catalogSyncPromise: Promise<void> | null = null;

export async function syncSessionFromServer() {
  try {
    const data = await authFetch<AuthSessionResponse>('/api/conta/me');
    const phone =
      clientState.user?.email.toLowerCase() === (data.user.email ?? '').toLowerCase()
        ? clientState.user.phone
        : (clientState.lastUser?.email.toLowerCase() === (data.user.email ?? '').toLowerCase()
            ? (clientState.lastUser?.phone ?? '')
            : '');
    const user = toSessionUser(data.user, phone);
    commit({ ...withDemo(user, clientState), addresses: [] });
    try {
      await loadAddresses();
    } catch {
      // Mantém a sessão mesmo se a lista de endereços falhar.
    }
  } catch {
    if (clientState.user) {
      commit({ user: null, addresses: [] });
    } else {
      emit();
    }
  }
}

export async function syncCatalogFromServer() {
  try {
    const data = await fetchCatalogBootstrap();
    setCatalogData(data.products, data.categories, data.subcategories ?? []);
    commit({ catalogReady: true, catalogError: null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Não foi possível carregar o catálogo.';
    setCatalogData([], [], []);
    commit({ catalogReady: true, catalogError: message });
  }
}

export function hydrateMarketplace() {
  if (clientState.hydrated || typeof window === 'undefined') return;
  const stored = readStorage() ?? EMPTY;
  clientState = {
    ...stored,
    hydrated: true,
    catalogReady: isCatalogReady(),
    catalogError: null,
  };
  emit();

  if (!sessionSyncPromise) {
    sessionSyncPromise = syncSessionFromServer().finally(() => {
      sessionSyncPromise = null;
    });
  }

  if (!catalogSyncPromise) {
    catalogSyncPromise = syncCatalogFromServer().finally(() => {
      catalogSyncPromise = null;
    });
  }
}

export function mergeCatalogProduct(
  product: Product,
  categories?: Category[],
  subcategories?: Category[],
) {
  upsertCatalogProduct(product);
  let nextCategories = categoriesOf();
  let nextSubcategories = subcategoriesOf();
  if (categories?.length) {
    const bySlug = new Map(nextCategories.map((item) => [item.slug, item]));
    for (const category of categories) bySlug.set(category.slug, category);
    nextCategories = [...bySlug.values()];
  }
  if (subcategories?.length) {
    const bySlug = new Map(nextSubcategories.map((item) => [item.slug, item]));
    for (const subcategory of subcategories) bySlug.set(subcategory.slug, subcategory);
    nextSubcategories = [...bySlug.values()];
  }
  if (categories?.length || subcategories?.length) {
    setCatalogData(catalogOf(), nextCategories, nextSubcategories);
  }
  emit();
}

function withDemo(user: SessionUser, state: MarketplaceState): Partial<PersistedMarketplace> {
  const patch: Partial<PersistedMarketplace> = { user, lastUser: user };
  if (state.orders.length === 0) {
    patch.orders = DEMO_ORDERS.map((order) => ({
      ...order,
      contactName: user.name,
      contactEmail: user.email,
    }));
  } else {
    const known = new Set(state.orders.map((order) => order.id));
    const missing = DEMO_ORDERS.filter((order) => !known.has(order.id));
    if (missing.length > 0 && state.orders.every((order) => order.demo)) {
      patch.orders = [
        ...missing.map((order) => ({
          ...order,
          contactName: user.name,
          contactEmail: user.email,
        })),
        ...state.orders,
      ];
    }
  }
  return patch;
}

export function setSessionUser(user: SessionUser) {
  const knownPhone =
    clientState.lastUser?.email.toLowerCase() === user.email.toLowerCase()
      ? clientState.lastUser.phone
      : '';
  commit({
    ...withDemo(
      {
        ...user,
        phone: user.phone || knownPhone,
      },
      clientState,
    ),
    addresses: [],
  });
  void loadAddresses().catch(() => {
    // Login já concluiu; a tela de endereços pode tentar de novo.
  });
}

export async function logout() {
  try {
    await authFetch('/api/conta/logout', { method: 'POST' });
  } catch {
    // Limpa o estado local mesmo se a API falhar.
  }
  commit({ user: null, addresses: [] });
}

export function updateProfile(patch: Partial<SessionUser>) {
  if (!clientState.user) return;
  const user = { ...clientState.user, ...patch };
  commit({ user, lastUser: user });
}

export function addToCart(productId: string, quantity = 1) {
  const product = getProductById(productId);
  if (!product || product.stock <= 0) return { ok: false as const, reason: 'unavailable' as const };
  const current = clientState.cart.find((line) => line.productId === productId)?.quantity ?? 0;
  const next = current + quantity;
  if (next > product.stock) return { ok: false as const, reason: 'stock' as const };
  const cart = current
    ? clientState.cart.map((line) =>
        line.productId === productId ? { ...line, quantity: next } : line,
      )
    : [...clientState.cart, { productId, quantity }];
  commit({ cart });
  return { ok: true as const };
}

export function setQuantity(productId: string, quantity: number) {
  const product = getProductById(productId);
  if (!product) return;
  const next = Math.min(Math.max(1, quantity), Math.max(product.stock, 1));
  commit({
    cart: clientState.cart.map((line) =>
      line.productId === productId ? { ...line, quantity: next } : line,
    ),
  });
}

export function removeFromCart(productId: string) {
  const removed = clientState.cart.find((line) => line.productId === productId) ?? null;
  commit({ cart: clientState.cart.filter((line) => line.productId !== productId) });
  return removed;
}

export function restoreCartLine(line: CartLine) {
  const exists = clientState.cart.some((item) => item.productId === line.productId);
  commit({
    cart: exists
      ? clientState.cart.map((item) =>
          item.productId === line.productId
            ? { ...item, quantity: item.quantity + line.quantity }
            : item,
        )
      : [...clientState.cart, line],
  });
}

export function toggleFavorite(productId: string) {
  const favorites = clientState.favorites.includes(productId)
    ? clientState.favorites.filter((id) => id !== productId)
    : [...clientState.favorites, productId];
  commit({ favorites });
}

export function rememberQuery(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  const recentQueries = [
    trimmed,
    ...clientState.recentQueries.filter((item) => item !== trimmed),
  ].slice(0, 6);
  commit({ recentQueries });
}

export function setAddresses(addresses: Address[]) {
  commit({ addresses });
}

export async function loadAddresses() {
  const data = await fetchAddresses();
  const profileName = data.user?.name ?? clientState.user?.name ?? '';
  const profilePhone = data.user?.phone ?? clientState.user?.phone ?? '';
  const addresses = data.addresses.map((item) => ({
    ...item,
    recipient: item.recipient || profileName,
    phone: item.phone || profilePhone,
  }));

  const user = clientState.user
    ? {
        ...clientState.user,
        name: profileName || clientState.user.name,
        phone: profilePhone || clientState.user.phone,
      }
    : clientState.user;

  commit({
    addresses,
    ...(user ? { user, lastUser: user } : {}),
  });
  return addresses;
}

export async function createUserAddress(input: {
  cepNumber: string;
  number: string;
  complement?: string;
  adressType: AddressType;
}) {
  const data = await createAddress(input);
  const profileName = clientState.user?.name ?? '';
  const profilePhone = clientState.user?.phone ?? '';
  const addresses = data.addresses.map((item) => ({
    ...item,
    recipient: item.recipient || profileName,
    phone: item.phone || profilePhone,
  }));
  commit({ addresses });
  return data.address;
}

export async function updateUserAddress(
  id: string,
  input: {
    cepNumber?: string;
    number?: string;
    complement?: string | null;
    adressType?: AddressType;
  },
) {
  const data = await updateAddress(id, input);
  const profileName = clientState.user?.name ?? '';
  const profilePhone = clientState.user?.phone ?? '';
  const addresses = (data.addresses ?? []).map((item) => ({
    ...item,
    recipient: item.recipient || profileName,
    phone: item.phone || profilePhone,
  }));
  commit({ addresses });
  return data.address;
}

/** Compatível com checkout offline/guest; usuários logados devem preferir createUserAddress. */
export function saveAddress(address: Address) {
  const exists = clientState.addresses.some((item) => item.id === address.id);
  commit({
    addresses: exists
      ? clientState.addresses.map((item) => (item.id === address.id ? address : item))
      : [...clientState.addresses, address],
  });
}

export async function removeAddress(id: string) {
  await deleteAddress(id);
  commit({ addresses: clientState.addresses.filter((address) => address.id !== id) });
}

let checkoutProductIds: string[] | null = null;

export function setCheckoutProductIds(ids: string[] | null) {
  checkoutProductIds = ids;
}

export function getCheckoutProductIds() {
  return checkoutProductIds;
}

export function placeOrder(input: {
  contact: SessionUser;
  address: Address;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shipping: number;
  total: number;
  items: Order['items'];
}) {
  const order: Order = {
    id: `ord-${Date.now().toString(36)}`,
    code: `GM-${Math.floor(10_000 + Math.random() * 89_999)}`,
    createdAt: new Date().toISOString(),
    status: 'confirmado',
    items: input.items,
    contactName: input.contact.name,
    contactEmail: input.contact.email,
    address: input.address,
    paymentMethod: input.paymentMethod,
    subtotal: input.subtotal,
    shipping: input.shipping,
    total: input.total,
  };

  const purchasedIds = new Set(input.items.map((item) => item.productId));
  checkoutProductIds = null;

  const patch: Partial<PersistedMarketplace> = {
    orders: [order, ...clientState.orders],
    cart: clientState.cart.filter((line) => !purchasedIds.has(line.productId)),
  };

  if (clientState.user) {
    const user = {
      ...clientState.user,
      name: input.contact.name,
      phone: input.contact.phone || clientState.user.phone,
    };
    patch.user = user;
    patch.lastUser = user;
  }

  commit(patch);
  return order;
}

export function getOrder(id: string) {
  return clientState.orders.find((order) => order.id === id) ?? null;
}

export function saveUserReview(input: {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  anonymous: boolean;
  photoCount?: number;
}) {
  const existing = clientState.reviews.find(
    (review) => review.productId === input.productId && review.orderId === input.orderId,
  );
  if (existing) return existing;

  const review: UserReview = {
    id: `ur-${Date.now().toString(36)}`,
    productId: input.productId,
    orderId: input.orderId,
    rating: input.rating,
    comment: input.comment.trim(),
    anonymous: input.anonymous,
    photoCount: input.photoCount ?? 0,
    createdAt: new Date().toISOString(),
  };
  commit({ reviews: [review, ...clientState.reviews] });
  return review;
}

export function hasUserReviewed(orderId: string, productId: string) {
  return clientState.reviews.some(
    (review) => review.orderId === orderId && review.productId === productId,
  );
}

export type PendingReviewItem = {
  orderId: string;
  orderCode: string;
  purchasedAt: string;
  productId: string;
  name: string;
  image: string;
};

export function pendingReviewItems(
  orders: Order[] = clientState.orders,
  reviews: UserReview[] = clientState.reviews,
): PendingReviewItem[] {
  const reviewed = new Set(reviews.map((review) => `${review.orderId}:${review.productId}`));
  const pending: PendingReviewItem[] = [];
  for (const order of orders) {
    if (order.status !== 'entregue') continue;
    for (const item of order.items) {
      const key = `${order.id}:${item.productId}`;
      if (reviewed.has(key)) continue;
      pending.push({
        orderId: order.id,
        orderCode: order.code,
        purchasedAt: order.createdAt,
        productId: item.productId,
        name: item.name,
        image: item.image,
      });
    }
  }
  return pending;
}

export const ORDER_FLOW: OrderStatus[] = ['confirmado', 'preparando', 'enviado', 'entregue'];

export function useMarketplace() {
  const state = useSyncExternalStore(
    subscribe,
    () => clientState,
    () => SERVER_STATE,
  );

  useEffect(() => {
    hydrateMarketplace();
  }, []);

  return {
    ...state,
    products: catalogOf(),
    categories: categoriesOf(),
    subcategories: subcategoriesOf(),
    catalogReady: state.catalogReady || isCatalogReady(),
  };
}
