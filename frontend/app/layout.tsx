/**
 * Printosk Frontend - Main Layout
 * Sets up global styles and context providers
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Printosk - Self-Service Printing',
  description: 'Print on demand at our kiosks',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-900 text-white text-center py-4 text-sm">
          <p>&copy; 2026 Printosk. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
