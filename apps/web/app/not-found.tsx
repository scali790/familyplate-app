import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0' }}>404</h1>
      <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '10px 0' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        The page you are looking for does not exist.
      </p>
      <Link 
        href="/" 
        style={{ 
          color: '#0070f3', 
          textDecoration: 'none',
          padding: '10px 20px',
          border: '1px solid #0070f3',
          borderRadius: '5px'
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
