/**
 * Printosk - Print Status Lookup Page
 * Look up print job status by Print ID or email
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { validateEmail } from '@/lib/utils';

interface PrintJob {
  printId: string;
  status: 'PENDING' | 'PROCESSING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  email: string;
  createdAt: string;
  expiresAt: string;
  files: number;
}

export default function LookupPage() {
  const [lookupType, setLookupType] = useState<'printId' | 'email'>('printId');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#ffc107';
      case 'PROCESSING':
        return '#17a2b8';
      case 'PRINTING':
        return '#007bff';
      case 'COMPLETED':
        return '#28a745';
      case 'FAILED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'PROCESSING':
        return '⚙️';
      case 'PRINTING':
        return '🖨️';
      case 'COMPLETED':
        return '✅';
      case 'FAILED':
        return '❌';
      default:
        return '❓';
    }
  };

  const handleSearch = async () => {
    setError('');
    setResults([]);

    // Validation
    if (!searchQuery.trim()) {
      setError(`Please enter a ${lookupType === 'printId' ? 'Print ID' : 'email address'}`);
      return;
    }

    if (lookupType === 'email' && !validateEmail(searchQuery)) {
      setError('Invalid email address');
      return;
    }

    if (lookupType === 'printId' && (searchQuery.length !== 6 || !/^\d{6}$/.test(searchQuery))) {
      setError('Print ID must be a 6-digit number');
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      // Call API to search
      const response = await fetch('/api/jobs/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: lookupType,
          query: searchQuery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch results');
        return;
      }

      if (data.jobs && data.jobs.length > 0) {
        setResults(data.jobs);
      } else {
        setError('No print jobs found');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error searching for print jobs';
      setError(String(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Check Print Status</h1>

        {/* Search Type Selector */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Search by:
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                value="printId"
                checked={lookupType === 'printId'}
                onChange={(e) => {
                  setLookupType('printId');
                  setSearchQuery('');
                  setError('');
                  setResults([]);
                }}
              />
              Print ID (6 digits)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                value="email"
                checked={lookupType === 'email'}
                onChange={(e) => {
                  setLookupType('email');
                  setSearchQuery('');
                  setError('');
                  setResults([]);
                }}
              />
              Email Address
            </label>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <input
            type={lookupType === 'email' ? 'email' : 'text'}
            inputMode={lookupType === 'printId' ? 'numeric' : 'email'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={lookupType === 'printId' ? 'Enter 6-digit Print ID' : 'Enter your email address'}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Info Message */}
        {!searched && (
          <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
            💡 Enter your Print ID or email address to check the status of your print jobs.
          </div>
        )}

        {/* Results */}
        {searched && results.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>
              Found {results.length} print job{results.length !== 1 ? 's' : ''}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((job) => (
                <div
                  key={job.printId}
                  style={{
                    border: `2px solid ${getStatusColor(job.status)}`,
                    borderRadius: '8px',
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {/* Print ID & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontFamily: 'monospace' }}>
                        Print ID: {job.printId}
                      </h4>
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: getStatusColor(job.status),
                      color: 'white',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                      {getStatusEmoji(job.status)} {job.status}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Email:</strong> {job.email}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Files:</strong> {job.files} file{job.files !== 1 ? 's' : ''}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Expires:</strong> {new Date(job.expiresAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Status-specific Actions */}
                  {job.status === 'COMPLETED' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#d4edda',
                      border: '1px solid #c3e6cb',
                      borderRadius: '4px',
                      color: '#155724',
                    }}>
                      ✅ Your print job has been completed!
                    </div>
                  )}

                  {job.status === 'PENDING' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      color: '#856404',
                    }}>
                      ⏳ Your job is pending. Please visit a kiosk to print.
                    </div>
                  )}

                  {job.status === 'FAILED' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#f8d7da',
                      border: '1px solid #f5c6cb',
                      borderRadius: '4px',
                      color: '#721c24',
                    }}>
                      ❌ Print job failed. Please contact support or upload again.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searched && results.length === 0 && !error && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}>
            <p style={{ color: '#666' }}>
              No print jobs found. Try searching with a different {lookupType === 'printId' ? 'Print ID' : 'email address'}.
            </p>
          </div>
        )}

        {/* Additional Help */}
        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>📋 Job Status Explained</h3>
          <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li><strong>⏳ PENDING:</strong> Job created, waiting for kiosk interaction</li>
            <li><strong>⚙️ PROCESSING:</strong> Kiosk is preparing to print</li>
            <li><strong>🖨️ PRINTING:</strong> Currently printing</li>
            <li><strong>✅ COMPLETED:</strong> Print completed successfully</li>
            <li><strong>❌ FAILED:</strong> Print failed, please contact support</li>
          </ul>
        </div>

        {/* Footer Links */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
          <span style={{ color: '#ddd' }}>|</span>
          <Link href="/upload" style={{ color: '#007bff', textDecoration: 'none' }}>
            Upload More Files →
          </Link>
        </div>
      </div>
    </div>
  );
}
