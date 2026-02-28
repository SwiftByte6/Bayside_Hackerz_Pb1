'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('Home')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })
  const navRefs = useRef({})

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Upload', id: 'upload' },
    { label: 'Pricing', id: 'pricing' },
  ]

  const updateIndicator = (tabLabel) => {
    const activeButton = navRefs.current[tabLabel]

    if (!activeButton) {
      return
    }

    setIndicatorStyle({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
      opacity: 1,
    })
  }

  const scrollToSection = (sectionId, tabLabel) => {
    const section = document.getElementById(sectionId)

    if (!section) {
      return
    }

    const navbarOffset = 92
    const top = section.getBoundingClientRect().top + window.scrollY - navbarOffset

    window.scrollTo({ top, behavior: 'smooth' })
    setActiveTab(tabLabel)
  }

  const handleNavClick = (item) => {
    setActiveTab(item.label)

    if (pathname !== '/') {
      router.push(`/#${item.id}`)
      return
    }

    scrollToSection(item.id, item.label)
  }

  useEffect(() => {
    const handleHashNavigation = () => {
      if (pathname !== '/') {
        return
      }

      const hash = window.location.hash.replace('#', '')
      if (!hash) {
        return
      }

      const matchingItem = navItems.find(item => item.id === hash)
      if (matchingItem) {
        setTimeout(() => {
          scrollToSection(matchingItem.id, matchingItem.label)
        }, 0)
      }
    }

    handleHashNavigation()
  }, [pathname])

  useEffect(() => {
    const syncActiveTabWithScroll = () => {
      if (pathname !== '/') {
        return
      }

      const offset = 120
      let currentTab = 'Home'

      for (const item of navItems) {
        const section = document.getElementById(item.id)
        if (!section) {
          continue
        }

        const sectionTop = section.offsetTop - offset
        if (window.scrollY >= sectionTop) {
          currentTab = item.label
        }
      }

      setActiveTab(currentTab)
    }

    syncActiveTabWithScroll()
    window.addEventListener('scroll', syncActiveTabWithScroll)

    return () => window.removeEventListener('scroll', syncActiveTabWithScroll)
  }, [pathname])

  useEffect(() => {
    updateIndicator(activeTab)

    const handleResize = () => updateIndicator(activeTab)
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      backgroundColor: 'transparent',
    }}>
      {/* Logo */}
      <Link href="/" className="nav-link-hover" style={{
        color: 'white',
        fontSize: '20px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textDecoration: 'none',
      }}>
        Vibefy
      </Link>
      
      {/* Nav Items */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        position: 'relative',
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '9999px',
        padding: '6px 8px',
        border: '1px solid rgba(75, 85, 99, 0.5)',
      }}>
        <div
          style={{
            position: 'absolute',
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            top: '6px',
            bottom: '6px',
            opacity: indicatorStyle.opacity,
            borderRadius: '9999px',
            backgroundColor: 'rgba(75, 85, 99, 0.8)',
            transition: 'left 0.3s ease, width 0.3s ease, opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        />
        {navItems.map((item) => (
          <button
            key={item.label}
            ref={element => {
              if (!element) {
                return
              }

              navRefs.current[item.label] = element
            }}
            onClick={() => handleNavClick(item)}
            className="interactive-hover"
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: activeTab === item.label ? 'white' : 'rgba(156, 163, 175, 1)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Navbar
