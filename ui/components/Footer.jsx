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
  const contentRef = useRef(null)

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
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress
          gsap.set(contentRef.current, {
            y: `${-45 * (1 - progress)}%`,
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
    <footer ref={footerRef} className="footer-root">
      {/* Background with subtle glow */}
      <div className="absolute inset-0 bg-[#06040a]" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div style={{ position: 'absolute', top: 0, left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div
        ref={contentRef}
        className="footer-content relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-between h-full py-16"
        style={{ transform: isMobile ? 'none' : 'translateY(-45%)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 border-b border-purple-500/10 pb-16">

          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ background: 'linear-gradient(135deg, #ffffff 0%, rgba(167,139,250,0.9) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                VibeAudit<span className="text-purple-500">.</span>
              </h2>
              <div className="inline-flex mt-3 items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a78bfa]"></span>
                <span className="text-[10px] font-bold text-purple-300 tracking-[0.15em] font-mono">AI PIPELINE SCANNER</span>
              </div>
            </div>
            <p className="text-sm text-purple-200/50 leading-relaxed max-w-sm">
              Production-grade AI code scanner detecting secrets, vulnerable dependencies, prompt-injection risks, and PII compliance gaps directly in your repositories.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white tracking-[0.15em] mb-2 font-mono">PRODUCT</h3>
            {['Secret Detection', 'Dependency Audit', 'PII / GDPR Scan', 'Prompt Injection Scan'].map(link => (
              <a key={link} href="#" className="text-sm text-purple-200/50 hover:text-purple-300 transition-colors w-fit interactive-hover group flex items-center gap-2">
                <span className="w-0 group-hover:w-2 h-[1px] bg-purple-500 transition-all duration-300"></span>
                {link}
              </a>
            ))}
          </div>

          {/* Contact & Socials */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white tracking-[0.15em] mb-2 font-mono">CONNECT</h3>
            <p className="text-sm text-purple-200/50">For product demos, onboarding, or enterprise setup.</p>
            <a href="mailto:support@vibeaudit.dev" className="text-sm text-purple-300 hover:text-white transition-colors w-fit inline-flex items-center gap-2 mt-1 interactive-hover border-b border-purple-500/30 pb-0.5">
              <MdEmail size={16} /> support@vibeaudit.dev
            </a>

            {/* Social Icons */}
            <div className="flex gap-4 mt-6">
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
                  className="w-10 h-10 rounded-full bg-purple-500/5 border border-purple-500/20 flex items-center justify-center text-purple-200/50 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all duration-300 interactive-hover"
                >
                  <Social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
          <span className="text-xs text-purple-200/40">© 2026 VibeAudit. All rights reserved.</span>
          <div className="flex items-center gap-6 text-xs text-purple-200/40">
            <a href="#" className="hover:text-purple-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-purple-300 transition-colors">Terms of Service</a>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono">
              <span className="w-1 h-1 rounded-full bg-green-500"></span> Operational
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-root {
          position: relative;
          background: #06040a;
          color: white;
          overflow: hidden;
        }
      `}</style>
    </footer>
  )
}
