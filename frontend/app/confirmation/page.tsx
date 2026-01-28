/**
 * Printosk - Confirmation Page
 * Shows Print ID after successful payment
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const printId = searchParams.get('printId');

  if (!printId) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>❌ Invalid Print ID</h2>
        <p>Could not retrieve your print ID. Please try again.</p>
        <button onClick={() => window.location.href = '/upload'} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '500px', width: '100%', animation: 'slideUp 0.6s ease-out' }}>
        {/* Success Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2.5rem',
            animation: 'scaleIn 0.5s ease-out',
          }}>
            ✓
          </div>

          {/* Confirmation Message */}
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#1f2937' }}>
            Payment Successful!
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
            Your print job is ready to go
          </p>

          {/* Print ID Card */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            color: 'white',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', opacity: 0.9 }}>YOUR PRINT ID</p>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              fontFamily: 'monospace',
              letterSpacing: '0.25rem',
              marginBottom: '0.5rem',
            }}>
              {printId}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
              ⏰ Expires in 24 hours
            </p>
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(printId);
              alert('✓ Print ID copied!');
            }}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.75rem',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {const el = e.target as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 20px rgba(16,185,129,0.4)'}}
            onMouseOut={(e) => {const el = e.target as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'}}
          >
            📋 Copy Print ID
          </button>

          <button
            onClick={() => window.location.href = '/upload'}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: '#f3f4f6',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {const el = e.target as HTMLElement; el.style.backgroundColor = '#667eea'; el.style.color = 'white'}}
            onMouseOut={(e) => {const el = e.target as HTMLElement; el.style.backgroundColor = '#f3f4f6'; el.style.color = '#667eea'}}
          >
            Upload More Files
          </button>

          <button
            onClick={() => window.location.href = '/'}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: 'transparent',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: '0.5rem',
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '1.125rem', marginTop: 0, color: '#1f2937' }}>
            📋 How to Print
          </h3>
          <ol style={{ textAlign: 'left', lineHeight: '1.8', color: '#4b5563', margin: 0, paddingLeft: '1.5rem' }}>
            <li>Visit any Printosk kiosk</li>
            <li>Select "Enter Print ID"</li>
            <li>Type: <strong>{printId}</strong></li>
            <li>Confirm and print!</li>
          </ol>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes scaleIn {
            from {
              transform: scale(0.8);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
