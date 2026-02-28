"use client"

import Image from 'next/image'
import React, { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
  const heroRef = useRef(null)

  useGSAP(
    () => {
      // 1. Blur-to-sharp stagger reveal (Wondermakers style)
      gsap.fromTo(
        '.hero-blur-text',
        { opacity: 0, filter: 'blur(18px)', y: 28 },
        {
          opacity: 1, filter: 'blur(0px)', y: 0,
          duration: 1.2, ease: 'power3.out', stagger: 0.16,
        }
      )

      // 2. Badge border glow pulse
      gsap.to('.hero-badge', {
        boxShadow: '0 0 24px rgba(139,92,246,0.5)',
        repeat: -1, yoyo: true, duration: 1.8, ease: 'sine.inOut',
      })

      // 3. CRT scanline flicker
      gsap.to('.crt-overlay', {
        opacity: 0.045, repeat: -1, yoyo: true, duration: 0.08,
        ease: 'none', repeatDelay: 4,
      })

      // 4. Scroll-trigger: scale down hero as user scrolls
      gsap.to(heroRef.current, {
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
        scale: 0.96, opacity: 0.4, ease: 'none',
      })
    },
    { scope: heroRef }
  )

  return (
    <div
      ref={heroRef}
      id="home"
      style={{ height: '100vh', background: '#000000', position: 'relative', width: '100%' }}
    >
      {/* CRT Scanline Overlay */}
      <div
        className="crt-overlay"
        style={{
          position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', opacity: 0.035,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Hero Content */}
      <div style={{
        position: 'relative', height: '70vh', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', paddingLeft: '16px', paddingRight: '16px', textAlign: 'center',
      }}>
        {/* Badge */}
        <div
          className="hero-blur-text hero-badge"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            border: '1px solid rgba(139,92,246,0.45)',
            background: 'rgba(109,40,217,0.12)', backdropFilter: 'blur(4px)',
            marginBottom: '32px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #7c3aed', display: 'inline-block' }} />
          <span style={{ color: '#c4b5fd', fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>AI Production Readiness Scanner</span>
        </div>

        {/* Headline — staggered letter reveal */}
        <h1
          className="hero-blur-text"
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, color: '#ffffff',
            marginBottom: '16px', maxWidth: '62rem', lineHeight: 1.12, letterSpacing: '-0.02em',
          }}
        >
          Audit the{' '}
          <span style={{
            color: 'transparent',
            background: 'linear-gradient(135deg, #c084fc 0%, #9333ea 50%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 24px rgba(167,139,250,0.5))',
          }}>
            Intelligence
          </span>{' '}
          Behind Your Code.
        </h1>

        {/* Subtitle */}
        <p
          className="hero-blur-text"
          style={{
            color: '#9ca3af', fontSize: '1.05rem', maxWidth: '42rem',
            marginBottom: '40px', lineHeight: 1.7,
          }}
        >
          AI-generated code moves fast — but risk moves faster.<br />
          Scan your repository for secrets, vulnerable dependencies, LLM attack vectors, and compliance gaps in seconds.
        </p>

        {/* Scroll indicator */}
        <div className="hero-blur-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.4)', fontFamily: 'JetBrains Mono' }}>SCROLL</span>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(139,92,246,0.6), transparent)', animation: 'scrollPulse 1.8s ease-in-out infinite' }} />
        </div>
      </div>

      <Image src='/bottom.png' width={1920} height={1080} alt="Hero background"
        style={{ bottom: 0, position: 'absolute', zIndex: 10 }} />

      {/* Video Background */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100vw', height: '80vh', pointerEvents: 'none', overflow: 'hidden' }}>
        <video src="/HeroVedio.mp4" autoPlay loop muted playsInline
          style={{
            width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%)',
          }}
        />
      </div>

      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
          50% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

export default Hero