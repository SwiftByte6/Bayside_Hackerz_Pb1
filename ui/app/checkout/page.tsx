'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import pricingData from '@/data/pricingData';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const selectedPlanId = searchParams.get('plan') || 'popular';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedPlan = useMemo(() => {
    return pricingData.plans.find((plan) => plan.id === selectedPlanId) || pricingData.plans[0];
  }, [selectedPlanId]);

  const handleDemoCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '120px 24px 56px',
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 700, marginBottom: '10px' }}>Demo Checkout</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
          This is a demo flow. No real payment is processed.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <form
            onSubmit={handleDemoCheckout}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '14px',
              background: 'var(--bg-secondary)',
              padding: '24px',
              display: 'grid',
              gap: '14px',
            }}
          >
            <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem' }}>
              Full Name
              <input
                required
                placeholder="Alex Carter"
                className="interactive-hover"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem' }}>
              Email
              <input
                required
                type="email"
                placeholder="alex@company.com"
                className="interactive-hover"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem' }}>
              Card Number
              <input
                required
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                className="interactive-hover"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem' }}>
                Expiry
                <input
                  required
                  placeholder="MM/YY"
                  className="interactive-hover"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem' }}>
                CVC
                <input
                  required
                  inputMode="numeric"
                  placeholder="123"
                  className="interactive-hover"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="interactive-hover"
              style={{
                marginTop: '4px',
                border: '1px solid var(--border-purple)',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1a1025 0%, #0d0a12 100%)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '12px 14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Processing...' : `Pay ${selectedPlan.price}`}
            </button>

            {isSuccess && (
              <div
                style={{
                  marginTop: '4px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-cyan)',
                  background: 'var(--cyan-dim)',
                  color: 'var(--text-primary)',
                  padding: '12px 14px',
                  fontSize: '0.9rem',
                }}
              >
                Demo payment successful. Your {selectedPlan.label} trial is now active.
              </div>
            )}
          </form>

          <aside
            style={{
              border: '1px solid var(--border)',
              borderRadius: '14px',
              background: 'var(--bg-secondary)',
              padding: '22px',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Order Summary</h2>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedPlan.label}</p>
              <p style={{ fontSize: '1.65rem', fontWeight: 700 }}>{selectedPlan.price}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{selectedPlan.description}</p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'grid', gap: '10px' }}>
              {selectedPlan.features.slice(0, 4).map((feature: string) => (
                <li key={feature} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  • {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/#pricing"
              className="interactive-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              Back to pricing
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
