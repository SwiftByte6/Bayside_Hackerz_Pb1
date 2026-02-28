import Link from "next/link";
import React from "react";

const Button = ({ text, href, variant = "main" }) => {
  const baseStyles = {
    padding: '14px 28px',
    fontWeight: 600,
    fontSize: '14px',
    borderRadius: '40px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    textDecoration: 'none',
    cursor: 'pointer',
    marginTop: '16px',
  };

  const variants = {
    main: {
      color: 'white',
      background: 'linear-gradient(135deg, #1a1025 0%, #0d0a12 100%)',
      border: '1px solid rgba(139, 92, 246, 0.5)',
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
    },
    hollow: {
      backgroundColor: 'transparent',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
  };

  return (
    <Link href={href} style={{ ...baseStyles, ...variants[variant] }}>
      {text}
    </Link>
  );
};

export default Button;