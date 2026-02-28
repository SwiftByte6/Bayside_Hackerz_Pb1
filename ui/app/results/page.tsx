'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, AlertTriangle, Lock, Eye, Zap, ChevronDown, ChevronRight,
    Copy, Check, ArrowLeft, FileCode, BarChart2, Activity, BookOpen,
    Bot, Search, TrendingUp, AlertOctagon
} from 'lucide-react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { ScanReport, Issue, FileBreakdown } from '@/lib/api';
import { getReport as getStoredReport, setReport as setStoredReport, getRepoName } from '@/lib/store';
import AgentsPipeline from '@/components/AgentsPipeline';
import ChatBox from '@/components/ChatBox';

type Persona = 'all' | 'dev' | 'security' | 'compliance';
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#ff2d55', HIGH: '#ff9500', MEDIUM: '#ffd600', LOW: '#00e676',
};
const SEVERITY_BG: Record<string, string> = {
    CRITICAL: 'rgba(255,45,85,0.12)', HIGH: 'rgba(255,149,0,0.12)',
    MEDIUM: 'rgba(255,214,0,0.12)', LOW: 'rgba(0,230,118,0.12)',
};

// ─── Smooth Curve Chart ────────────────────────────────────────────────────────
function SmoothCurveChart({ data, labels }: { data: number[]; labels: string[] }) {
    const pathRef = useRef<SVGPathElement>(null);
    const [ready, setReady] = useState(false);
    const W = 500, H = 190, PX = 30, PY = 20;

    const pts = data.map((v, i) => ({
        x: PX + (i / (data.length - 1)) * (W - PX * 2),
        y: PY + (1 - v / 100) * (H - PY * 2),
    }));

    const bezier = () => {
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)], p1 = pts[i];
            const p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
            d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6},` +
                ` ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6},` +
                ` ${p2.x} ${p2.y}`;
        }
        return d;
    };

    const line = bezier();
    const fill = line + ` L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
    const last = pts[pts.length - 1];

    useEffect(() => {
        const p = pathRef.current;
        if (!p) return;
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
        p.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)';
        setTimeout(() => { p.style.strokeDashoffset = '0'; setReady(true); }, 100);
    }, []);

    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
            <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.01" />
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            {[0, 25, 50, 75, 100].map(v => {
                const y = PY + (1 - v / 100) * (H - PY * 2);
                return <line key={v} x1={PX} y1={y} x2={W - PX} y2={y} stroke="rgba(139,92,246,0.1)" strokeWidth="1" strokeDasharray="4 4" />;
            })}
            <path d={fill} fill="url(#fg)" />
            <path ref={pathRef} d={line} fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
            {ready && (
                <>
                    <circle cx={last.x} cy={last.y} r="12" fill="rgba(167,139,250,0.25)" />
                    <circle cx={last.x} cy={last.y} r="7" fill="white" style={{ filter: 'drop-shadow(0 0 10px #a855f7)' }} />
                </>
            )}
            {labels.map((l, i) => (
                <text key={l} x={pts[i]?.x ?? 0} y={H + 6} textAnchor="middle" fill="rgba(200,180,255,0.45)" fontSize="10" fontFamily="JetBrains Mono">{l}</text>
            ))}
        </svg>
    );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimCount({ to, color }: { to: number; color: string }) {
    const [v, setV] = useState(0);
    useEffect(() => {
        let cur = 0;
        const step = () => { cur += Math.ceil((to - cur) / 8) || 1; setV(Math.min(cur, to)); if (cur < to) requestAnimationFrame(step); };
        const t = setTimeout(() => requestAnimationFrame(step), 300);
        return () => clearTimeout(t);
    }, [to]);
    return <span style={{ color, textShadow: `0 0 24px ${color}88`, fontVariantNumeric: 'tabular-nums' }}>{v}</span>;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
    const [d, setD] = useState(0);
    const R = 80, C = 2 * Math.PI * R, prog = (d / 100) * C;
    useEffect(() => {
        let s = 0;
        const step = () => { s += 2; setD(Math.min(s, score)); if (s < score) requestAnimationFrame(step); };
        const t = setTimeout(() => requestAnimationFrame(step), 400);
        return () => clearTimeout(t);
    }, [score]);
    return (
        <div style={{ position: 'relative', width: 200, height: 200 }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="14" strokeLinecap="round" />
                <circle cx="100" cy="100" r={R} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={`${prog} ${C}`} style={{ filter: `drop-shadow(0 0 12px ${color})`, transition: 'stroke-dasharray 0.05s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color, textShadow: `0 0 40px ${color}` }}>{d}</div>
                <div style={{ fontSize: 10, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.15em', marginTop: 4, fontFamily: 'JetBrains Mono' }}>VIBE SCORE</div>
            </div>
        </div>
    );
}

// ─── Issue Card ───────────────────────────────────────────────────────────────
function IssueCard({ issue }: { issue: Issue }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const copy = () => { navigator.clipboard.writeText(`Fix for "${issue.name}":\n\n${issue.remediation}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const sc = SEVERITY_COLORS[issue.severity], sb = SEVERITY_BG[issue.severity];
    return (
        <motion.div layout style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${sc}25`, background: 'rgba(15,8,30,0.7)', marginBottom: 8 }}>
            <div onClick={() => setExpanded(e => !e)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ padding: '3px 10px', borderRadius: 999, background: sb, border: `1px solid ${sc}40`, fontSize: 10, fontWeight: 700, color: sc, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>{issue.severity}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e9d5ff' }}>{issue.name}</span>
                <span style={{ fontSize: 11, color: 'rgba(200,180,255,0.35)', fontFamily: 'JetBrains Mono' }}>{issue.file}{issue.line ? `:${issue.line}` : ''}</span>
                <ChevronDown size={14} color="rgba(200,180,255,0.3)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(139,92,246,0.15)' }}>
                            {issue.snippet && (
                                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', fontFamily: 'JetBrains Mono', fontSize: 12, color: sc, margin: '12px 0', border: `1px solid ${sc}25`, overflowX: 'auto' }}>{issue.snippet}</div>
                            )}
                            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, marginBottom: 6, letterSpacing: '0.1em' }}>AUTO-REMEDIATION</div>
                                <p style={{ fontSize: 13, color: 'rgba(233,213,255,0.7)', lineHeight: 1.6 }}>{issue.remediation}</p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); copy(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: copied ? 'rgba(0,230,118,0.1)' : 'rgba(139,92,246,0.12)', border: `1px solid ${copied ? 'rgba(0,230,118,0.4)' : 'rgba(139,92,246,0.35)'}`, borderRadius: 8, cursor: 'pointer', color: copied ? '#00e676' : '#c4b5fd', fontSize: 12, fontWeight: 600 }}>
                                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied!' : 'Copy Fix Prompt'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── File Breakdown ────────────────────────────────────────────────────────────
function FileBreakdownPanel({ files, persona }: { files: FileBreakdown[]; persona: Persona }) {
    const [expandedFile, setExpandedFile] = useState<string | null>(null);
    const filtered = files.map(f => ({ ...f, issues: f.issues.filter(i => persona === 'all' || i.persona?.includes(persona)) })).filter(f => f.issues.length > 0);
    return (
        <div>
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(200,180,255,0.3)', fontSize: 14 }}>No issues for current filter.</div>}
            {filtered.map(f => {
                const sc = SEVERITY_COLORS[f.riskLevel];
                return (
                    <div key={f.file} style={{ marginBottom: 8 }}>
                        <div onClick={() => setExpandedFile(expandedFile === f.file ? null : f.file)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: 'rgba(15,8,30,0.6)', border: `1px solid ${sc}25`, cursor: 'pointer', transition: 'all 0.2s' }}>
                            <FileCode size={14} color={sc} />
                            <span style={{ flex: 1, fontSize: 13, fontFamily: 'JetBrains Mono', color: 'rgba(233,213,255,0.7)' }}>{f.file}</span>
                            <span style={{ padding: '3px 10px', borderRadius: 999, background: SEVERITY_BG[f.riskLevel], border: `1px solid ${sc}40`, fontSize: 10, fontWeight: 700, color: sc, fontFamily: 'JetBrains Mono' }}>{f.issues.length} issues</span>
                            <ChevronRight size={14} color="rgba(200,180,255,0.3)" style={{ transform: expandedFile === f.file ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                        <AnimatePresence>
                            {expandedFile === f.file && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', paddingLeft: 12, marginTop: 4 }}>
                                    {f.issues.map((issue, idx) => <IssueCard key={idx} issue={issue} />)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Remediation Card ──────────────────────────────────────────────────────────
function RemediationCard({ recommendation, index }: { recommendation: any; index: number }) {
    const [copied, setCopied] = useState(false);
    const prompt = `Issue #${index}: ${recommendation.name}\nSeverity: ${recommendation.severity}\nOccurrences: ${recommendation.occurrences}\n\nFix required:\n${recommendation.remediation}\n\nPlease provide:\n1. The corrected code snippet\n2. The exact change to make\n3. Additional security hardening recommendations`;
    const copy = () => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const sc = SEVERITY_COLORS[recommendation.severity];
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${sc}25`, background: 'rgba(15,8,30,0.7)' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: SEVERITY_BG[recommendation.severity], border: `1px solid ${sc}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: sc, fontFamily: 'JetBrains Mono' }}>{index}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#e9d5ff' }}>{recommendation.name}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 999, background: SEVERITY_BG[recommendation.severity], border: `1px solid ${sc}40`, fontSize: 10, fontWeight: 700, color: sc, fontFamily: 'JetBrains Mono' }}>{recommendation.severity}</span>
                        <span style={{ fontSize: 11, color: 'rgba(200,180,255,0.35)', fontFamily: 'JetBrains Mono' }}>×{recommendation.occurrences}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(233,213,255,0.6)', lineHeight: 1.7, marginBottom: 12 }}>{recommendation.remediation}</p>
                    <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: copied ? 'rgba(0,230,118,0.1)' : 'rgba(139,92,246,0.12)', border: `1px solid ${copied ? 'rgba(0,230,118,0.4)' : 'rgba(139,92,246,0.35)'}`, borderRadius: 8, cursor: 'pointer', color: copied ? '#00e676' : '#c4b5fd', fontSize: 12, fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                        {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied!' : 'Copy AI Fix Prompt'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Glass Card Helper ─────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'rgba(15,8,30,0.72)',
    border: '1px solid rgba(139,92,246,0.22)',
    borderRadius: 18,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 40px rgba(139,92,246,0.08), 0 8px 32px rgba(0,0,0,0.4)',
    ...extra,
});

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
    const router = useRouter();
    const [report, setReport] = useState<ScanReport | null>(null);
    const [persona, setPersona] = useState<Persona>('all');
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'issues' | 'remedy' | 'agents'>('overview');

    useEffect(() => {
        const stored = getStoredReport();
        if (stored) setReport(stored);
        else router.push('/');
    }, [router]);

    if (!report) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08060f' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '3px solid transparent', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <div style={{ color: 'rgba(200,180,255,0.5)', fontSize: 14 }}>Loading report...</div>
            </div>
        </div>
    );

    const { score, summary, categories, fileBreakdown, allIssues } = report;
    const filteredIssues = allIssues.filter(i => persona === 'all' || i.persona?.includes(persona));
    const sortedIssues = [...filteredIssues].sort((a, b) => (SEVERITY_ORDER[a.severity] || 3) - (SEVERITY_ORDER[b.severity] || 3));
    const radarData = [
        { subject: 'Secrets', value: score.categoryScores.secrets },
        { subject: 'Deps', value: score.categoryScores.dependencies },
        { subject: 'PII', value: score.categoryScores.pii },
        { subject: 'AI Sec', value: score.categoryScores.promptInjection },
    ];

    const tabs = [
        { id: 'overview' as const, label: 'Overview', icon: Activity },
        { id: 'files' as const, label: 'Files', icon: FileCode },
        { id: 'issues' as const, label: `Issues (${sortedIssues.length})`, icon: AlertOctagon },
        { id: 'remedy' as const, label: 'Remediation', icon: BookOpen },
        { id: 'agents' as const, label: 'AI Agents', icon: Bot },
    ];

    const personaConfig = [
        { id: 'all' as Persona, label: 'All' },
        { id: 'dev' as Persona, label: '👨‍💻 Dev' },
        { id: 'security' as Persona, label: '🔒 Security' },
        { id: 'compliance' as Persona, label: '📋 Compliance' },
    ];

    return (
        <main style={{ minHeight: '100vh', background: '#08060f', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient orbs */}
            <div style={{ position: 'fixed', top: '-20%', left: '30%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* ── Header ── */}
            <header style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: 'rgba(8,6,15,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 1px 0 rgba(139,92,246,0.12), 0 8px 32px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, cursor: 'pointer', color: 'rgba(200,180,255,0.7)', fontSize: 13, fontWeight: 500, transition: 'all 0.2s', fontFamily: 'Space Grotesk' }}>
                        <ArrowLeft size={15} /> Back
                    </button>
                    <div style={{ width: 1, height: 22, background: 'rgba(139,92,246,0.2)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}>
                            <Shield size={17} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg,#e9d5ff 30%,#a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>VibeAudit</div>
                            <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.35)', fontFamily: 'JetBrains Mono', marginTop: 1 }}>{report.repoName}</div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: `${score.color}18`, border: `1px solid ${score.color}50` }}>
                        <span style={{ fontSize: 18 }}>{score.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: score.color, letterSpacing: '0.05em', textShadow: `0 0 16px ${score.color}` }}>{score.label}</span>
                        <span style={{ fontSize: 11, color: `${score.color}aa`, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{score.verdict}</span>
                    </div>
                </div>
            </header>

            <div style={{ position: 'relative', zIndex: 1, padding: '32px', maxWidth: 1280, margin: '0 auto' }}>

                {/* ── Hero Score Row ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Score Ring */}
                    <div style={{ ...card({ padding: 28, textAlign: 'center' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <ScoreRing score={score.score} color={score.color} />
                        <div style={{ width: '100%' }}>
                            <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.35)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', marginBottom: 6 }}>SCAN SUMMARY</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(200,180,255,0.5)' }}>
                                <span>{summary.totalFiles} files</span>
                                <span>{summary.totalIssues} issues</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat cards + Category bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                            {[
                                { label: 'Critical', value: summary.critical, color: '#ff2d55', icon: AlertOctagon },
                                { label: 'High', value: summary.high, color: '#ff9500', icon: AlertTriangle },
                                { label: 'Medium', value: summary.medium, color: '#ffd600', icon: Search },
                                { label: 'Low', value: summary.low, color: '#00e676', icon: TrendingUp },
                            ].map((s, i) => (
                                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    style={{ ...card({ padding: '18px 16px' }), textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
                                    <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, marginBottom: 4 }}>
                                        <AnimCount to={s.value} color={s.color} />
                                    </div>
                                    <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono' }}>{s.label.toUpperCase()}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Category score bars */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...card({ padding: 20 }), flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.12em', marginBottom: 14, fontFamily: 'JetBrains Mono' }}>CATEGORY SCORES</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                                {[
                                    { label: '🔑 Secrets', val: score.categoryScores.secrets },
                                    { label: '📦 Dependencies', val: score.categoryScores.dependencies },
                                    { label: '🔒 PII / GDPR', val: score.categoryScores.pii },
                                    { label: '⚡ AI Security', val: score.categoryScores.promptInjection },
                                ].map(cat => {
                                    const c = cat.val >= 70 ? '#00e676' : cat.val >= 40 ? '#ff9500' : '#ff2d55';
                                    return (
                                        <div key={cat.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(233,213,255,0.75)' }}>{cat.label}</span>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: c, fontFamily: 'JetBrains Mono' }}>{cat.val}</span>
                                            </div>
                                            <div style={{ height: 5, borderRadius: 4, background: 'rgba(139,92,246,0.12)' }}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${cat.val}%` }} transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
                                                    style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${c}88, ${c})`, boxShadow: `0 0 8px ${c}66` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ── Persona Filter ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'rgba(200,180,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginRight: 4 }}>VIEW AS</span>
                    {personaConfig.map(p => (
                        <button key={p.id} onClick={() => setPersona(p.id)} style={{ padding: '6px 18px', borderRadius: 999, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 12, transition: 'all 0.2s', background: persona === p.id ? 'rgba(139,92,246,0.22)' : 'transparent', border: `1px solid ${persona === p.id ? 'rgba(167,139,250,0.55)' : 'rgba(139,92,246,0.18)'}`, color: persona === p.id ? '#e9d5ff' : 'rgba(200,180,255,0.38)', boxShadow: persona === p.id ? '0 0 14px rgba(139,92,246,0.3)' : 'none' }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', gap: 2, padding: 4, background: 'rgba(20,10,40,0.8)', borderRadius: 14, marginBottom: 24, width: 'fit-content', border: '1px solid rgba(139,92,246,0.18)' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 20px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: active ? 'linear-gradient(135deg,rgba(139,92,246,0.35),rgba(109,40,217,0.45))' : 'transparent', color: active ? '#e9d5ff' : 'rgba(200,180,255,0.38)', boxShadow: active ? '0 0 20px rgba(139,92,246,0.25), inset 0 0 0 1px rgba(167,139,250,0.35)' : 'none' }}>
                                <Icon size={14} />{tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">
                    {/* Overview */}
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                {/* Radar */}
                                <div style={card({ padding: 24 })}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.12em', marginBottom: 16, fontFamily: 'JetBrains Mono' }}>CATEGORY RADAR</div>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="rgba(139,92,246,0.15)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(200,180,255,0.45)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                                            <Radar name="Score" dataKey="value" stroke="#a78bfa" fill="#7c3aed" fillOpacity={0.2} dot={{ fill: '#a78bfa', r: 4 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Curve Chart */}
                                <div style={card({ padding: 24, background: 'rgba(10,5,22,0.88)' })}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.12em', marginBottom: 4, fontFamily: 'JetBrains Mono' }}>SECURITY SCORE TREND</div>
                                    <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.25)', marginBottom: 16, fontFamily: 'JetBrains Mono' }}>Scores across scan dimensions</div>
                                    <div style={{ height: 210 }}>
                                        <SmoothCurveChart
                                            data={[score.categoryScores.secrets, score.categoryScores.pii, score.categoryScores.dependencies, score.categoryScores.promptInjection, score.score]}
                                            labels={['Secrets', 'PII', 'Deps', 'AI Sec', 'Overall']}
                                        />
                                    </div>
                                </div>

                                {/* Category breakdown */}
                                <div style={{ ...card({ padding: 24 }), gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.12em', marginBottom: 18, fontFamily: 'JetBrains Mono' }}>CATEGORY BREAKDOWN</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                                        {[
                                            { label: 'Secrets', icon: '🔑', count: categories.secrets.count, note: `${categories.secrets.critical || 0} critical`, color: '#ff2d55' },
                                            { label: 'Dependencies', icon: '📦', count: categories.dependencies.count, note: `${categories.dependencies.issues.length} packages`, color: '#ff9500' },
                                            { label: 'PII / GDPR', icon: '🔒', count: categories.pii.count, note: `${categories.pii.gdprIssues} GDPR`, color: '#ffd600' },
                                            { label: 'AI Security', icon: '⚡', count: categories.promptInjection.count, note: `${categories.promptInjection.critical || 0} injections`, color: '#c084fc' },
                                        ].map(cat => (
                                            <div key={cat.label} style={{ padding: 20, borderRadius: 14, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.18)', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${cat.color}15 0%, transparent 70%)` }} />
                                                <div style={{ fontSize: 28, marginBottom: 10 }}>{cat.icon}</div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(233,213,255,0.7)', marginBottom: 4 }}>{cat.label}</div>
                                                <div style={{ fontSize: 36, fontWeight: 900, color: cat.count > 0 ? cat.color : '#00e676', lineHeight: 1, textShadow: `0 0 24px ${cat.count > 0 ? cat.color : '#00e676'}66` }}>{cat.count}</div>
                                                <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.35)', marginTop: 4, fontFamily: 'JetBrains Mono' }}>{cat.note}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Files */}
                    {activeTab === 'files' && (
                        <motion.div key="files" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                {fileBreakdown.map(f => {
                                    const sc = SEVERITY_COLORS[f.riskLevel];
                                    return (
                                        <div key={f.file} title={`${f.file} — ${f.issueCount} issues`} style={{ padding: '8px 14px', borderRadius: 10, background: SEVERITY_BG[f.riskLevel], border: `1px solid ${sc}40`, cursor: 'default', transition: 'all 0.2s', boxShadow: `0 0 12px ${sc}20` }}>
                                            <div style={{ fontSize: 11, color: sc, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{f.issueCount}</div>
                                            <div style={{ fontSize: 10, color: `${sc}99`, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono' }}>{f.file.split('/').pop()}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={card({ padding: 24 })}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.12em', marginBottom: 16, fontFamily: 'JetBrains Mono' }}>FILE BREAKDOWN</div>
                                <FileBreakdownPanel files={fileBreakdown} persona={persona} />
                            </div>
                        </motion.div>
                    )}

                    {/* Issues */}
                    {activeTab === 'issues' && (
                        <motion.div key="issues" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={card({ padding: 24 })}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono' }}>ALL ISSUES ({sortedIssues.length})</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
                                            <span key={s} style={{ padding: '3px 10px', borderRadius: 999, background: SEVERITY_BG[s], border: `1px solid ${SEVERITY_COLORS[s]}35`, fontSize: 10, fontWeight: 700, color: SEVERITY_COLORS[s], fontFamily: 'JetBrains Mono' }}>{s[0]}: {sortedIssues.filter(i => i.severity === s).length}</span>
                                        ))}
                                    </div>
                                </div>
                                {sortedIssues.map((issue, idx) => <IssueCard key={idx} issue={issue} />)}
                                {sortedIssues.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(200,180,255,0.3)' }}>No issues for current filter.</div>}
                            </div>
                        </motion.div>
                    )}

                    {/* Remediation */}
                    {activeTab === 'remedy' && (
                        <motion.div key="remedy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={card({ padding: 24 })}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,180,255,0.4)', letterSpacing: '0.12em', marginBottom: 4, fontFamily: 'JetBrains Mono' }}>AUTO-REMEDIATION PROMPTS</div>
                                <p style={{ fontSize: 12, color: 'rgba(200,180,255,0.3)', marginBottom: 20, fontFamily: 'JetBrains Mono' }}>Copy these prompts into your AI assistant to fix each issue.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {score.recommendations.map((rec, idx) => <RemediationCard key={idx} recommendation={rec} index={idx + 1} />)}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Agents */}
                    {activeTab === 'agents' && (
                        <motion.div key="agents" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <AgentsPipeline report={report} onComplete={(updatedReport) => { setReport(updatedReport); setStoredReport(updatedReport, getRepoName()); }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ChatBox reportSummary={{ repoName: report.repoName, score: report.score, summary: report.summary }} />

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </main>
    );
}
