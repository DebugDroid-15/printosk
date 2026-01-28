'use client';

import Image from 'next/image';

export function Navbar() {
  return (
    <header style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '1rem 2rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <button
        onClick={() => window.location.href = '/'}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          padding: 0,
          minWidth: 'fit-content',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1)';
        }}
      >
        <Image
          src="/images/logo.svg"
          alt="Printosk Logo"
          width={140}
          height={40}
          priority
          style={{ width: '140px', height: '40px' }}
        />
      </button>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {/* Upload Link */}
        <button
          onClick={() => window.location.href = '/upload'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.backgroundColor = '#667eea';
            el.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.backgroundColor = 'transparent';
            el.style.color = '#667eea';
          }}
        >
          📤 Upload
        </button>

        {/* Lookup Link */}
        <button
          onClick={() => window.location.href = '/lookup'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.backgroundColor = '#667eea';
            el.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.backgroundColor = 'transparent';
            el.style.color = '#667eea';
          }}
        >
          📍 Status
        </button>

        {/* Language Selector */}
        <select style={{
          padding: '0.5rem 1rem',
          border: '2px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '0.9rem',
          color: '#374151',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLSelectElement;
          el.style.borderColor = '#667eea';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLSelectElement;
          el.style.borderColor = '#e5e7eb';
        }}
        >
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>
      </nav>
    </header>
  );
}
