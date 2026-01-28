/**
 * Printosk Frontend - Home Page
 * Landing page with CTA to start printing
 */

'use client';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
          🖨️ Printosk
        </div>
        <select style={{
          padding: '0.5rem 1rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer',
        }}>
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
        </select>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
          opacity: 0.5,
          zIndex: 0,
        }}></div>

        {/* Content wrapper with relative positioning */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: 'white',
            lineHeight: '1.2',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            Print Your Memories<br />& Documents
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '3rem',
            maxWidth: '600px',
          }}>
            Select an option below to get started
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}>
            {/* Start Printing Button */}
            <button style={{
              padding: '2rem 3rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              minWidth: '300px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(-4px)';
              el.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
            }}
            onClick={() => window.location.href = '/upload'}
            >
              <span style={{ fontSize: '2rem' }}>📷</span>
              <span>Start Printing</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Photos, Documents, & More</span>
            </button>

            {/* Order Status Button */}
            <button style={{
              padding: '2rem 3rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '12px',
              cursor: 'pointer',
              minWidth: '300px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s, background-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(-4px)';
              el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
              el.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              el.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              el.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              el.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onClick={() => window.location.href = '/lookup'}
            >
              <span style={{ fontSize: '2rem' }}>📋</span>
              <span>Order Status</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Check pickup time or details</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
      }}>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: '0 auto',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = 'translateY(-2px)';
          el.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
        }}
        >
          🎧 Need help? Tap here for 24/7 Support
        </button>
        <p style={{ color: '#667eea', marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
          Secure • Fast • Convenient
        </p>
      </footer>
    </div>
  );
}
