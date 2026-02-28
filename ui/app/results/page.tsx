'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, AlertTriangle, Lock, Eye, Zap, ChevronDown, ChevronRight,
    Copy, Check, ArrowLeft, FileCode, AlertOctagon, Info
} from 'lucide-react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Cell,
} from 'recharts';
import { ScanReport, Issue, FileBreakdown } from '@/lib/api';
import { getReport as getStoredReport } from '@/lib/store';

type Persona = 'all' | 'dev' | 'security' | 'compliance';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: 'var(--danger)',
    HIGH: 'var(--warning)',
    MEDIUM: 'var(--medium)',
    LOW: 'var(--safe)',
};
const SEVERITY_BG: Record<string, string> = {
    CRITICAL: 'var(--danger-dim)',
    HIGH: 'var(--warning-dim)',
    MEDIUM: 'var(--medium-dim)',
    LOW: 'var(--safe-dim)',
};

// ── Score Gauge ────────────────────────────────────────────────────────────────
function ScoreGauge({ score, color }: { score: number; color: string }) {
    const [displayed, setDisplayed] = useState(0);
    const radius = 90;
    const circumference = Math.PI * radius;
    const progress = (displayed / 100) * circumference;
    const startAngle = -180;

    useEffect(() => {
        let start = 0;
        const step = () => {
            start += 2;
            setDisplayed(Math.min(start, score));
            if (start < score) requestAnimationFrame(step);
        };
        const timeout = setTimeout(() => requestAnimationFrame(step), 400);
        return () => clearTimeout(timeout);
    }, [score]);

    const angle = startAngle + (displayed / 100) * 180;
    const rad = (angle * Math.PI) / 180;
    const needleX = 110 + radius * Math.cos(rad);
    const needleY = 110 + radius * Math.sin(rad);

    return (
        <div style={{ textAlign: 'center' }}>
            <svg width="220" height="130" viewBox="0 0 220 130">
                {/* Background arc */}
                <path
                    d={`M 20 110 A 90 90 0 0 1 200 110`}
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14"
                    strokeLinecap="round"
                />
                {/* Colored progress arc */}
                <path
                    d={`M 20 110 A 90 90 0 0 1 200 110`}
                    fill="none"
                    stroke={color}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${progress} ${circumference}`}
                    style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 0.05s linear' }}
                />
                {/* Zone markers */}
                {[0, 40, 70, 100].map(val => {
                    const a = startAngle + (val / 100) * 180;
                    const r2 = (a * Math.PI) / 180;
                    const x = 110 + 105 * Math.cos(r2);
                    const y = 110 + 105 * Math.sin(r2);
                    return <circle key={val} cx={x} cy={y} r="3" fill="rgba(255,255,255,0.2)" />;
                })}
                {/* Needle */}
                <line
                    x1="110" y1="110"
                    x2={needleX} y2={needleY}
                    stroke={color} strokeWidth="2" strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
                <circle cx="110" cy="110" r="6" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
                {/* Score text */}
                <text x="110" y="100" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="Space Grotesk">
                    {displayed}
                </text>
                <text x="110" y="120" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="Space Grotesk">
                    VIBE-TO-VALUE SCORE
                </text>
                {/* Zone labels */}
                <text x="16" y="128" textAnchor="middle" fill="var(--danger)" fontSize="8" fontFamily="JetBrains Mono">DANGER</text>
                <text x="110" y="128" textAnchor="middle" fill="var(--warning)" fontSize="8" fontFamily="JetBrains Mono">RISKY</text>
                <text x="205" y="128" textAnchor="middle" fill="var(--safe)" fontSize="8" fontFamily="JetBrains Mono">SAFE</text>
            </svg>
        </div>
    );
}

// ── Risk Heatmap ───────────────────────────────────────────────────────────────
function RiskHeatmap({ files }: { files: FileBreakdown[] }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const riskColor = (level: string) => SEVERITY_COLORS[level] || 'var(--text-muted)';
    const riskBg = (level: string) => SEVERITY_BG[level] || 'var(--bg-secondary)';

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {files.map(f => (
                    <motion.div
                        key={f.file}
                        whileHover={{ scale: 1.1 }}
                        onMouseEnter={() => setHovered(f.file)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            width: Math.max(32, Math.min(80, 20 + f.issueCount * 12)),
                            height: 32,
                            borderRadius: 6,
                            background: riskBg(f.riskLevel),
                            border: `1px solid ${riskColor(f.riskLevel)}`,
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: hovered === f.file ? `0 0 12px ${riskColor(f.riskLevel)}` : 'none',
                            transition: 'box-shadow 0.2s',
                        }}
                        title={`${f.file} — ${f.issueCount} issues (${f.riskLevel})`}
                    >
                        <span style={{ fontSize: 10, color: riskColor(f.riskLevel), fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.issueCount}
                        </span>
                    </motion.div>
                ))}
            </div>
            {hovered && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
                >
                    {hovered}
                </motion.div>
            )}
            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(l => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: SEVERITY_BG[l], border: `1px solid ${SEVERITY_COLORS[l]}` }} />
                        <span style={{ fontSize: 10, color: SEVERITY_COLORS[l], fontFamily: 'var(--font-mono)' }}>{l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Issue Card ─────────────────────────────────────────────────────────────────
function IssueCard({ issue }: { issue: Issue }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const copyRemediation = () => {
        navigator.clipboard.writeText(
            `Fix for "${issue.name}" in ${issue.file}${issue.line ? `:${issue.line}` : ''}:\n\n${issue.remediation}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            layout
            style={{
                borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${SEVERITY_BG[issue.severity]}`,
                background: 'rgba(13,13,26,0.6)',
                marginBottom: 8,
            }}
        >
            <div
                onClick={() => setExpanded(e => !e)}
                style={{
                    padding: '10px 14px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 10,
                }}
            >
                <span className={`badge badge-${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{issue.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {issue.file}{issue.line ? `:${issue.line}` : ''}
                </span>
                <ChevronDown
                    size={14} color="var(--text-muted)"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                />
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                            {issue.snippet && (
                                <div style={{
                                    padding: '8px 12px', borderRadius: 6, background: 'var(--bg-primary)',
                                    fontFamily: 'var(--font-mono)', fontSize: 12, color: SEVERITY_COLORS[issue.severity],
                                    margin: '10px 0', overflowX: 'auto', border: '1px solid var(--border)',
                                }}>
                                    {issue.snippet}
                                </div>
                            )}
                            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border)', marginBottom: 10 }}>
                                <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Auto-Remediation Prompt
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{issue.remediation}</p>
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); copyRemediation(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                    background: copied ? 'var(--safe-dim)' : 'var(--cyan-dim)',
                                    border: `1px solid ${copied ? 'var(--safe)' : 'var(--border-cyan)'}`,
                                    borderRadius: 6, cursor: 'pointer',
                                    color: copied ? 'var(--safe)' : 'var(--cyan)', fontSize: 12, fontWeight: 600,
                                }}
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? 'Copied!' : 'Copy Fix Prompt'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── File Breakdown ─────────────────────────────────────────────────────────────
function FileBreakdownPanel({ files, persona }: { files: FileBreakdown[], persona: Persona }) {
    const [expandedFile, setExpandedFile] = useState<string | null>(null);

    const filtered = files.map(f => ({
        ...f,
        issues: f.issues.filter(i => persona === 'all' || i.persona?.includes(persona)),
    })).filter(f => f.issues.length > 0);

    return (
        <div>
            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                    No issues found for current persona filter.
                </div>
            )}
            {filtered.map(f => (
                <div key={f.file} style={{ marginBottom: 8 }}>
                    <div
                        onClick={() => setExpandedFile(expandedFile === f.file ? null : f.file)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                            borderRadius: 8, background: 'var(--bg-glass)', border: `1px solid ${SEVERITY_BG[f.riskLevel] || 'var(--border)'}`,
                            cursor: 'pointer',
                        }}
                    >
                        <FileCode size={14} color={SEVERITY_COLORS[f.riskLevel]} />
                        <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{f.file}</span>
                        <span className={`badge badge-${f.riskLevel.toLowerCase()}`}>{f.issues.length} issues</span>
                        <ChevronRight
                            size={14} color="var(--text-muted)"
                            style={{ transform: expandedFile === f.file ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                        />
                    </div>
                    <AnimatePresence>
                        {expandedFile === f.file && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden', paddingLeft: 12, marginTop: 4 }}
                            >
                                {f.issues.map((issue, idx) => (
                                    <IssueCard key={idx} issue={issue} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}

// ── Main Results Page ──────────────────────────────────────────────────────────
export default function ResultsPage() {
    const router = useRouter();
    const [report, setReport] = useState<ScanReport | null>(null);
    const [persona, setPersona] = useState<Persona>('all');
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'issues' | 'remedy'>('overview');

    useEffect(() => {
        const stored = getStoredReport();
        if (stored) {
            setReport(stored);
        } else {
            router.push('/');
        }
    }, [router]);

    if (!report) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading report...</div>
            </div>
        );
    }

    const { score, summary, categories, fileBreakdown, allIssues } = report;
    const filteredIssues = allIssues.filter(i => persona === 'all' || i.persona?.includes(persona));
    const sortedIssues = [...filteredIssues].sort((a, b) =>
        (SEVERITY_ORDER[a.severity] || 3) - (SEVERITY_ORDER[b.severity] || 3)
    );

    const radarData = [
        { subject: 'Secrets', value: score.categoryScores.secrets },
        { subject: 'Dependencies', value: score.categoryScores.dependencies },
        { subject: 'PII / GDPR', value: score.categoryScores.pii },
        { subject: 'AI Security', value: score.categoryScores.promptInjection },
    ];

    const barData = [
        { name: 'CRITICAL', count: summary.critical, fill: 'var(--danger)' },
        { name: 'HIGH', count: summary.high, fill: 'var(--warning)' },
        { name: 'MEDIUM', count: summary.medium, fill: 'var(--medium)' },
        { name: 'LOW', count: summary.low, fill: 'var(--safe)' },
    ];

    const personaConfig: { id: Persona; label: string; color: string }[] = [
        { id: 'all', label: 'All Issues', color: 'var(--cyan)' },
        { id: 'dev', label: '👨‍💻 Dev', color: '#7c3aed' },
        { id: 'security', label: '🔒 Security', color: 'var(--danger)' },
        { id: 'compliance', label: '📋 Compliance', color: 'var(--warning)' },
    ];

    const tabs: { id: typeof activeTab; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'files', label: 'File Heatmap' },
        { id: 'issues', label: `Issues (${sortedIssues.length})` },
        { id: 'remedy', label: 'Remediation' },
    ];

    return (
        <main style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 32px', borderBottom: '1px solid var(--border)',
                background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(12px)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                        onClick={() => router.push('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={18} color="var(--cyan)" />
                        <span style={{ fontWeight: 700 }}>Vibe<span style={{ color: 'var(--cyan)' }}>Audit</span></span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ {report.repoName}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: score.color, textShadow: `0 0 20px ${score.color}` }}>
                        {score.emoji} {score.label}
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 999, background: score.color + '22', border: `1px solid ${score.color}44`, fontSize: 12, fontWeight: 700, color: score.color }}>
                        {score.verdict}
                    </span>
                </div>
            </div>

            <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
                {/* Top row: Gauge + Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Score Gauge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{ padding: '28px 24px', textAlign: 'center' }}
                    >
                        <ScoreGauge score={score.score} color={score.color} />
                        <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Scanned {summary.totalFiles} files</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{summary.totalIssues} total issues found</div>
                        </div>
                    </motion.div>

                    {/* Summary + Radar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            {[
                                { label: 'Critical', value: summary.critical, color: 'var(--danger)' },
                                { label: 'High', value: summary.high, color: 'var(--warning)' },
                                { label: 'Medium', value: summary.medium, color: 'var(--medium)' },
                                { label: 'Low', value: summary.low, color: 'var(--safe)' },
                            ].map((s, i) => (
                                <motion.div
                                    key={s.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card"
                                    style={{ padding: '16px', textAlign: 'center' }}
                                >
                                    <div style={{ fontSize: 36, fontWeight: 800, color: s.color, textShadow: `0 0 20px ${s.color}` }}>
                                        {s.value}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Category scores */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card"
                            style={{ padding: 20, flex: 1 }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[
                                    { label: '🔑 Secrets', score: score.categoryScores.secrets, icon: Lock },
                                    { label: '📦 Dependencies', score: score.categoryScores.dependencies, icon: AlertTriangle },
                                    { label: '🔒 PII / GDPR', score: score.categoryScores.pii, icon: Eye },
                                    { label: '⚡ AI Security', score: score.categoryScores.promptInjection, icon: Zap },
                                ].map(cat => {
                                    const catColor = cat.score >= 71 ? 'var(--safe)' : cat.score >= 41 ? 'var(--warning)' : 'var(--danger)';
                                    return (
                                        <div key={cat.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 12, fontWeight: 600 }}>{cat.label}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: catColor, fontFamily: 'var(--font-mono)' }}>{cat.score}</span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${cat.score}%` }}
                                                    transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                                                    style={{ height: '100%', borderRadius: 3, background: catColor, boxShadow: `0 0 8px ${catColor}` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Persona Toggle */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}
                >
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>VIEW AS:</span>
                    {personaConfig.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPersona(p.id)}
                            style={{
                                padding: '6px 16px', borderRadius: 999, cursor: 'pointer',
                                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
                                transition: 'all 0.2s',
                                background: persona === p.id ? p.color + '20' : 'transparent',
                                border: `1px solid ${persona === p.id ? p.color : 'var(--border)'}`,
                                color: persona === p.id ? p.color : 'var(--text-muted)',
                                boxShadow: persona === p.id ? `0 0 12px ${p.color}40` : 'none',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </motion.div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: 4, padding: '4px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 20, width: 'fit-content' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                                transition: 'all 0.2s',
                                background: activeTab === tab.id ? 'var(--bg-glass)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text-muted)',
                                boxShadow: activeTab === tab.id ? 'inset 0 0 0 1px var(--border-cyan)' : 'none',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                {/* Radar Chart */}
                                <div className="glass-card" style={{ padding: 24 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>CATEGORY RADAR</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                            <Radar name="Score" dataKey="value" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.15} dot={{ fill: 'var(--cyan)', r: 3 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Bar Chart */}
                                <div className="glass-card" style={{ padding: 24 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>ISSUES BY SEVERITY</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={barData} barSize={28}>
                                            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <ReTooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: 12 }} />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {barData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Category breakdown */}
                                <div className="glass-card" style={{ padding: 24, gridColumn: '1 / -1' }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>CATEGORY BREAKDOWN</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                        {[
                                            { label: 'Secrets', data: categories.secrets, icon: '🔑', note: `${categories.secrets.critical} critical` },
                                            { label: 'Dependencies', data: categories.dependencies, icon: '📦', note: `${categories.dependencies.issues.length} packages affected` },
                                            { label: 'PII / GDPR', data: categories.pii, icon: '🔒', note: `${categories.pii.gdprIssues} GDPR, ${categories.pii.soc2Issues} SOC2` },
                                            { label: 'AI Security', data: categories.promptInjection, icon: '⚡', note: `${categories.promptInjection.critical} injection risks` },
                                        ].map(cat => (
                                            <div key={cat.label} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
                                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{cat.label}</div>
                                                <div style={{ fontSize: 24, fontWeight: 800, color: cat.data.count > 0 ? 'var(--warning)' : 'var(--safe)' }}>
                                                    {cat.data.count}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.note}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'files' && (
                        <motion.div key="files" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="glass-card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>RISK HEATMAP</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Each cell represents a file. Size indicates issue count. Hover for details.</p>
                                <RiskHeatmap files={fileBreakdown} />
                            </div>
                            <div className="glass-card" style={{ padding: 24, marginTop: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>FILE BREAKDOWN</h3>
                                <FileBreakdownPanel files={fileBreakdown} persona={persona} />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'issues' && (
                        <motion.div key="issues" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="glass-card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
                                    ALL ISSUES ({sortedIssues.length}) — {personaConfig.find(p => p.id === persona)?.label} VIEW
                                </h3>
                                {sortedIssues.map((issue, idx) => <IssueCard key={idx} issue={issue} />)}
                                {sortedIssues.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                        No issues for current persona.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'remedy' && (
                        <motion.div key="remedy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="glass-card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>AUTO-REMEDIATION PROMPTS</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                                    Copy these prompts directly into your AI assistant to fix each issue.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {score.recommendations.map((rec, idx) => (
                                        <RemediationCard key={idx} recommendation={rec} index={idx + 1} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

function RemediationCard({ recommendation, index }: { recommendation: any; index: number }) {
    const [copied, setCopied] = useState(false);

    const prompt = `You are a security engineer reviewing an AI-generated codebase.

Issue #${index}: ${recommendation.name}
Severity: ${recommendation.severity}
Occurrences: ${recommendation.occurrences}

Fix required:
${recommendation.remediation}

Please provide:
1. The corrected code snippet
2. The exact change to make
3. Any additional security hardening recommendations`;

    const copy = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const severityColor = SEVERITY_COLORS[recommendation.severity] || 'var(--text-muted)';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
                borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${SEVERITY_BG[recommendation.severity] || 'var(--border)'}`,
                background: 'rgba(13,13,26,0.7)',
            }}
        >
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: SEVERITY_BG[recommendation.severity], border: `1px solid ${severityColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: severityColor, fontFamily: 'var(--font-mono)',
                }}>
                    {index}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{recommendation.name}</span>
                        <span className={`badge badge-${recommendation.severity.toLowerCase()}`}>{recommendation.severity}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>×{recommendation.occurrences}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                        {recommendation.remediation}
                    </p>
                    <button
                        onClick={copy}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                            background: copied ? 'var(--safe-dim)' : 'var(--cyan-dim)',
                            border: `1px solid ${copied ? 'var(--safe)' : 'var(--border-cyan)'}`,
                            borderRadius: 6, cursor: 'pointer',
                            color: copied ? 'var(--safe)' : 'var(--cyan)', fontSize: 12, fontWeight: 600,
                            fontFamily: 'var(--font-sans)',
                        }}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied to clipboard!' : 'Copy AI Fix Prompt'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
