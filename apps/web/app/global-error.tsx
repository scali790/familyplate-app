'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f9fafb'
        }}>
          <h1 style={{ fontSize: '48px', margin: '0', color: '#dc2626' }}>⚠️</h1>
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '20px 0 10px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '30px', maxWidth: '500px', fontSize: '14px' }}>
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => reset()}
            style={{ 
              color: '#fff',
              backgroundColor: '#3b82f6',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
