/**
 * Printosk - Upload & Print Settings Page
 * Step 1: File upload, Step 2: Print settings, Step 3: Payment
 */

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { loadRazorpayScript, openRazorpayCheckout, createRazorpayOrder } from '@/lib/razorpay';
import { validateEmail, validateFile, formatFileSize } from '@/lib/utils';

interface PrintSettings {
  colorMode: 'color' | 'bw';
  copies: number;
  paperSize: 'a4' | 'letter' | 'a3';
  duplex: boolean;
}

interface UploadedFile {
  file: File;
  name: string;
  size: string;
}

export default function UploadPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useState<PrintSettings>({
    colorMode: 'bw',
    copies: 1,
    paperSize: 'a4',
    duplex: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }
      newFiles.push({
        file,
        name: file.name,
        size: formatFileSize(file.size),
      });
    }

    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Step 2: Validate and move to settings
  const handleNextToSettings = () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Invalid email address');
      return;
    }
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 3: Calculate price and initiate payment
  const calculatePrice = () => {
    const basePrice = uploadedFiles.length * 5 * 100; // ₹5 per file in paise
    const colorMultiplier = settings.colorMode === 'color' ? 2 : 1;
    const copiesMultiplier = settings.copies;
    return basePrice * colorMultiplier * copiesMultiplier;
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment system');
        return;
      }

      const amount = calculatePrice();
      const receipt = `order_${Date.now()}`;
      const description = `${uploadedFiles.length} files - ${settings.colorMode} - ${settings.copies} copies`;

      // Create order
      const orderResponse = await createRazorpayOrder(amount, receipt, description);

      if (!orderResponse.success) {
        setError(String(orderResponse.error) || 'Failed to create payment order');
        return;
      }

      // Open Razorpay checkout
      openRazorpayCheckout({
        orderId: orderResponse.order?.id,
        amount,
        email,
        phone,
        onSuccess: async (paymentId: string, signature: string) => {
          // Verify signature and create print job
          try {
            const response = await fetch('/api/payments/verify-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderResponse.order?.id,
                paymentId,
                signature,
                email,
                phone,
                files: uploadedFiles.map(f => ({ name: f.name, size: f.file.size })),
                settings,
              }),
            });

            const data = await response.json();
            if (data.success) {
              // Redirect to confirmation page with print ID
              window.location.href = `/confirmation?printId=${data.printId}`;
            } else {
              setError(data.error || 'Payment verification failed');
            }
          } catch (err: any) {
            const errorMsg = err?.message || 'Error verifying payment';
            setError(String(errorMsg));
          }
        },
        onError: (error: any) => {
          const errorMsg = error?.message || String(error) || 'Payment failed';
          setError(String(errorMsg));
        },
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Payment error';
      setError(String(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = calculatePrice();
  const displayPrice = (totalPrice / 100).toFixed(2);

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '50%',
            backgroundColor: step >= 1 ? '#007bff' : '#e9ecef',
            color: step >= 1 ? 'white' : '#666',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            1
          </div>
          <div style={{ flex: 1, borderTop: '2px solid #e9ecef', marginTop: '1.5rem' }}></div>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '50%',
            backgroundColor: step >= 2 ? '#007bff' : '#e9ecef',
            color: step >= 2 ? 'white' : '#666',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            2
          </div>
          <div style={{ flex: 1, borderTop: '2px solid #e9ecef', marginTop: '1.5rem' }}></div>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '50%',
            backgroundColor: step >= 3 ? '#007bff' : '#e9ecef',
            color: step >= 3 ? 'white' : '#666',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            3
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div>
            <h2>Step 1: Upload Files & Contact Info</h2>

            {/* Email Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Phone Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* File Upload Area */}
            <div style={{
              border: '2px dashed #007bff',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              cursor: 'pointer',
              backgroundColor: '#f8f9ff',
              transition: 'all 0.3s',
            }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📁 Click to upload files</p>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>or drag and drop</p>
              <p style={{ color: '#999', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                PDF, DOC, or images (max 50MB each)
              </p>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Uploaded Files ({uploadedFiles.length})</h4>
                <div style={{ listStyleType: 'none', padding: 0 }}>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: '#f8f9fa',
                        marginBottom: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #e9ecef',
                      }}
                    >
                      <span>📄 {file.name} ({file.size})</span>
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Next Button */}
            <button
              onClick={handleNextToSettings}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Next: Print Settings →
            </button>
          </div>
        )}

        {/* Step 2: Print Settings */}
        {step === 2 && (
          <div>
            <h2>Step 2: Print Settings</h2>

            {/* Color Mode */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Color Mode
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    value="bw"
                    checked={settings.colorMode === 'bw'}
                    onChange={(e) => setSettings({ ...settings, colorMode: 'bw' })}
                  />
                  Black & White
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    value="color"
                    checked={settings.colorMode === 'color'}
                    onChange={(e) => setSettings({ ...settings, colorMode: 'color' as any })}
                  />
                  Color
                </label>
              </div>
            </div>

            {/* Copies */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Number of Copies: {settings.copies}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={settings.copies}
                onChange={(e) => setSettings({ ...settings, copies: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Paper Size */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Paper Size
              </label>
              <select
                value={settings.paperSize}
                onChange={(e) => setSettings({ ...settings, paperSize: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="a3">A3</option>
              </select>
            </div>

            {/* Duplex */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.duplex}
                  onChange={(e) => setSettings({ ...settings, duplex: e.target.checked })}
                />
                Double-sided (Duplex)
              </label>
            </div>

            {/* Price Display */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <p style={{ marginBottom: '0.5rem', color: '#666' }}>Estimated Price</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                ₹{displayPrice}
              </p>
            </div>

            {/* Error Message */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Next: Payment →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div>
            <h2>Step 3: Payment</h2>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}>
              <h4 style={{ marginTop: 0 }}>Order Summary</h4>
              <p><strong>Files:</strong> {uploadedFiles.length} files</p>
              <p><strong>Color:</strong> {settings.colorMode === 'color' ? 'Color' : 'Black & White'}</p>
              <p><strong>Copies:</strong> {settings.copies}</p>
              <p><strong>Paper Size:</strong> {settings.paperSize.toUpperCase()}</p>
              <p><strong>Duplex:</strong> {settings.duplex ? 'Yes' : 'No'}</p>
              <hr />
              <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#007bff' }}>
                Total: ₹{displayPrice}
              </p>
            </div>

            {/* Error Message */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Payment Button */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(2)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                ← Back
              </button>
              <button
                onClick={handlePayment}
                className="btn btn-primary"
                style={{ flex: 1, fontSize: '1.1rem' }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Pay ₹' + displayPrice}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
              🔒 Payments are secure and handled by Razorpay
            </p>
          </div>
        )}

        {/* Footer Links */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
