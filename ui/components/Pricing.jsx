import React from 'react'
import Link from 'next/link'
import pricingData from '../data/pricingData'

const Pricing = () => {
  const sectionStyle = {
    padding: '80px 24px',
    background: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.2), rgba(11, 11, 20, 1) 45%)',
  };

  const wrapperStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headingStyle = {
    fontSize: '2.2rem',
    fontWeight: 700,
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: '8px',
  };

  const subtitleStyle = {
    textAlign: 'center',
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: '40px',
  };

  const cardsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  };

  return (
    <section style={sectionStyle} id="pricing">
      <div style={wrapperStyle}>
        <h2 style={headingStyle}>{pricingData.title}</h2>
        <p style={subtitleStyle}>{pricingData.subtitle}</p>

        <div style={cardsGridStyle}>
          {pricingData.plans.map((plan) => (
            <div
              key={plan.id}
              className="card-hover"
              style={{
                borderRadius: '18px',
                border: plan.highlight ? '1px solid rgba(192, 132, 252, 0.8)' : '1px solid rgba(255,255,255,0.2)',
                background: plan.highlight
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(124,58,237,0.08))'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                padding: '24px',
                boxShadow: plan.highlight
                  ? '0 0 24px rgba(168,85,247,0.35)'
                  : '0 0 16px rgba(59,130,246,0.08)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: plan.highlight ? '#d8b4fe' : 'rgba(255,255,255,0.75)',
                  background: plan.highlight ? 'rgba(139,92,246,0.28)' : 'rgba(255,255,255,0.08)',
                  marginBottom: '16px',
                }}
              >
                {plan.label}
              </div>

              <h3 style={{ fontSize: '2.7rem', color: '#ffffff', marginBottom: '8px', fontWeight: 700 }}>{plan.price}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', fontSize: '0.95rem' }}>{plan.description}</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px 0', display: 'grid', gap: '10px' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '9999px',
                        border: '1px solid rgba(167,139,250,0.7)',
                        fontSize: '0.7rem',
                        color: '#c084fc',
                      }}
                    >
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout?plan=${plan.id}`}
                className="interactive-hover"
                style={{
                  width: '100%',
                  border: plan.highlight ? '1px solid rgba(192,132,252,0.95)' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '9999px',
                  padding: '13px 16px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: plan.highlight
                    ? 'linear-gradient(to right, rgba(124,58,237,0.95), rgba(192,132,252,0.95))'
                    : 'linear-gradient(to right, rgba(255,255,255,0.16), rgba(255,255,255,0.08))',
                  color: '#ffffff',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing