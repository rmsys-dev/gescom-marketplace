'use client';

import { useEffect, useSyncExternalStore } from 'react';

import { catalogOf, getProductById } from '@/features/marketplace/catalog';
import { DEMO_ADDRESS, DEMO_ORDERS } from '@/features/marketplace/data';
import { nameFromEmail } from '@/features/marketplace/masks';
import type {
  Address,
  CartLine,
  Order,
  OrderStatus,
  PaymentMethod,
  SessionUser,
} from '@/features/marketplace/types';

const STORAGE_KEY = 'gescom-marketplace';

type PersistedMarketplace = {
  user: SessionUser | null;
  lastUser: SessionUser | null;
  cart: CartLine[];
  favorites: string[];
  addresses: Address[];
  orders: Order[];
  recentQueries: string[];
};

export type MarketplaceState = PersistedMarketplace & {
  hydrated: boolean;
};

const EMPTY: PersistedMarketplace = {
  user: null,
  lastUser: null,
  cart: [],
  favorites: [],
  addresses: [],
  orders: [],
  recentQueries: [],
};

const SERVER_STATE: MarketplaceState = { ...EMPTY, hydrated: false };

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
    recentQueries: state.recentQueries,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
}

function commit(patch: Partial<PersistedMarketplace>) {
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
      recentQueries: Array.isArray(parsed.recentQueries) ? parsed.recentQueries : [],
    };
  } catch {
    return null;
  }
}

export function hydrateMarketplace() {
  if (clientState.hydrated || typeof window === 'undefined') return;
  clientState = { ...(readStorage() ?? EMPTY), hydrated: true };
  emit();
}

function withDemo(user: SessionUser, state: MarketplaceState): Partial<PersistedMarketplace> {
  const patch: Partial<PersistedMarketplace> = { user, lastUser: user };
  if (state.addresses.length === 0) {
    patch.addresses = [
      { ...DEMO_ADDRESS, recipient: user.name, phone: user.phone || DEMO_ADDRESS.phone },
    ];
  }
  if (state.orders.length === 0) {
    patch.orders = DEMO_ORDERS.map((order) => ({
      ...order,
      contactName: user.name,
      contactEmail: user.email,
    }));
  }
  return patch;
}

export function login(email: string) {
  const known =
    clientState.lastUser?.email.toLowerCase() === email.toLowerCase() ? clientState.lastUser : null;
  const user: SessionUser = known ?? {
    name: nameFromEmail(email),
    email,
    phone: '',
  };
  commit(withDemo(user, clientState));
}

export function register(user: SessionUser) {
  commit(withDemo(user, clientState));
}

export function logout() {
  commit({ user: null });
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

export function saveAddress(address: Address) {
  const exists = clientState.addresses.some((item) => item.id === address.id);
  commit({
    addresses: exists
      ? clientState.addresses.map((item) => (item.id === address.id ? address : item))
      : [...clientState.addresses, address],
  });
}

export function removeAddress(id: string) {
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
  };
}
