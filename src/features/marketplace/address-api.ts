'use client';

import { authFetch, AuthApiError } from '@/features/marketplace/auth-api';
import type { Address, AddressType } from '@/features/marketplace/types';

export { AuthApiError };

export type CepLookupResponse = {
  cepId: string;
  cepNumber: string;
  address: string;
  neighborhood: string;
  cityName: string;
  uf: string;
  cityId: string | null;
  message?: string;
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

export async function lookupCep(cep: string) {
  const digits = cep.replace(/\D/g, '');
  return authFetch<CepLookupResponse>(`/api/conta/cep?cep=${encodeURIComponent(digits)}`);
}

export async function fetchAddresses() {
  return authFetch<AddressesResponse>('/api/conta/enderecos');
}

export async function createAddress(input: {
  cepNumber: string;
  number: string;
  complement?: string;
  adressType: AddressType;
}) {
  return authFetch<SaveAddressResponse>('/api/conta/enderecos', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      cepNumber: input.cepNumber.replace(/\D/g, ''),
    }),
  });
}

export async function updateAddress(
  id: string,
  input: {
    cepNumber?: string;
    number?: string;
    complement?: string | null;
    adressType?: AddressType;
    softDelete?: boolean;
  },
) {
  return authFetch<SaveAddressResponse & { ok?: boolean; id?: string }>(
    `/api/conta/enderecos/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        ...input,
        ...(input.cepNumber
          ? { cepNumber: input.cepNumber.replace(/\D/g, '') }
          : {}),
      }),
    },
  );
}

export async function deleteAddress(id: string) {
  return updateAddress(id, { softDelete: true });
}
