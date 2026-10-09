import 'server-only';

function resolveApiUrl() {
  const raw = process.env.GESCOM_API_URL ?? process.env.API_URL;
  if (!raw) return undefined;
  // Aceita URL com ou sem /api/v1 — os paths do cliente já incluem /api/v1/...
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '');
}

const apiUrl = resolveApiUrl();
const enterpriseId = process.env.GESCOM_ENTERPRISE_ID;
const timeoutMs = Number(process.env.API_TIMEOUT_MS ?? 10_000);

export type GescomDetail = {
  path?: string;
  message: string;
};

export class GescomError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: GescomDetail[],
  ) {
    super(message);
    this.name = 'GescomError';
  }
}

type GescomSuccessBody<T> = {
  success?: boolean;
  message: string;
  data: T;
  pagination?: GescomPagination;
};

type GescomErrorBody = {
  requestId?: string;
  code?: string;
  message?: string;
  details?: GescomDetail[];
};

export type GescomPagination = {
  total: number;
  limit: number;
  offset: number;
};

export type GescomResult<T> = {
  data: T;
  message: string;
  pagination?: GescomPagination;
};

function assertConfig() {
  if (!apiUrl) {
    throw new GescomError(500, 'CONFIG_ERROR', 'GESCOM_API_URL não está configurada.');
  }
  if (!enterpriseId) {
    throw new GescomError(500, 'CONFIG_ERROR', 'GESCOM_ENTERPRISE_ID não está configurada.');
  }
}

export function storePath(suffix: string) {
  assertConfig();
  return `/api/v1/store/${enterpriseId}/customers${suffix}`;
}

/** Rotas públicas da vitrine: `/api/v1/store/{enterpriseId}/...` */
export function storeCatalogPath(suffix: string) {
  assertConfig();
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `/api/v1/store/${enterpriseId}${path}`;
}

export function userPath(userId: string, suffix: string) {
  assertConfig();
  return `/api/v1/enterprises/${enterpriseId}/users/${userId}${suffix}`;
}

export function cepLookupPath(cepNumber: string) {
  const digits = cepNumber.replace(/\D/g, '');
  return `/api/v1/addresses/ceps/lookup/${digits}`;
}

export async function gescom<T>(path: string, init?: RequestInit): Promise<GescomResult<T>> {
  assertConfig();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    let body: GescomSuccessBody<T> & GescomErrorBody;
    try {
      body = (await response.json()) as GescomSuccessBody<T> & GescomErrorBody;
    } catch {
      throw new GescomError(
        response.status || 502,
        'INVALID_RESPONSE',
        'A API retornou uma resposta inválida.',
      );
    }

    if (!response.ok) {
      throw new GescomError(
        response.status,
        body.code ?? 'REQUEST_FAILED',
        body.message ?? 'Não foi possível concluir a solicitação.',
        body.details,
      );
    }

    return {
      data: body.data,
      message: body.message ?? 'OK',
      ...(body.pagination ? { pagination: body.pagination } : {}),
    };
  } catch (error) {
    if (error instanceof GescomError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GescomError(
        504,
        'TIMEOUT',
        'Tempo de resposta excedido. Entre em contato com o suporte.',
      );
    }
    throw new GescomError(502, 'NETWORK_ERROR', 'Erro de conexão. Entre em contato com o suporte.');
  } finally {
    clearTimeout(timer);
  }
}

export async function gescomAuthed<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<GescomResult<T>> {
  if (!accessToken) {
    throw new GescomError(401, 'UNAUTHENTICATED', 'Sessão expirada. Entre novamente.');
  }

  return gescom<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
