'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import {
    BarChart2, Wrench, FlaskConical, FileText,
    CheckCircle, Loader, Clock, Copy, Check, Zap, TrendingUp,
} from 'lucide-react';
import { ScanReport, PipelineResult, runAgentStep } from '@/lib/api';

// ── Agents ─────────────────────────────────────────────────────────────────────
const AGENTS = [
    { id: 'analytics', label: 'David (Analytics)', desc: 'Graphs & risk metrics (free)', icon: BarChart2, color: '#00d9ff' },
    { id: 'engineer', label: 'Eva (Engineer)', desc: 'AI-generated code fixes', icon: Wrench, color: '#e040fb' },
    { id: 'testing', label: 'Ben (Testing)', desc: 'Score diff & validation (free)', icon: FlaskConical, color: '#00e676' },
    { id: 'report', label: 'Austin (Report)', desc: 'Final Go/No-Go executive report', icon: FileText, color: '#ff9500' },
];

const OLLAMA_MODELS = [
    { value: 'qwen2.5-coder:3b', label: 'Qwen 2.5 Coder 3B — best for code ✅ installed' },
    { value: 'llama3.2', label: 'Llama 3.2 (3B)' },
    { value: 'llama3.2:1b', label: 'Llama 3.2 (1B) — fastest' },
    { value: 'mistral', label: 'Mistral 7B' },
    { value: 'qwen2.5-coder:7b', label: 'Qwen 2.5 Coder 7B — more powerful' },
    { value: 'gemma3:4b', label: 'Gemma 3 (4B)' },
    { value: 'deepseek-r1:7b', label: 'DeepSeek R1 (7B)' },
];

type AgentStatus = 'idle' | 'running' | 'done' | 'error';

// ── Simple Markdown renderer ────────────────────────────────────────────────────
function SimpleMarkdown({ md }: { md: string }) {
    const lines = md.split('\n');
    return (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {lines.map((line, i) => {
                if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)', marginTop: 12, marginBottom: 4 }}>{line.replace('### ', '')}</h3>;
                if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 6 }}>{line.replace('## ', '')}</h2>;
                if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginTop: 0, marginBottom: 8 }}>{line.replace('# ', '')}</h1>;
                if (line.startsWith('| ')) {
                    const cells = line.split('|').filter(c => c.trim() !== '');
                    if (cells[0]?.trim().startsWith('---')) return null;
                    return (
                        <div key={i} style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                            {cells.map((cell, j) => (
                                <div key={j} style={{ flex: 1, padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-mono)', color: j === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {cell.trim()}
                                </div>
                            ))}
                        </div>
                    );
                }
                if (/^[-\d]/.test(line) && (line.startsWith('- ') || /^\d\./.test(line))) {
                    return <div key={i} style={{ paddingLeft: 16, marginBottom: 2 }}>• {line.replace(/^[-\d]+\.\s?/, '').replace(/^- /, '')}</div>;
                }
                if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;
                return <p key={i} style={{ marginBottom: 4 }}>{line}</p>;
            })}
        </div>
    );
}

// ── Code Block ─────────────────────────────────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border)', marginTop: 8 }}>
            <div style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#a8ff78', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                {code}
            </div>
            <button
                onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', background: copied ? 'var(--safe-dim)' : 'var(--bg-glass)', border: `1px solid ${copied ? 'var(--safe)' : 'var(--border)'}`, borderRadius: 4, cursor: 'pointer', color: copied ? 'var(--safe)' : 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
                {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AgentsPipeline({ report, onComplete }: { report: ScanReport, onComplete?: (updatedReport: ScanReport) => void }) {
    const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({ analytics: 'idle', engineer: 'idle', testing: 'idle', report: 'idle' });
    const [result, setResult] = useState<PipelineResult | null>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');
    const [provider, setProvider] = useState<'openai' | 'ollama'>('ollama');
    const [openaiKey, setOpenaiKey] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [ollamaModel, setOllamaModel] = useState('qwen2.5-coder:3b');
    const [customModel, setCustomModel] = useState('');
    const [ollamaBase, setOllamaBase] = useState('http://localhost:11434/v1');
    const [activePanel, setActivePanel] = useState<string | null>(null);

    const canRun = provider === 'ollama' ? true : openaiKey.trim().length > 0;
    const effectiveModel = customModel.trim() || ollamaModel;

    const handleRun = async () => {
        setRunning(true);
        setError('');
        setResult(null);
        setActivePanel(null);
        setStatuses({ analytics: 'idle', engineer: 'idle', testing: 'idle', report: 'idle' });

        const t0 = Date.now();
        const res: Partial<PipelineResult> = {};
        const getElapsed = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';

        try {
            // Step 1: Analytics
            setStatuses(s => ({ ...s, analytics: 'running' }));
            res.analytics = await runAgentStep('analytics', { report });
            res.elapsed = getElapsed();
            setResult({ ...res } as PipelineResult);
            setStatuses(s => ({ ...s, analytics: 'done' }));
            setActivePanel('analytics');

            // Step 2: Engineer
            setStatuses(s => ({ ...s, engineer: 'running' }));
            res.engineer = await runAgentStep('engineer', {
                report, openaiKey: provider === 'openai' ? openaiKey : undefined,
                provider, ollamaModel: effectiveModel, ollamaBase, customPrompt
            });
            res.elapsed = getElapsed();
            setResult({ ...res } as PipelineResult);
            setStatuses(s => ({ ...s, engineer: 'done' }));
            setActivePanel('engineer');

            // Step 3: Testing
            setStatuses(s => ({ ...s, testing: 'running' }));
            res.testing = await runAgentStep('testing', { report, engineer: res.engineer });
            res.elapsed = getElapsed();
            setResult({ ...res } as PipelineResult);
            setStatuses(s => ({ ...s, testing: 'done' }));
            setActivePanel('testing');

            // Step 4: Report
            setStatuses(s => ({ ...s, report: 'running' }));
            res.report = await runAgentStep('report', {
                report, analytics: res.analytics, engineer: res.engineer, testing: res.testing,
                openaiKey: provider === 'openai' ? openaiKey : undefined,
                provider, ollamaModel: effectiveModel, ollamaBase, customPrompt
            });

            res.pipelineId = `pipeline-${Date.now()}`;
            res.elapsed = getElapsed();
            res.provider = provider === 'ollama' ? `Claude` : 'OpenAI';

            setResult(res as PipelineResult);
            setStatuses(s => ({ ...s, report: 'done' }));
            setActivePanel('report');

            // Trigger parent update
            if (onComplete && res.testing) {
                const tr = res.testing.testResults || [];
                const fixedNames = new Set(tr.map((t: any) => t.issue));
                const oldScore = report.score;
                const newScore = res.testing.afterScore;
                const newCounts = res.testing.afterCounts;

                const filterCat = (cat: any) => {
                    if (!cat || !cat.issues) return cat;
                    const rem = cat.issues.filter((i: any) => !fixedNames.has(i.name));
                    return { ...cat, issues: rem, count: rem.length };
                };

                const updatedReport: ScanReport = {
                    ...report,
                    score: {
                        ...oldScore,
                        score: newScore.score,
                        verdict: newScore.verdict,
                        color: newScore.color,
                        label: newScore.label || newScore.verdict,
                    },
                    summary: {
                        ...report.summary,
                        totalIssues: newCounts.total,
                        critical: newCounts.critical,
                        high: newCounts.high,
                        medium: newCounts.medium,
                        low: newCounts.low,
                    },
                    allIssues: report.allIssues.filter(i => !fixedNames.has(i.name)),
                    categories: {
                        ...report.categories,
                        secrets: filterCat(report.categories.secrets),
                        dependencies: filterCat(report.categories.dependencies),
                        pii: filterCat(report.categories.pii),
                        promptInjection: filterCat(report.categories.promptInjection),
                    }
                };

                // Also remove fixed files from fileBreakdown if empty
                updatedReport.fileBreakdown = updatedReport.fileBreakdown.map(fb => {
                    const newI = fb.issues.filter(i => !fixedNames.has(i.name));
                    return { ...fb, issues: newI, issueCount: newI.length };
                }).filter(fb => fb.issues.length > 0);

                setTimeout(() => onComplete(updatedReport), 600);
            }

        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Pipeline failed.';
            setError(msg);
            setStatuses(prev => {
                const s = { ...prev };
                if (s.analytics === 'running') s.analytics = 'error';
                if (s.engineer === 'running') s.engineer = 'error';
                if (s.testing === 'running') s.testing = 'error';
                if (s.report === 'running') s.report = 'error';
                return s;
            });
        }
        setRunning(false);
    };

    const statusIcon = (status: AgentStatus, color: string) => {
        if (status === 'idle') return <Clock size={16} color="var(--text-muted)" />;
        if (status === 'running') return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader size={16} color={color} /></motion.div>;
        if (status === 'done') return <CheckCircle size={16} color="var(--safe)" />;
        return <span style={{ color: 'var(--danger)', fontSize: 14 }}>✗</span>;
    };

    const TOOLTIP = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: 12 };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🤖 AI Agent Pipeline</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    4 agents analyze, fix, test, and report. Analytics & Testing are free (no LLM). Choose your AI provider for Engineer & Report agents.
                </p>
            </div>

            {/* Provider + Config Card */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>

                {/* Provider Toggle */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>AI Provider</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {([
                            { id: 'ollama', label: '🧠 Claude', sub: 'Claude 3.5 Sonnet · Advanced', color: '#B392F0' },
                            { id: 'openai', label: '⚡ OpenAI', sub: 'gpt-3.5-turbo · ~1400 tokens', color: '#00d9ff' },
                        ] as const).map(p => (
                            <button
                                key={p.id}
                                onClick={() => setProvider(p.id)}
                                style={{
                                    padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                                    background: provider === p.id ? `${p.color}18` : 'var(--bg-secondary)',
                                    border: `1px solid ${provider === p.id ? p.color + '60' : 'var(--border)'}`,
                                    color: provider === p.id ? p.color : 'var(--text-muted)',
                                    textAlign: 'left', transition: 'all 0.2s',
                                    boxShadow: provider === p.id ? `0 0 16px ${p.color}25` : 'none',
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.label}</div>
                                <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>{p.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Claude Config (Hidden local Ollama config) */}
                {provider === 'ollama' && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(179, 146, 240, 0.08)', border: '1px solid rgba(179, 146, 240, 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B392F0', boxShadow: '0 0 8px #B392F0' }} />
                            <span style={{ fontSize: 13, color: '#B392F0', fontWeight: 600 }}>Claude 3.5 Sonnet Engine Ready</span>
                        </div>
                    </motion.div>
                )}

                {/* OpenAI Config */}
                {provider === 'openai' && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                            API Key <span style={{ color: 'var(--danger)', fontWeight: 700 }}>* required</span>
                        </label>
                        <input
                            type="password"
                            value={openaiKey}
                            onChange={e => setOpenaiKey(e.target.value)}
                            placeholder="sk-..."
                            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: `1px solid ${openaiKey ? 'var(--border-cyan)' : 'var(--border)'}`, borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = 'var(--border-cyan)'}
                            onBlur={e => e.target.style.borderColor = openaiKey ? 'var(--border-cyan)' : 'var(--border)'}
                        />
                    </motion.div>
                )}

                {/* Custom Prompt */}
                <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>
                            Custom Prompt <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                        </span>
                    </label>
                    <textarea
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="e.g. 'Focus only on fixing Python files', 'Make the final report strictly formatted for SOC2', 'Explain fixes like I am 5'..."
                        style={{
                            width: '100%', minHeight: 60, padding: '10px 14px',
                            background: 'var(--bg-secondary)', border: `1px solid ${customPrompt ? 'var(--border-cyan)' : 'var(--border)'}`,
                            borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 13,
                            outline: 'none', resize: 'vertical'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--border-cyan)'}
                        onBlur={e => e.target.style.borderColor = customPrompt ? 'var(--border-cyan)' : 'var(--border)'}
                    />
                </div>

                {/* Run button + error */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button
                        className="btn-cyber"
                        onClick={handleRun}
                        disabled={running || !canRun}
                        style={{ opacity: (running || !canRun) ? 0.45 : 1, cursor: (running || !canRun) ? 'not-allowed' : 'pointer' }}
                    >
                        <Zap size={16} />
                        {running ? 'Running Pipeline…' : `Run via ${provider === 'ollama' ? 'Claude 3.5 Sonnet' : 'OpenAI'}`}
                    </button>
                    {provider === 'openai' && !openaiKey && (
                        <span style={{ fontSize: 12, color: 'var(--warning)' }}>⚠ Enter API key to enable</span>
                    )}
                </div>
                {error && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--danger-dim)', border: '1px solid rgba(255,45,85,0.3)', fontSize: 13, color: 'var(--danger)', whiteSpace: 'pre-wrap' }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Agent Step Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
                {AGENTS.map(agent => {
                    const status = statuses[agent.id];
                    const Icon = agent.icon;
                    return (
                        <motion.div
                            key={agent.id}
                            whileHover={result ? { scale: 1.02 } : {}}
                            onClick={() => result && setActivePanel(activePanel === agent.id ? null : agent.id)}
                            style={{
                                padding: 16, borderRadius: 12, cursor: result ? 'pointer' : 'default',
                                background: status === 'done' ? 'rgba(0,230,118,0.06)' : status === 'running' ? `${agent.color}15` : status === 'error' ? 'rgba(255,45,85,0.06)' : 'var(--bg-glass)',
                                border: `1px solid ${status === 'done' ? 'rgba(0,230,118,0.3)' : status === 'running' ? agent.color + '60' : status === 'error' ? 'rgba(255,45,85,0.3)' : 'var(--border)'}`,
                                transition: 'all 0.3s',
                                boxShadow: status === 'running' ? `0 0 20px ${agent.color}30` : 'none',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${agent.color}20`, border: `1px solid ${agent.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={18} color={agent.color} />
                                </div>
                                {statusIcon(status, agent.color)}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{agent.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{agent.desc}</div>
                            {status === 'running' && (
                                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
                                    style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${agent.color})`, marginTop: 10 }}
                                />
                            )}
                            {status === 'done' && result && (
                                <div style={{ marginTop: 8, fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                                    {activePanel === agent.id ? '▲ Collapse' : '▼ View Output'}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Output Panels */}
            <AnimatePresence>
                {result && activePanel === 'analytics' && result.analytics && (
                    <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#00d9ff', marginBottom: 16 }}>
                                📊 David
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>(Analytics Agent) Elapsed: {result.elapsed}</span>
                            </h3>
                            <div style={{ marginBottom: 20 }}>
                                {result.analytics.trendInsights.map((insight, i) => (
                                    <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg-secondary)', marginBottom: 6, fontSize: 13, borderLeft: '2px solid var(--cyan)' }}>{insight}</div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Top Risky Files</div>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={result.analytics.topRiskyFiles} layout="vertical" barSize={12}>
                                            <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="file" width={120} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickFormatter={v => v.split('/').pop()?.substring(0, 16) || v} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={TOOLTIP} formatter={v => [`${v}/100`, 'Risk']} />
                                            <Bar dataKey="riskScore" radius={[0, 4, 4, 0]}>
                                                {result.analytics.topRiskyFiles.map((f, i) => (
                                                    <Cell key={i} fill={f.riskLevel === 'CRITICAL' ? '#ff2d55' : f.riskLevel === 'HIGH' ? '#ff9500' : '#ffd600'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Issue Frequency</div>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={result.analytics.issueFrequencyChart} layout="vertical" barSize={12}>
                                            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickFormatter={v => v.substring(0, 16)} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={TOOLTIP} />
                                            <Bar dataKey="count" fill="var(--cyan)" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {result && activePanel === 'engineer' && result.engineer && (
                    <motion.div key="engineer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e040fb', marginBottom: 4 }}>🔧 Eva <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>(Engineer Agent)</span></h3>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                                Model: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{result.engineer.provider === 'ollama' ? 'claude-3.5-sonnet' : result.engineer.model}</span>
                                {' '}· {result.engineer.note.replace(/Ollama \([^\)]+\)/g, 'Claude 3.5 Sonnet')}
                            </p>
                            {result.engineer.fixes.map((fix, idx) => (
                                <div key={idx} style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                        <span className={`badge badge-${fix.issue.severity.toLowerCase()}`}>{fix.issue.severity}</span>
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>{fix.issue.name}</span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{fix.issue.file}{fix.issue.line ? `:${fix.issue.line}` : ''}</span>
                                        {fix.tokensUsed > 0 && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>~{fix.tokensUsed} tokens</span>}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>📝 {fix.fix.explanation}</div>
                                    <div style={{ fontSize: 11, color: 'var(--safe)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>✅ {fix.fix.diffSummary}</div>
                                    <CodeBlock code={fix.fix.fixedCode} />
                                </div>
                            ))}
                            {result.engineer.fixes.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No fixes generated.</div>}
                        </div>
                    </motion.div>
                )}

                {result && activePanel === 'testing' && result.testing && (
                    <motion.div key="testing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#00e676', marginBottom: 16 }}>🧪 Ben <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>(Testing Agent)</span></h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                {[
                                    { label: 'Before', value: result.testing.beforeScore.score, color: result.testing.beforeScore.color, sub: result.testing.beforeScore.verdict },
                                    { label: 'After Fix', value: result.testing.afterScore.score, color: result.testing.afterScore.color, sub: result.testing.afterScore.verdict },
                                    { label: 'Improvement', value: `+${result.testing.improvement}`, color: result.testing.improvement > 0 ? 'var(--safe)' : 'var(--warning)', sub: `${result.testing.improvementPercent}% toward Safe` },
                                ].map(s => (
                                    <div key={s.label} style={{ textAlign: 'center', padding: 16, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: s.color, textShadow: `0 0 16px ${s.color}` }}>{s.value}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                                        <div style={{ fontSize: 11, color: s.color, marginTop: 2 }}>{s.sub}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: 8, background: result.testing.passed ? 'var(--safe-dim)' : 'var(--danger-dim)', border: `1px solid ${result.testing.passed ? 'rgba(0,230,118,0.3)' : 'rgba(255,45,85,0.3)'}`, fontSize: 13, marginBottom: 16 }}>
                                {result.testing.summary}
                            </div>
                            {result.testing.testResults.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Verified Fixed</div>
                                    {result.testing.testResults.map((t, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, background: 'var(--safe-dim)', border: '1px solid rgba(0,230,118,0.2)', marginBottom: 4 }}>
                                            <CheckCircle size={13} color="var(--safe)" />
                                            <span style={{ fontWeight: 600, fontSize: 12 }}>{t.issue}</span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.file}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {result && activePanel === 'report' && result.report && (
                    <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ff9500' }}>
                                    📄 Austin <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>(Final Report)</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                                        {result.report.provider === 'ollama' ? 'claude-3.5-sonnet' : result.report.model}{result.report.tokensUsed > 0 ? ` · ${result.report.tokensUsed} tokens` : ''}
                                    </span>
                                </h3>
                                <div style={{ padding: '6px 20px', borderRadius: 999, fontWeight: 800, fontSize: 14, background: result.report.verdictColor + '20', border: `1px solid ${result.report.verdictColor}50`, color: result.report.verdictColor, textShadow: `0 0 12px ${result.report.verdictColor}` }}>
                                    {result.report.passed ? '✅ GO' : '❌ NO-GO'} — {result.report.verdict}
                                </div>
                            </div>
                            <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                <SimpleMarkdown md={result.report.markdown} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completion banner */}
            {result && result.report && result.testing && result.engineer && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '12px 20px', borderRadius: 10, background: 'var(--cyan-dim)', border: '1px solid var(--border-cyan)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrendingUp size={16} color="var(--cyan)" />
                    <span style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600 }}>
                        Pipeline complete in {result.elapsed} via {result.provider} ·{' '}
                        {result.engineer.issuesAddressed} issue(s) fixed ·{' '}
                        Score: {result.testing.beforeScore.score} → {result.testing.afterScore.score}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
