'use client';

import { useState } from 'react';

interface PrintJob {
  printId: string;
  status: 'PENDING' | 'PROCESSING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  email: string;
  createdAt: string;
  expiresAt: string;
  files: number;
}

export default function LookupPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'PENDING': '#fbbf24',
      'PROCESSING': '#3b82f6',
      'PRINTING': '#8b5cf6',
      'COMPLETED': '#10b981',
      'FAILED': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusEmoji = (status: string) => {
    const emojis: Record<string, string> = {
      'PENDING': '⏳',
      'PROCESSING': '⚙️',
      'PRINTING': '🖨️',
      'COMPLETED': '✅',
      'FAILED': '❌',
    };
    return emojis[status] || '❓';
  };

  const handleSearch = async () => {
    setError('');
    setResults([]);

    if (!searchQuery.trim()) {
      setError('Enter Print ID or email to search');
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock data for demo
      if (searchQuery.toLowerCase().includes('@')) {
        setResults([
          {
            printId: '123456',
            status: 'COMPLETED',
            email: searchQuery,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            files: 3,
          },
        ]);
      } else if (/^\d{6}$/.test(searchQuery)) {
        setResults([
          {
            printId: searchQuery,
            status: 'PROCESSING',
            email: 'user@example.com',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            files: 1,
          },
        ]);
      } else {
        setError('Invalid search. Use 6-digit Print ID or email.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '600px', margin: '0 auto 2rem', color: 'white' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍 Find Your Print</h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>Search by Print ID or email</p>
      </div>

      {/* Search Card */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Search Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
            Enter Print ID or Email
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., 123456 or your@email.com"
              style={{
                flex: 1,
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '1.5rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {results.map((job) => (
          <div
            key={job.printId}
            style={{
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem',
              animation: 'slideUp 0.4s ease-out',
            }}
          >
            {/* Print ID & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Print ID</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', fontFamily: 'monospace', color: '#1f2937' }}>
                  {job.printId}
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: getStatusColor(job.status) + '20',
                border: `2px solid ${getStatusColor(job.status)}`,
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem' }}>{getStatusEmoji(job.status)}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: getStatusColor(job.status) }}>
                  {job.status}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
            }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Email</p>
                <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{job.email}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Files</p>
                <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{job.files}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {searched && results.length === 0 && !error && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No results found
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <button
            onClick={() => window.location.href = '/upload'}
            style={{
              padding: '0.875rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
            }}
          >
            ← Back to Upload
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
