'use client';

import { useState, useRef } from 'react';
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
        onFailure: (error: any) => {
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 3rem', color: 'white' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋 Print Your Documents</h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>Step {step} of 3</p>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Step 1: Upload & Contact */}
        {step === 1 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            alignItems: 'start',
          }}>
            {/* Left: Contact Info */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>
                📧 Contact Information
              </h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 1234567890"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Privacy Notice */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                marginBottom: '1.5rem',
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
                  🔒 Your information is secure and will be deleted after 24 hours.
                </p>
              </div>

              <button
                onClick={handleNextToSettings}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {const el = e.target as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 20px rgba(102,126,234,0.4)'}}
                onMouseOut={(e) => {const el = e.target as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'}}
              >
                Continue to Upload →
              </button>
            </div>

            {/* Right: File Upload */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>
                📁 Upload Files
              </h2>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #667eea',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#f0f4ff',
                  marginBottom: '1.5rem',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {const el = e.target as HTMLElement; el.style.backgroundColor = '#e0e7ff'; el.style.borderColor = '#764ba2'}}
                onMouseOut={(e) => {const el = e.target as HTMLElement; el.style.backgroundColor = '#f0f4ff'; el.style.borderColor = '#667eea'}}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📤</div>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: '0.5rem 0' }}>
                  Click to upload or drag & drop
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  PDF, DOC, DOCX, PPT, XLS up to 50MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              />

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                    📋 Files ({uploadedFiles.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.875rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                            {file.size}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            marginLeft: '0.75rem',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Print Settings */}
        {step === 2 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#1f2937' }}>
              🎨 Print Settings
            </h2>

            {/* Color Mode */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: '#1f2937' }}>
                Color Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {(['bw', 'color'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSettings({ ...settings, colorMode: mode })}
                    style={{
                      padding: '1rem',
                      border: `2px solid ${settings.colorMode === mode ? '#667eea' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      backgroundColor: settings.colorMode === mode ? '#f0f4ff' : 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      color: settings.colorMode === mode ? '#667eea' : '#6b7280',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {mode === 'bw' ? '⚪ Black & White' : '🌈 Color'}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: '#1f2937' }}>
                Paper Size
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {(['a4', 'letter', 'a3'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSettings({ ...settings, paperSize: size })}
                    style={{
                      padding: '1rem',
                      border: `2px solid ${settings.paperSize === size ? '#667eea' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      backgroundColor: settings.paperSize === size ? '#f0f4ff' : 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: settings.paperSize === size ? '#667eea' : '#6b7280',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Copies */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1f2937' }}>
                Number of Copies: <span style={{ color: '#667eea', fontWeight: '900' }}>{settings.copies}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.copies}
                onChange={(e) => setSettings({ ...settings, copies: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  outline: 'none',
                  accentColor: '#667eea',
                }}
              />
            </div>

            {/* Duplex */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={settings.duplex}
                onChange={(e) => setSettings({ ...settings, duplex: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#667eea' }}
              />
              <label style={{ fontWeight: '600', color: '#1f2937', cursor: 'pointer' }}>
                📄 Double-sided (Duplex)
              </label>
            </div>

            {/* Error Message */}
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

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  backgroundColor: '#f3f4f6',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#1f2937' }}>
              💳 Payment & Review
            </h2>

            {/* Order Summary */}
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb',
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                Order Summary
              </h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.8' }}>
                <p style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Files:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{uploadedFiles.length}</span>
                </p>
                <p style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Color Mode:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>
                    {settings.colorMode === 'color' ? '🌈 Color' : '⚪ B&W'}
                  </span>
                </p>
                <p style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Copies:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{settings.copies}x</span>
                </p>
                <p style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paper:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{settings.paperSize.toUpperCase()}</span>
                </p>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem' }}>
                <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: '700' }}>
                  <span>Total:</span>
                  <span style={{ color: '#10b981' }}>₹{displayPrice}</span>
                </p>
              </div>
            </div>

            {/* Error Message */}
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

            {/* Payment Methods */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                Payment Method
              </h3>
              <div style={{
                padding: '1rem',
                border: '2px solid #667eea',
                borderRadius: '12px',
                backgroundColor: '#f0f4ff',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontWeight: '600', color: '#667eea', fontSize: '1.125rem' }}>
                  💳 Pay with Razorpay
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  Card, UPI, Wallet & More
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  backgroundColor: '#f3f4f6',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '⏳ Processing...' : '💳 Pay Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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