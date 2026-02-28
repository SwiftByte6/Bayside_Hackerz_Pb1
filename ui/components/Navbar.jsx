'use client'

import React, { useState } from 'react'
import Link from 'next/link'

const Navbar = () => {
  const [activeTab, setActiveTab] = useState('Home')
  
  const navItems = ['Home', 'Upload', 'Pricing', 'Agent']

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
      <Link href="/" style={{
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
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '9999px',
        padding: '6px 8px',
        border: '1px solid rgba(75, 85, 99, 0.5)',
      }}>
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setActiveTab(item)}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === item ? 'rgba(75, 85, 99, 0.8)' : 'transparent',
              color: activeTab === item ? 'white' : 'rgba(156, 163, 175, 1)',
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Navbar
