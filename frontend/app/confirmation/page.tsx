/**
 * Printosk - Confirmation Page
 * Shows Print ID after successful payment
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const printId = searchParams.get('printId');

  if (!printId) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>❌ Invalid Print ID</h2>
        <p>Could not retrieve your print ID. Please try again.</p>
        <Link href="/upload" className="btn btn-primary">
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '4rem', paddingBottom: '4rem' }}>
        {/* Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            ✅
          </div>
        </div>

        {/* Confirmation Message */}
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          Payment Successful!
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          Your print job has been created and is ready to print.
        </p>

        {/* Print ID Card */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>Your Print ID</p>
          <div style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#007bff',
            fontFamily: 'monospace',
            letterSpacing: '0.5rem',
            marginBottom: '1rem',
          }}>
            {printId}
          </div>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>
            Expires in 24 hours
          </p>
        </div>

        {/* Instructions */}
        <div style={{
          backgroundColor: '#e7f3ff',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginTop: 0 }}>📋 What's Next?</h3>
          <ol style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li>Save or note down your <strong>Print ID: {printId}</strong></li>
            <li>Go to any of our kiosks</li>
            <li>Enter your Print ID using the numeric keypad</li>
            <li>Select your print settings (if needed)</li>
            <li>Your documents will print automatically</li>
          </ol>
        </div>

        {/* Expiry Warning */}
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #ffc107',
        }}>
          <p style={{ marginBottom: 0, color: '#856404' }}>
            ⏰ Your Print ID will expire in 24 hours. Please print before then.
          </p>
        </div>

        {/* Print ID Details */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}>
          <h4 style={{ marginTop: 0 }}>Print ID Details</h4>
          <div style={{ lineHeight: '1.8', textAlign: 'left' }}>
            <p><strong>Print ID:</strong> <code style={{ backgroundColor: '#e9ecef', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{printId}</code></p>
            <p><strong>Status:</strong> Ready to Print</p>
            <p><strong>Expires:</strong> 24 hours from now</p>
            <p style={{ marginBottom: 0, color: '#666' }}>
              📍 Go to any Printosk kiosk and enter this ID to print your documents.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button
            onClick={() => {
              // Copy Print ID to clipboard
              navigator.clipboard.writeText(printId);
              alert('Print ID copied to clipboard!');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            📋 Copy Print ID
          </button>

          <Link href="/upload" className="btn btn-secondary" style={{ textAlign: 'center' }}>
            Upload More Files
          </Link>

          <Link href="/lookup" className="btn btn-primary" style={{ textAlign: 'center' }}>
            Check Print Status
          </Link>

          <Link href="/" className="btn btn-outline" style={{ textAlign: 'center' }}>
            Back to Home
          </Link>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h4>❓ FAQ</h4>
          <details style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Can I reuse my Print ID?
            </summary>
            <p style={{ marginTop: '0.5rem', color: '#666' }}>
              No, each Print ID is single-use. Once printed, it will be marked as used.
            </p>
          </details>

          <details style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              What if I forget my Print ID?
            </summary>
            <p style={{ marginTop: '0.5rem', color: '#666' }}>
              You can look up your print jobs using your email address on the <Link href="/lookup" style={{ color: '#007bff' }}>Status Lookup</Link> page.
            </p>
          </details>

          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              What happens after 24 hours?
            </summary>
            <p style={{ marginTop: '0.5rem', color: '#666' }}>
              Your files will be automatically deleted after 24 hours and your Print ID will expire.
            </p>
          </details>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
