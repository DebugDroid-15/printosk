/**
 * Printosk Frontend - Home Page
 * Landing page with CTA to start printing
 */

'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#007bff' }}>
          🖨️ QuickPrint Station
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
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#222',
          lineHeight: '1.2',
        }}>
          Print Your Memories<br />& Documents
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: '#666',
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
          <Link href="/upload" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '2rem 3rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              minWidth: '300px',
              boxShadow: '0 8px 20px rgba(0,123,255,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,123,255,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,123,255,0.3)';
            }}
            >
              <span style={{ fontSize: '2rem' }}>📷</span>
              <span>Start Printing</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Photos, Documents, & More</span>
            </button>
          </Link>

          {/* Order Status Button */}
          <Link href="/lookup" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '2rem 3rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: 'white',
              color: '#333',
              border: '2px solid #ddd',
              borderRadius: '12px',
              cursor: 'pointer',
              minWidth: '300px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
              e.currentTarget.style.borderColor = '#007bff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = '#ddd';
            }}
            >
              <span style={{ fontSize: '2rem' }}>📋</span>
              <span>Order Status</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Check pickup time or details</span>
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'white',
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid #eee',
      }}>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: '0 auto',
        }}>
          🎧 Need help? Tap here for 24/7 Support
        </button>
        <p style={{ color: '#999', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Secure • Fast • Convenient
        </p>
      </footer>
    </div>
  );
}
