'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#f7f7f8',
          color: '#1a1a1a',
          fontFamily: 'Poppins, Inter, system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: '24rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Não foi possível carregar o marketplace
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '0.875rem', color: '#5c6570' }}>
            Atualize a página ou tente de novo em instantes.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: '1rem',
              height: '3rem',
              width: '100%',
              border: 0,
              borderRadius: '0.75rem',
              background: '#28617e',
              color: '#fff',
              font: 'inherit',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
