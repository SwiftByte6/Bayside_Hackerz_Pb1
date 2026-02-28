import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const footerGroups = [
    {
      title: 'Product',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Results', href: '/results' },
        { label: 'Pricing', href: '/#pricing' },
      ],
    },
    {
      title: 'Security',
      links: [
        { label: 'Secret Scan', href: '/#scanner' },
        { label: 'Dependency Audit', href: '/#scanner' },
        { label: 'PII Check', href: '/#scanner' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'GitHub', href: 'https://github.com', external: true },
        { label: 'Support', href: 'mailto:support@vibeaudit.dev', external: true },
      ],
    },
  ];

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'grid',
          gridTemplateColumns: '1.2fr repeat(3, minmax(120px, 1fr))',
          gap: '24px',
        }}
      >
        <div>
          <h3 style={{ color: '#ffffff', marginBottom: '8px', fontSize: '1rem' }}>Vibe-Audit</h3>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            AI production readiness scanner for secrets, risky dependencies, prompt injection, and compliance risks.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h4 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '0.95rem' }}>{group.title}</h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {group.links.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.88rem', textDecoration: 'none' }}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.88rem', textDecoration: 'none' }}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 24px 18px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.82rem',
        }}
      >
        © {new Date().getFullYear()} Vibe-Audit. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
