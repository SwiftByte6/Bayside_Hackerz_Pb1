import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Vibe-Audit | AI Production Readiness Scanner',
  description: 'Scan your vibe-coded repository for security vulnerabilities, PII exposure, hallucinated dependencies and get a comprehensive Vibe-to-Value production readiness score.',
  keywords: 'security scanner, vibe coding, production readiness, AI security, GDPR compliance, SOC2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
