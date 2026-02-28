'use client';

export default function SecurityTicker() {
    const items = [
        '🔒 SECRET DETECTION', '⚡ PROMPT INJECTION SCAN', '📦 DEPENDENCY AUDIT',
        '🛡️ AI SECURITY ANALYSIS', '🔑 API KEY EXPOSURE', '📋 GDPR COMPLIANCE CHECK',
        '🚨 VULNERABILITY REPORT', '🤖 LLM ATTACK VECTORS', '🔒 SECRET DETECTION',
        '⚡ PROMPT INJECTION SCAN', '📦 DEPENDENCY AUDIT', '🛡️ AI SECURITY ANALYSIS',
    ];

    return (
        <div style={{
            width: '100%',
            overflow: 'hidden',
            background: 'linear-gradient(90deg, rgba(109,40,217,0.18), rgba(139,92,246,0.1), rgba(109,40,217,0.18))',
            borderTop: '1px solid rgba(139,92,246,0.25)',
            borderBottom: '1px solid rgba(139,92,246,0.25)',
            padding: '10px 0',
            position: 'relative',
            zIndex: 10,
        }}>
            {/* Fade edges */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, var(--bg-primary, #08060f), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, var(--bg-primary, #08060f), transparent)', zIndex: 2, pointerEvents: 'none' }} />

            <div style={{
                display: 'flex',
                gap: '48px',
                animation: 'ticker-scroll 28s linear infinite',
                width: 'max-content',
            }}>
                {[...items, ...items].map((item, i) => (
                    <span key={i} style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? 'rgba(200,180,255,0.5)' : '#7c3aed',
                        whiteSpace: 'nowrap',
                    }}>{item}</span>
                ))}
            </div>

            <style>{`
                @keyframes ticker-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
