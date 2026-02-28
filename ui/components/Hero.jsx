import Image from 'next/image'
import React from 'react'
import Button from './Button'

const Hero = () => {
  return (
    <div
      style={{
        height: '100vh',
        background: '#000000',
        position: 'relative',
        width: '100%',
      }}
    >
        {/* Hero Content */}
        <div
          style={{
            position: 'relative',
            height: '70vh',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
            textAlign: 'center',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid #374151',
              background: 'rgba(17, 24, 39, 0.5)',
              backdropFilter: 'blur(4px)',
              marginBottom: '32px',
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>AI Production Readiness Scanner</span>
          </div>
          
          {/* Headline */}
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '16px',
              maxWidth: '56rem',
              lineHeight: 1.15,
            }}
          >
            Audit the{' '}
            <span
              style={{
                color: 'transparent',
                background: 'linear-gradient(to right, #c084fc, #9333ea)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              Intelligence
            </span>{' '}
            Behind Your Code.
          </h1>
          
          {/* Subtitle */}
          <p
            style={{
              color: '#9ca3af',
              fontSize: '1rem',
              maxWidth: '42rem',
              marginBottom: '32px',
              lineHeight: 1.6,
            }}
          >
            AI-generated code moves fast — but risk moves faster.<br />
            Scan your repository for secrets, vulnerable dependencies, LLM attack vectors, and compliance gaps in seconds.
          </p>
          
          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              marginTop: '16px',
              gap: '16px',
              justifyContent: 'center',
            }}
          >
            <Button text="Run Free Audit" href="/upload" variant="main" />
            <Button text="See Live Scan" href="/results" variant="hollow" />
          </div>
        </div>
        
        <Image
        src={'/bottom.png'}
        width={1920}
        height={1080}
        alt="Hero background"
        style={{
          bottom: 0,
          position: 'absolute',
          zIndex: 10,
        }}
        />
        {/* Video Background - Bottom Half */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100vw',
            height: '80vh',
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <video
            src="/HeroVedio.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scale(1)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)',
            }}
          />
        </div>
    </div>
  )
}

export default Hero