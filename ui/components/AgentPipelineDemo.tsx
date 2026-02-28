'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const AGENTS = [
    { id: 'david', name: 'David', role: 'Analytics', color: '#a78bfa', avatar: '/david.png', logs: ['Parsing repository structure...', 'Indexing 247 source files', 'Running static analysis...', 'Found 3 hardcoded secrets', 'Detected 12 suspicious patterns'] },
    { id: 'eva', name: 'Eva', role: 'Security', color: '#ff2d55', avatar: '/eva.png', logs: ['Scanning for API keys & tokens...', '🔴 CRITICAL: AWS_SECRET_KEY exposed', '🔴 CRITICAL: OpenAI key in .env', '⚠️ HIGH: SQL injection risk found', 'Flagging 7 vulnerable dependencies'] },
    { id: 'ben', name: 'Ben', role: 'Compliance', color: '#00d9ff', avatar: '/ben.png', logs: ['Checking GDPR requirements...', '⚠️ PII data logged without masking', 'Scanning SOC2 compliance gaps...', '❌ No data retention policy found', 'Checking OWASP Top 10...'] },
    { id: 'austin', name: 'Austin', role: 'Report', color: '#ff9500', avatar: '/austin.png', logs: ['Compiling scan results...', 'Calculating Vibe Score...', 'Generating remediation prompts...', 'Building executive summary...', '✅ Report ready — Score: 42/100'] },
];

const FINDINGS = [
    { severity: 'CRITICAL', icon: '🔴', label: 'AWS Secret Key', file: '.env:14' },
    { severity: 'CRITICAL', icon: '🔴', label: 'OpenAI API Key', file: 'config.js:3' },
    { severity: 'HIGH', icon: '🟠', label: 'SQL Injection', file: 'db/query.js:89' },
    { severity: 'HIGH', icon: '🟠', label: 'PII Logging', file: 'middleware/log.js:22' },
    { severity: 'MEDIUM', icon: '🟡', label: 'No Rate Limiting', file: 'routes/api.js:5' },
];

const DEMO_URL = 'github.com/user/my-ai-app';

function severityColor(s: string) {
    return s === 'CRITICAL' ? '#ff2d55' : s === 'HIGH' ? '#ff9500' : '#ffd600';
}

export default function AgentPipelineDemo() {
    const [phase, setPhase] = useState<'input' | 'running' | 'results'>('input');
    const [typedUrl, setTypedUrl] = useState('');
    const [activeAgent, setActiveAgent] = useState(-1);
    const [agentProgress, setAgentProgress] = useState(0);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);
    const [completedAgents, setCompletedAgents] = useState<number[]>([]);
    const [shownFindings, setShownFindings] = useState(0);
    const [score, setScore] = useState(0);
    const timers = useRef<number[]>([]);

    const schedule = (fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms);
        timers.current.push(id);
    };

    const cancelAll = () => {
        timers.current.forEach(id => window.clearTimeout(id));
        timers.current = [];
    };

    const startDemo = useCallback(() => {
        cancelAll();
        setPhase('input');
        setTypedUrl('');
        setActiveAgent(-1);
        setAgentProgress(0);
        setAgentLogs([]);
        setCompletedAgents([]);
        setShownFindings(0);
        setScore(0);

        // Type URL
        for (let i = 0; i <= DEMO_URL.length; i++) {
            schedule(() => setTypedUrl(DEMO_URL.slice(0, i)), 600 + i * 60);
        }
        const afterType = 600 + DEMO_URL.length * 60 + 800;

        // Run agents sequentially
        let offset = afterType;
        AGENTS.forEach((agent, agentIdx) => {
            const agentStart = offset;
            schedule(() => {
                setPhase('running');
                setActiveAgent(agentIdx);
                setAgentProgress(0);
                setAgentLogs([]);
            }, agentStart);

            // Progress ticks
            const totalDuration = agent.logs.length * 500 + 600;
            const ticks = 20;
            for (let t = 1; t <= ticks; t++) {
                const p = Math.min(100, Math.round((t / ticks) * 100));
                schedule(() => setAgentProgress(p), agentStart + (t * totalDuration) / ticks);
            }

            // Logs
            agent.logs.forEach((log, li) => {
                schedule(() => setAgentLogs(prev => [...prev, log]), agentStart + 200 + li * 500);
            });

            // Mark complete
            offset = agentStart + totalDuration + 400;
            const completeAt = offset - 400;
            schedule(() => setCompletedAgents(prev => [...prev, agentIdx]), completeAt);
        });

        // Results phase
        schedule(() => {
            setPhase('results');
            setActiveAgent(-1);
        }, offset);

        FINDINGS.forEach((_, fi) => {
            schedule(() => setShownFindings(fi + 1), offset + fi * 350);
        });

        // Score count up
        for (let s = 2; s <= 42; s += 2) {
            schedule(() => setScore(s), offset + 400 + (s / 2) * 30);
        }

        // Loop
        const loopAt = offset + FINDINGS.length * 350 + 3000;
        schedule(startDemo, loopAt);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        startDemo();
        return cancelAll;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeColor = activeAgent >= 0 && activeAgent < AGENTS.length ? AGENTS[activeAgent].color : '#a78bfa';

    return (
        <div style={{ width: '100%', height: '100%', background: '#08060f', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#e2d9f3', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(139,92,246,0.07)', borderBottom: '1px solid rgba(139,92,246,0.15)', flexShrink: 0 }}>
                <span style={{ color: '#a78bfa', fontWeight: 700, letterSpacing: '0.1em', fontSize: 10 }}>⚡ VIBEAUDIT AGENT PIPELINE</span>
                <div style={{ display: 'flex', gap: 6 }}>
                    {AGENTS.map((a, i) => (
                        <div key={a.id} style={{
                            width: 26, height: 26, borderRadius: '50%', overflow: 'hidden',
                            border: `2px solid ${completedAgents.includes(i) ? a.color : activeAgent === i ? a.color : 'rgba(255,255,255,0.1)'}`,
                            opacity: activeAgent === i || completedAgents.includes(i) ? 1 : 0.3,
                            transition: 'all 0.4s ease',
                            boxShadow: activeAgent === i ? `0 0 12px ${a.color}` : 'none',
                        }}>
                            <img src={a.avatar} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

                {/* Left: terminal */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 8, minWidth: 0 }}>

                    {/* URL input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', flexShrink: 0 }}>
                        <span style={{ color: '#a78bfa', fontSize: 10 }}>$</span>
                        <span style={{ color: phase === 'input' ? '#fff' : 'rgba(200,180,255,0.5)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                            {typedUrl || '\u00a0'}
                            {phase === 'input' && typedUrl.length < DEMO_URL.length && (
                                <span style={{ display: 'inline-block', width: 6, height: 12, background: '#a78bfa', marginLeft: 1, animation: 'blink 0.7s step-end infinite', verticalAlign: 'text-bottom' }} />
                            )}
                        </span>
                        {phase !== 'input' && (
                            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,230,118,0.12)', color: '#00e676', flexShrink: 0 }}>✓ QUEUED</span>
                        )}
                    </div>

                    {/* Agent area */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {phase === 'input' ? (
                            <div style={{ color: 'rgba(139,92,246,0.35)', fontSize: 10, textAlign: 'center', marginTop: 16 }}>Enter a repository URL to begin scan...</div>
                        ) : (
                            <>
                                {/* Active agent row */}
                                {activeAgent >= 0 && activeAgent < AGENTS.length && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        <img src={AGENTS[activeAgent].avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${activeColor}`, flexShrink: 0 }} />
                                        <span style={{ color: activeColor, fontWeight: 700, fontSize: 10 }}>{AGENTS[activeAgent].name}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>({AGENTS[activeAgent].role})</span>
                                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginLeft: 'auto' }}>running...</span>
                                    </div>
                                )}

                                {/* Progress bar */}
                                {phase === 'running' && (
                                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', flexShrink: 0, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 99, background: activeColor, width: `${agentProgress}%`, transition: 'width 0.25s ease', boxShadow: `0 0 8px ${activeColor}` }} />
                                    </div>
                                )}

                                {/* Logs */}
                                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {agentLogs.slice(-7).map((log, i) => (
                                        <div key={i} style={{
                                            fontSize: 10.5, lineHeight: 1.5,
                                            color: log.startsWith('🔴') ? '#ff2d55' : log.startsWith('⚠️') ? '#ff9500' : log.startsWith('❌') ? '#ff5555' : log.startsWith('✅') ? '#00e676' : 'rgba(220,200,255,0.65)',
                                        }}>{log}</div>
                                    ))}
                                </div>

                                {/* Completed agent pills */}
                                {completedAgents.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
                                        {completedAgents.map(ci => (
                                            <span key={ci} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 99, background: `${AGENTS[ci].color}18`, border: `1px solid ${AGENTS[ci].color}35`, color: AGENTS[ci].color }}>✓ {AGENTS[ci].name}</span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div style={{ width: 1, background: 'rgba(139,92,246,0.1)', flexShrink: 0 }} />

                {/* Right: results */}
                <div style={{ width: 175, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    {phase === 'results' ? (
                        <>
                            <div style={{ textAlign: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                                <div style={{ fontSize: 9, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.1em', marginBottom: 4 }}>VIBE SCORE</div>
                                <div style={{ fontSize: 36, fontWeight: 900, color: '#ff2d55', lineHeight: 1, textShadow: '0 0 24px rgba(255,45,85,0.5)' }}>{score}</div>
                                <div style={{ fontSize: 8, color: 'rgba(255,100,100,0.6)', marginTop: 3 }}>CRITICAL — FIX REQUIRED</div>
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(200,180,255,0.35)', letterSpacing: '0.08em' }}>FINDINGS ({shownFindings})</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, overflow: 'hidden' }}>
                                {FINDINGS.slice(0, shownFindings).map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, background: `${severityColor(f.severity)}0d`, border: `1px solid ${severityColor(f.severity)}28` }}>
                                        <span style={{ fontSize: 11, flexShrink: 0 }}>{f.icon}</span>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 9, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</div>
                                            <div style={{ fontSize: 8, color: 'rgba(200,180,255,0.35)' }}>{f.file}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(139,92,246,0.28)', fontSize: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 28 }}>🛡️</div>
                            Results appear<br />after scan
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
        </div>
    );
}
