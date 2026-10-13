'use client';

import { authFetch, AuthApiError } from '@/features/marketplace/auth-api';
import type { Address, AddressType } from '@/features/marketplace/types';

export { AuthApiError };

/** JSON do ViaCEP, no formato aceito por POST/PATCH `/api/v1/addresses`. */
export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
};

export type AddressesResponse = {
  addresses: Address[];
  user?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  message?: string;
};

export type SaveAddressResponse = {
  address: Address | null;
  addresses: Address[];
  message?: string;
};

export type AddressPayload = {
  viaCep: ViaCepAddress;
  number: string;
  adressType: AddressType;
};

function toAddressBody(input: AddressPayload) {
  return {
    ...input.viaCep,
    logradouro: input.viaCep.logradouro.trim(),
    bairro: input.viaCep.bairro.trim(),
    complemento: input.viaCep.complemento.trim(),
    number: input.number.trim(),
    adressType: input.adressType,
  };
}

export async function lookupCep(cep: string) {
  const digits = cep.replace(/\D/g, '');
  return authFetch<ViaCepAddress>(`/api/conta/cep?cep=${encodeURIComponent(digits)}`);
}

export async function fetchAddresses() {
  return authFetch<AddressesResponse>('/api/conta/enderecos');
}

export async function createAddress(input: AddressPayload) {
  return authFetch<SaveAddressResponse>('/api/conta/enderecos', {
    method: 'POST',
    body: JSON.stringify(toAddressBody(input)),
  });
}

export async function updateAddress(id: string, input: AddressPayload) {
  return authFetch<SaveAddressResponse>(`/api/conta/enderecos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toAddressBody(input)),
  });
}

export async function deleteAddress(id: string) {
  return authFetch<{ ok: boolean; id: string; deletedAt?: string; message?: string }>(
    `/api/conta/enderecos/${id}`,
    { method: 'DELETE' },
  );
}
