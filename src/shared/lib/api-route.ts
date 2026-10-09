import { NextResponse } from 'next/server';

import { GescomError } from '@/shared/lib/gescom';

export function jsonOk<T>(data: T, init?: { status?: number; message?: string }) {
  return NextResponse.json(
    init?.message ? { ...data, message: init.message } : data,
    { status: init?.status ?? 200 },
  );
}

export function jsonError(error: unknown) {
  if (error instanceof GescomError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  }

  console.error('[api/conta]', error);
  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir a solicitação.',
    },
    { status: 500 },
  );
}
