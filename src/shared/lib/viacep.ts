import 'server-only';

import { GescomError } from '@/shared/lib/gescom';

/** Resposta do webservice ViaCEP, no formato aceito por POST/PATCH `/api/v1/addresses`. */
export type ViaCepResponse = {
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

const VIA_CEP_URL = 'https://viacep.com.br/ws';
const timeoutMs = 8_000;

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function fetchViaCep(cep: string): Promise<ViaCepResponse> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) {
    throw new GescomError(422, 'VALIDATION_ERROR', 'Informe um CEP com 8 dígitos.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${VIA_CEP_URL}/${digits}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (response.status === 400) {
      throw new GescomError(422, 'VALIDATION_ERROR', 'CEP em formato inválido.');
    }

    if (!response.ok) {
      throw new GescomError(
        502,
        'VIACEP_UNAVAILABLE',
        'Não foi possível consultar o CEP. Tente novamente.',
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new GescomError(
        502,
        'VIACEP_UNAVAILABLE',
        'A consulta de CEP retornou uma resposta inválida.',
      );
    }

    if (body.erro === true || body.erro === 'true') {
      throw new GescomError(404, 'CEP_NOT_FOUND_VIACEP', 'CEP não encontrado. Informe outro.');
    }

    const data: ViaCepResponse = {
      cep: text(body.cep) || `${digits.slice(0, 5)}-${digits.slice(5)}`,
      logradouro: text(body.logradouro),
      complemento: text(body.complemento),
      unidade: text(body.unidade),
      bairro: text(body.bairro),
      localidade: text(body.localidade),
      uf: text(body.uf).toUpperCase(),
      estado: text(body.estado),
      regiao: text(body.regiao),
      ibge: text(body.ibge),
      gia: text(body.gia),
      ddd: text(body.ddd),
      siafi: text(body.siafi),
    };

    if (!data.localidade || data.uf.length !== 2) {
      throw new GescomError(404, 'CEP_NOT_FOUND_VIACEP', 'CEP não encontrado. Informe outro.');
    }

    return data;
  } catch (error) {
    if (error instanceof GescomError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GescomError(
        502,
        'VIACEP_UNAVAILABLE',
        'A consulta de CEP demorou demais. Tente novamente.',
      );
    }
    throw new GescomError(
      502,
      'VIACEP_UNAVAILABLE',
      'Não foi possível consultar o CEP. Tente novamente.',
    );
  } finally {
    clearTimeout(timer);
  }
}
