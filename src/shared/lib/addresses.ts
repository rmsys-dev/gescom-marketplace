import 'server-only';

import { addressesPath, gescomAuthed, GescomError } from '@/shared/lib/gescom';

export type AddressType =
  | 'PRINCIPAL'
  | 'ENTREGA'
  | 'COBRANCA'
  | 'RESIDENCIAL'
  | 'COMERCIAL'
  | 'FATURAMENTO'
  | 'SECUNDARIO'
  | 'OUTRO';

export type ApiUserAddress = {
  id: string;
  number: string;
  complement: string | null;
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
      state?: {
        id: string;
        uf: string;
        description: string;
      } | null;
    } | null;
  } | null;
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
    state: item.cep?.city?.state?.uf || stateHint,
  };
}

export type AddressInput = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  unidade?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  estado?: string;
  regiao?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  number?: string;
  adressType?: string;
};

const ADDRESS_TYPES: AddressType[] = [
  'PRINCIPAL',
  'ENTREGA',
  'COBRANCA',
  'RESIDENCIAL',
  'COMERCIAL',
  'FATURAMENTO',
  'SECUNDARIO',
  'OUTRO',
];

function isAddressType(value: string): value is AddressType {
  return (ADDRESS_TYPES as string[]).includes(value);
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Monta o body de POST/PATCH `/api/v1/addresses` a partir do JSON ViaCEP + ajustes do cliente. */
export function buildAddressBody(input: AddressInput) {
  const digits = text(input.cep).replace(/\D/g, '');
  if (digits.length !== 8) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'Informe um CEP com 8 dígitos.');
  }

  const logradouro = text(input.logradouro);
  const bairro = text(input.bairro);
  const localidade = text(input.localidade);
  const uf = text(input.uf).toUpperCase();
  const estado = text(input.estado);
  const ibge = text(input.ibge);
  const number = text(input.number) || 'S/N';
  const complemento = text(input.complemento);
  const adressType = text(input.adressType) || 'ENTREGA';

  if (!logradouro) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'Informe o logradouro.');
  }
  if (!bairro) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'Informe o bairro.');
  }
  if (!localidade || uf.length !== 2 || !estado) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'Consulte o CEP antes de salvar o endereço.');
  }
  if (!ibge) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'O CEP consultado não trouxe código IBGE.');
  }
  if (number.length > 255) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'Informe o número do endereço.');
  }
  if (complemento.length > 255) {
    throw new GescomError(
      422,
      'VALIDATION_ERROR',
      'O complemento deve ter no máximo 255 caracteres.',
    );
  }
  if (!isAddressType(adressType)) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'Tipo de endereço inválido.');
  }

  return {
    cep: `${digits.slice(0, 5)}-${digits.slice(5)}`,
    logradouro,
    complemento,
    unidade: text(input.unidade),
    bairro,
    localidade,
    uf,
    estado,
    regiao: text(input.regiao),
    ibge,
    gia: text(input.gia),
    ddd: text(input.ddd),
    siafi: text(input.siafi),
    number,
    adressType,
  };
}

export type AddressMutationResult = {
  cepCreated?: boolean;
  cityCreated?: boolean;
  stateCreated?: boolean;
  cep?: {
    id: string;
    cepNumber: string;
    address: string;
    neighborhood: string;
    cityId: string;
  };
  userAddress?: {
    id: string;
    number: string;
    complement: string | null;
    adressType: AddressType;
    cepId: string;
    userId: string;
  };
};

export async function fetchUserAddresses(accessToken: string) {
  return gescomAuthed<ApiUserAddress[]>(addressesPath(), { method: 'GET' }, accessToken);
}

export async function createUserAddressOnApi(accessToken: string, body: ReturnType<typeof buildAddressBody>) {
  return gescomAuthed<AddressMutationResult>(
    addressesPath(),
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    accessToken,
  );
}

export async function updateUserAddressOnApi(
  accessToken: string,
  addressId: string,
  body: ReturnType<typeof buildAddressBody>,
) {
  return gescomAuthed<AddressMutationResult>(
    addressesPath(addressId),
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    accessToken,
  );
}

export async function deleteUserAddressOnApi(accessToken: string, addressId: string) {
  return gescomAuthed<{ id: string; deletedAt: string }>(
    addressesPath(addressId),
    { method: 'DELETE' },
    accessToken,
  );
}
