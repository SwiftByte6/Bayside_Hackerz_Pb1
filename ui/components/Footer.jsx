'use client'

import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const footerRef = useRef(null)
  const footerInnerRef = useRef(null)
  const bigTextRef = useRef(null)
  const topContentRef = useRef(null)

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )

  useEffect(() => {
    const checkIsMobile = () => window.innerWidth <= 768
    const handleResize = () => setIsMobile(checkIsMobile())

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useGSAP(
    () => {
      if (isMobile) return

      const trigger = ScrollTrigger.create({
        trigger: footerRef.current,
        start: 'top bottom', // Start animating when the very top of the footer hits the very bottom of the window
        end: 'bottom bottom', // End when the very bottom of the footer hits the very bottom of the window
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress

          // Slides the ENTIRE footer inner content down from -40% to 0%
          // Since the main page layout now has bg-[#06040a] and z-index 1, the footer slides out from *underneath* it!
          gsap.set(footerInnerRef.current, {
            y: `${-40 * (1 - progress)}%`,
            opacity: 0.3 + (0.7 * progress)
          })

          // VIBEAUDIT text slides even faster for depth
          gsap.set(bigTextRef.current, {
            y: `${-80 * (1 - progress)}%`,
            x: isMobile ? '0' : '-2.5vw', // Keeps the extra width centered
            opacity: 0.1 + (0.9 * progress),
            scale: 0.95 + (0.05 * progress)
          })

          // Subtly parallax top content
          gsap.set(topContentRef.current, {
            y: `${-15 * (1 - progress)}%`,
            opacity: 0.5 + (0.5 * progress)
          })
        },
      })

      return () => {
        trigger.kill()
      }
    },
    { dependencies: [isMobile] }
  )

  return (
    <footer ref={footerRef} className="footer-root relative w-full overflow-hidden bg-[#06040a] min-h-[500px]">

      {/* 
        This is the sliding layer. It starts shifted UP (-40%) and hidden behind the main page layout 
        which has z-index: 1. As the user scrolls, it translates down to 0%, sliding into view.
      */}
      <div
        ref={footerInnerRef}
        className="relative w-full h-full min-h-[500px] flex flex-col justify-between pt-16"
        style={{ transform: isMobile ? 'none' : 'translateY(-40%)' }}
      >

        {/* Glows specifically for the sliding block */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none z-0" />
        <div style={{ position: 'absolute', top: 0, left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Top Content Row */}
        <div ref={topContentRef} className="w-full flex flex-col md:flex-row justify-between items-start gap-16 md:gap-8 max-w-7xl mx-auto px-6 lg:px-12 relative z-10">

          {/* Left: Description & Contact */}
          <div className="flex flex-col gap-6 max-w-sm">
            <h2 className="text-xl md:text-2xl font-semibold text-white/90 leading-snug">
              Secure the future of your codebase with our AI-powered analytics.
            </h2>
            <div className="flex flex-col gap-4 mt-2">
              <a href="mailto:support@vibeaudit.dev" className="text-sm text-purple-200/50 hover:text-white transition-colors w-fit interactive-hover flex items-center gap-2">
                <MdEmail size={18} /> support@vibeaudit.dev
              </a>
              <div className="flex gap-4">
                {[
                  { icon: FaInstagram, href: 'https://instagram.com' },
                  { icon: FaYoutube, href: 'https://youtube.com' },
                  { icon: FaLinkedin, href: 'https://linkedin.com' }
                ].map((Social, i) => (
                  <a
                    key={i}
                    href={Social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-purple-500/5 border border-purple-500/20 flex items-center justify-center text-purple-200/50 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all duration-300 interactive-hover"
                  >
                    <Social.icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Link Grid */}
          <div className="flex flex-col md:flex-row gap-12 md:gap-24 pl-0 md:pl-12">
            {/* Column 1 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-white/90 mb-2 tracking-wide">Product</h3>
              {['Secret Detection', 'Dependency Audit', 'PII / GDPR Scan', 'Prompt Injection Scan'].map(link => (
                <a key={link} href="#" className="text-sm text-purple-200/50 hover:text-purple-300 transition-colors w-fit interactive-hover group relative">
                  {link}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-purple-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-white/90 mb-2 tracking-wide">Company</h3>
              {['About us', 'Careers', 'Contact', 'Blog'].map(link => (
                <a key={link} href="#" className="text-sm text-purple-200/50 hover:text-purple-300 transition-colors w-fit interactive-hover group relative">
                  {link}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-purple-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Space pushed by flex-between */}
        <div className="flex-1 min-h-[150px] md:min-h-[200px]" />

        {/* Massive Animated Background Text */}
        <div className="relative w-full flex justify-center items-end pointer-events-none mt-auto overflow-hidden" style={{ minHeight: '27vw' }}>
          <div
            ref={bigTextRef}
            className="absolute bottom-8 md:bottom-12 left-0 w-[105vw] flex justify-center items-end"
            style={{
              transform: isMobile ? 'none' : 'translateY(-60%) translateX(-2.5vw)',
              opacity: isMobile ? 1 : 0
            }}
          >
            <span
              className="font-black leading-none text-center w-full"
              style={{
                fontSize: '25.2vw',
                letterSpacing: '-0.06em',
                background: 'linear-gradient(to bottom, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.01) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                userSelect: 'none',
                display: 'block',
                lineHeight: 0.72
              }}
            >
              VIBEAUDIT
            </span>
          </div>
        </div>

        {/* Bottom Bar - Absolute positioned at the very bottom over everything */}
        <div className="absolute bottom-6 left-0 w-full px-6 lg:px-12 z-20">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 text-[10px] md:text-[11px] font-mono font-medium tracking-[0.05em] text-purple-200/40 w-full max-w-7xl mx-auto border-t border-purple-500/10 pt-6">

            {/* Bottom Left Group */}
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <span className="text-white/60">© VIBEAUDIT.DEV</span>
              <a href="#" className="hover:text-purple-300 transition-colors interactive-hover">PRIVACY POLICY</a>
              <a href="#" className="hover:text-purple-300 transition-colors interactive-hover">TERMS & CONDITIONS</a>
            </div>

            {/* Bottom Right Group */}
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <a href="#" className="hover:text-purple-300 transition-colors interactive-hover">INSTAGRAM</a>
              <a href="#" className="hover:text-purple-300 transition-colors interactive-hover">LINKEDIN</a>
              <a href="#" className="hover:text-purple-300 transition-colors interactive-hover">X(TWITTER)</a>
              <span className="flex items-center gap-1.5 opacity-60 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span> OPERATIONAL
              </span>
            </div>

          </div>
        </div>

      </div>

    </footer>
  )
}
