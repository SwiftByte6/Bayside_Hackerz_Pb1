import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import SecurityTicker from '@/components/SecurityTicker';

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
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CustomCursor />
        <Navbar />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, backgroundColor: '#06040a' }}>
          <SecurityTicker />
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
