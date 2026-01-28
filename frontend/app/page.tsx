/**
 * Printosk Frontend - Home Page
 * Landing page with CTA to start printing
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [mockMode] = useState(process.env.NEXT_PUBLIC_MOCK_MODE === 'true');

  return (
    <div className="container">
      <div style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#333' }}>
          Printosk
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#666' }}>
          Self-Service Printing Made Simple
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Upload your documents, choose your print settings, and get a Print ID in seconds.
          </p>
          <p style={{ marginBottom: '2rem' }}>
            Then head to any of our kiosks and enter your ID to print.
          </p>
        </div>

        {mockMode && (
          <div className="alert alert-info" style={{ maxWidth: '500px', margin: '0 auto 2rem' }}>
            🧪 Running in MOCK MODE - Payments are simulated
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/upload" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            Start Printing
          </Link>
          <Link href="/lookup" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            Check Status
          </Link>
        </div>

        <div style={{ marginTop: '4rem', padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', maxWidth: '600px', margin: '4rem auto' }}>
          <h2 style={{ marginBottom: '1rem' }}>How It Works</h2>
          <ol style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li><strong>Upload:</strong> Select your PDF, image, or document files</li>
            <li><strong>Configure:</strong> Choose color/B&W, copies, paper size</li>
            <li><strong>Pay:</strong> Secure payment via Razorpay</li>
            <li><strong>Get ID:</strong> Receive a unique 6-digit Print ID</li>
            <li><strong>Print:</strong> Enter your ID at the kiosk to print</li>
            <li><strong>Done:</strong> Files are securely deleted after printing</li>
          </ol>
        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#e7f3ff', borderRadius: '8px', maxWidth: '600px', margin: '3rem auto', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>📋 Requirements</h3>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Valid email address</li>
            <li>PDF, DOC, or image files (max 50MB each)</li>
            <li>Payment via Razorpay</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
