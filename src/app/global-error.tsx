'use client';

import './globals.css';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
        <main className="max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold">Não foi possível carregar o marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Atualize a página ou tente de novo em instantes.
          </p>
          <button
            type="button"
            className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground"
            onClick={() => reset()}
          >
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
