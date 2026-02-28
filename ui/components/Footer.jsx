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
      <div className="absolute inset-0 bg-black" />

      <div
        ref={contentRef}
        className="footer-content"
        style={{ transform: isMobile ? 'none' : 'translateY(-45%)' }}
      >
        <div className="footer-row">
          <div>
            <h2 className="title text-[3rem] md:text-[4rem]">VIBE-AUDIT</h2>
            <p className="tag">AI Production Readiness Scanner</p>
            <p className="meta">
              Audit AI-generated repositories for secrets, <br />
              vulnerable dependencies, prompt-injection risks, <br />
              and PII / compliance gaps.
            </p>
          </div>

          <div>
            <h3>PRODUCT</h3>
            <p>Secret Detection</p>
            <p>Dependency Audit</p>
            <p>PII / GDPR Scan</p>
            <p>Prompt Injection Scan</p>
          </div>

          <div>
            <h3>CONTACT</h3>
            <p>Email: support@vibeaudit.dev</p>
            <p>For product demos & onboarding</p>
            <p>Response time: within 24 hours</p>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                  className="hover:opacity-100 transition-opacity interactive-hover"
              >
                <FaInstagram size={22} color="rgba(255,255,255,0.6)" />
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                  className="hover:opacity-100 transition-opacity interactive-hover"
              >
                <FaYoutube size={26} color="rgba(255,255,255,0.6)" />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                  className="hover:opacity-100 transition-opacity interactive-hover"
              >
                <FaLinkedin size={22} color="rgba(255,255,255,0.6)" />
              </a>

              <a href="mailto:support@vibeaudit.dev" aria-label="Email" className="hover:opacity-100 transition-opacity interactive-hover">
                <MdEmail size={24} color="rgba(255,255,255,0.6)" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Vibe-Audit. All rights reserved.</span>
          <span>Built for secure AI-assisted development</span>
        </div>
      </div>

      <style jsx>{`
        .footer-root {
          position: relative;
          height: 75svh;
          background: black;
          color: white;
          overflow: hidden;
        }

        .footer-content {
          position: relative;
          z-index: 3;
          height: 100%;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .footer-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 2rem;
        }

        .title {
          font-weight: 900;
        }

        .tag {
          opacity: 0.8;
        }

        .meta {
          opacity: 0.6;
          font-size: 0.85rem;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          opacity: 0.6;
        }
      `}</style>
    </footer>
  )
}
