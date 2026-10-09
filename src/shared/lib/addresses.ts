import 'server-only';

import { cepLookupPath, gescomAuthed, userPath } from '@/shared/lib/gescom';

export type AddressType =
  | 'PRINCIPAL'
  | 'ENTREGA'
  | 'COBRANCA'
  | 'RESIDENCIAL'
  | 'COMERCIAL'
  | 'FATURAMENTO'
  | 'SECUNDARIO'
  | 'OUTRO';

export type ApiCepLookup = {
  cepNumber: string;
  address: string;
  complement?: string;
  neighborhood: string;
  cityName: string;
  uf: string;
  ibgeCode?: number;
  cityId: string | null;
  cepId: string;
  existingCep: {
    id: string;
    cepNumber: string;
    address: string;
    neighborhood: string;
    cityId: string;
  } | null;
};

export type ApiUserAddress = {
  id: string;
  number: string;
  complement: string | null;
  stateRegistration?: string | null;
  adressType: AddressType;
  cep: {
    id: string;
    cepNumber: string;
    address: string;
    neighborhood: string;
    city: {
      id: string;
      ibgeCode?: number;
      citieName: string;
      stateId?: string;
    } | null;
  } | null;
};

export type ApiUserDetails = {
  user: {
    id: string;
    userName: string;
    userPhone: string | null;
    userEmail: string | null;
  };
  addresses: ApiUserAddress[];
};

export type StoreAddressDto = {
  id: string;
  cepId: string;
  adressType: AddressType;
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

const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  PRINCIPAL: 'Principal',
  ENTREGA: 'Entrega',
  COBRANCA: 'Cobrança',
  RESIDENCIAL: 'Residencial',
  COMERCIAL: 'Comercial',
  FATURAMENTO: 'Faturamento',
  SECUNDARIO: 'Secundário',
  OUTRO: 'Outro',
};

export function addressTypeLabel(type: AddressType) {
  return ADDRESS_TYPE_LABELS[type] ?? type;
}

function maskZip(digits: string) {
  const clean = digits.replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

export function mapApiAddress(
  item: ApiUserAddress,
  profile: { name?: string; phone?: string | null } = {},
  stateHint = '',
): StoreAddressDto {
  const zip = item.cep?.cepNumber ?? '';
  return {
    id: item.id,
    cepId: item.cep?.id ?? '',
    adressType: item.adressType,
    label: addressTypeLabel(item.adressType),
    recipient: profile.name ?? '',
    phone: profile.phone ?? '',
    zip: maskZip(zip),
    street: item.cep?.address ?? '',
    number: item.number,
    complement: item.complement ?? '',
    district: item.cep?.neighborhood ?? '',
    city: item.cep?.city?.citieName ?? '',
    state: stateHint,
  };
}

export async function lookupCep(accessToken: string, cep: string) {
  return gescomAuthed<ApiCepLookup>(cepLookupPath(cep), { method: 'GET' }, accessToken);
}

export async function fetchUserDetails(accessToken: string, userId: string) {
  return gescomAuthed<ApiUserDetails>(userPath(userId, '/details'), { method: 'GET' }, accessToken);
}
