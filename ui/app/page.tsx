'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Shield, Github, Upload, Zap, Lock, Eye, AlertTriangle } from 'lucide-react';
import { scanZip, scanGitHub } from '@/lib/api';
import { setReport } from '@/lib/store';
import Hero from '@/components/Hero';
import Pricing from '@/components/Pricing';
import AgentPipelineDemo from '@/components/AgentPipelineDemo';


type InputMode = 'zip' | 'github';

function buildDemoReport() {
  return {
    scanId: 'demo-001',
    repoName: 'demo-vibe-app',
    timestamp: new Date().toISOString(),
    score: {
      score: 38,
      totalDeductions: 62,
      deductionBreakdown: { CRITICAL: 40, HIGH: 15, MEDIUM: 5, LOW: 2 },
      label: 'DANGER',
      verdict: 'No-Go',
      color: '#ff2d55',
      emoji: '🔴',
      categoryScores: { secrets: 40, dependencies: 70, pii: 55, promptInjection: 20 },
      recommendations: [
        { severity: 'CRITICAL', name: 'AWS Access Key Hardcoded', remediation: 'Remove AWS keys from source. Use environment variables or AWS IAM roles.', category: 'secrets', occurrences: 2 },
        { severity: 'CRITICAL', name: 'Unsanitized User Input Passed to LLM', remediation: 'Never pass raw user input to LLM. Sanitize and validate all inputs.', category: 'promptInjection', occurrences: 1 },
        { severity: 'HIGH', name: 'Risky Package: md5', remediation: 'MD5 is cryptographically broken. Use bcrypt or argon2.', category: 'dependencies', occurrences: 1 },
        { severity: 'HIGH', name: 'Database Password Hardcoded', remediation: 'Move DB password to .env file and add .env to .gitignore.', category: 'secrets', occurrences: 1 },
        { severity: 'MEDIUM', name: 'Missing .env.example', remediation: 'Add a .env.example file documenting required environment variables.', category: 'pii', occurrences: 1 },
      ],
    },
    summary: { totalFiles: 34, totalIssues: 12, critical: 3, high: 4, medium: 3, low: 2 },
    categories: {
      secrets: { count: 4, critical: 2, issues: [] },
      dependencies: { count: 3, issues: [] },
      pii: { count: 3, gdprIssues: 2, soc2Issues: 2, issues: [] },
      promptInjection: { count: 2, critical: 1, issues: [] },
    },
    fileBreakdown: [
      { file: 'src/config/database.js', issues: [{ type: 'secret', category: 'secrets', name: 'Database Password', severity: 'CRITICAL' as const, file: 'src/config/database.js', line: 12, snippet: 'const password = "super_secret_123"', remediation: 'Use environment variables.', persona: ['security'] }], riskLevel: 'CRITICAL' as const, issueCount: 2 },
      { file: 'src/api/chat.js', issues: [{ type: 'promptInjection', category: 'promptInjection', name: 'Unsanitized Input', severity: 'CRITICAL' as const, file: 'src/api/chat.js', line: 45, snippet: 'prompt += req.body.message', remediation: 'Sanitize inputs.', persona: ['security'] }], riskLevel: 'CRITICAL' as const, issueCount: 1 },
      { file: '.env', issues: [{ type: 'secret', category: 'secrets', name: 'AWS Access Key', severity: 'CRITICAL' as const, file: '.env', line: 3, snippet: 'AKIA3EXAMPLE1234567', remediation: 'Rotate this key immediately.', persona: ['security'] }], riskLevel: 'CRITICAL' as const, issueCount: 1 },
      { file: 'package.json', issues: [{ type: 'dependency', category: 'dependencies', name: 'Risky Package: md5', severity: 'HIGH' as const, file: 'package.json', line: null, snippet: '"md5": "^2.3.0"', remediation: 'Use bcrypt or argon2.', persona: ['dev'] }], riskLevel: 'HIGH' as const, issueCount: 1 },
      { file: 'src/utils/user.js', issues: [{ type: 'pii', category: 'pii', name: 'User Data Logged', severity: 'HIGH' as const, file: 'src/utils/user.js', line: 23, snippet: 'console.log(user.email, user.password)', remediation: 'Never log PII.', persona: ['compliance'] }], riskLevel: 'HIGH' as const, issueCount: 1 },
    ],
    allIssues: [],
  };
}

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('zip');
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
  });

  const handleScan = async () => {
    setError('');
    setScanning(true);

    try {
      let report;
      let repoName: string;
      if (mode === 'zip' && file) {
        repoName = file.name.replace('.zip', '');
        report = await scanZip(file);
      } else if (mode === 'github' && githubUrl) {
        repoName = githubUrl.split('/').slice(-2).join('/');
        report = await scanGitHub(githubUrl);
      } else {
        setError('Please provide a zip file or GitHub URL.');
        setScanning(false);
        return;
      }

      // Use in-memory store — avoids 5MB sessionStorage quota limit
      setReport(report, repoName);
      router.push('/results');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Scan failed. Make sure the backend is running on port 3001.';
      setError(msg);
      setScanning(false);
    }
  };

  const handleDemo = () => {
    const demoReport = buildDemoReport();
    setReport(demoReport, 'demo-vibe-app');
    router.push('/results');
  };

  const features = [
    { icon: Lock, label: 'Secret Detection', desc: 'AWS keys, OpenAI tokens, DB passwords', color: '#ff2d55', bg: 'rgba(255, 45, 85, 0.12)', border: 'rgba(255, 45, 85, 0.25)' },
    { icon: AlertTriangle, label: 'Dependency Audit', desc: 'Hallucinated & vulnerable packages', color: '#ff9500', bg: 'rgba(255, 149, 0, 0.12)', border: 'rgba(255, 149, 0, 0.25)' },
    { icon: Eye, label: 'PII / GDPR Scan', desc: 'Compliance gaps & data exposure', color: '#00d9ff', bg: 'rgba(0, 217, 255, 0.12)', border: 'rgba(0, 217, 255, 0.25)' },
    { icon: Zap, label: 'Prompt Injection', desc: 'AI attack vectors & LLM risks', color: '#e040fb', bg: 'rgba(224, 64, 251, 0.12)', border: 'rgba(224, 64, 251, 0.25)' },
  ];

  const isScanDisabled = scanning || (mode === 'zip' ? !file : !githubUrl);

  return (
    <>
      <Hero />

      {/* ── Stat Banners ── */}
      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '0 32px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: '-28px',
        position: 'relative',
        zIndex: 10,
        marginBottom: '8px',
      }}>
        {/* Left — 78% */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(15, 8, 30, 0.82)',
            border: '1px solid rgba(255, 45, 85, 0.25)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(255,45,85,0.08), 0 8px 32px rgba(0,0,0,0.5)',
            flex: '1 1 360px',
            maxWidth: 480,
          }}
        >
          {/* Image */}
          <div style={{ width: 90, height: 90, flexShrink: 0, overflow: 'hidden', borderRadius: '50%', margin: '8px 0 8px 8px', border: '2px solid rgba(255,45,85,0.3)', boxShadow: '0 0 20px rgba(255,45,85,0.2)' }}>
            <img src="/hacker_stat.png" alt="Security threat" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          </div>
          {/* Left text */}
          <div style={{ padding: '0 20px', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>AI-Generated Code<br />Has Security Flaws</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Undetected vulnerabilities in production systems</div>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 50, background: 'rgba(255,45,85,0.25)', flexShrink: 0 }} />
          {/* Big % */}
          <div style={{ padding: '0 24px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#ff2d55', lineHeight: 1, textShadow: '0 0 30px rgba(255,45,85,0.6)', fontVariantNumeric: 'tabular-nums' }}>78%</div>
          </div>
        </motion.div>

        {/* Right — 45% */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(15, 8, 30, 0.82)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(139,92,246,0.1), 0 8px 32px rgba(0,0,0,0.5)',
            flex: '1 1 360px',
            maxWidth: 480,
          }}
        >
          {/* Image */}
          <div style={{ width: 90, height: 90, flexShrink: 0, overflow: 'hidden', borderRadius: '50%', margin: '8px 0 8px 8px', border: '2px solid rgba(139,92,246,0.4)', boxShadow: '0 0 20px rgba(139,92,246,0.25)' }}>
            <img src="/fingerprint_stat.png" alt="Compliance scan" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
          {/* Left text */}
          <div style={{ padding: '0 20px', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>Breaks Compliance<br />Rules & GDPR</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Regulatory violations hidden in AI-generated code</div>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 50, background: 'rgba(139,92,246,0.3)', flexShrink: 0 }} />
          {/* Big % */}
          <div style={{ padding: '0 24px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#a78bfa', lineHeight: 1, textShadow: '0 0 30px rgba(139,92,246,0.6)', fontVariantNumeric: 'tabular-nums' }}>45%</div>
          </div>
        </motion.div>
      </div>

      {/* Main content section below hero */}
      <div
        id="upload"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingBottom: '80px',
          background: 'var(--bg-primary)',
          position: 'relative',
          gap: '64px',
          flexWrap: 'wrap',
        }}
      >

        {/* ---------------- Feature Section (UPGRADED) ---------------- */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, gap: '16px', maxWidth: '44rem' }}
        >
          {/* Label badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', width: 'fit-content' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #7c3aed', display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono' }}>REAL-TIME AI SCANNER</span>
          </div>

          {/* Heading */}
          <div style={{ position: 'relative' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, fontWeight: 900,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(167,139,250,0.9) 50%, rgba(255,255,255,0.3) 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              Cyber Security<br />
              <span style={{ background: 'linear-gradient(135deg, #c084fc, #7c3aed)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Intelligence Scan</span>
            </h1>
            {/* Scan count */}
            <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676', display: 'inline-block', animation: 'pulse 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#00e676', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>2,847 SCANS TODAY</span>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'rgba(200,180,255,0.5)', lineHeight: 1.7, maxWidth: '36rem' }}>
            Production-grade AI code scanner detecting secrets, vulnerabilities, and compliance violations before they reach production.
          </p>

          {/* Feature pills — upgraded */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.09 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px', borderRadius: 14,
                  border: `1px solid ${f.border}`,
                  background: f.bg, backdropFilter: 'blur(12px)',
                  position: 'relative', overflow: 'hidden',
                  cursor: 'default',
                }}
              >
                {/* Scan line animation */}
                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: `linear-gradient(90deg, transparent, ${f.color}08, transparent)`, animation: `scanline ${2.5 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`, pointerEvents: 'none' }} />

                {/* Icon box */}
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${f.color}18`, border: `1px solid ${f.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 16px ${f.color}25` }}>
                  <f.icon size={17} style={{ color: f.color }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(200,185,255,0.45)' }}>{f.desc}</div>
                </div>

                {/* Right: severity tag */}
                <div style={{ fontSize: 9, padding: '3px 9px', borderRadius: 99, background: `${f.color}15`, border: `1px solid ${f.color}30`, color: f.color, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0 }}>
                  ACTIVE
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mini stat row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {[{ n: '247', l: 'Files Scanned' }, { n: '<3s', l: 'Avg Scan Time' }, { n: '99.9%', l: 'Accuracy Rate' }].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 10, color: 'rgba(200,180,255,0.4)', marginTop: 2, fontFamily: 'JetBrains Mono' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ---------------- Upload Card (UPGRADED) ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          style={{
            width: '100%', maxWidth: '36rem',
            padding: '28px', borderRadius: 20,
            border: '1px solid rgba(139,92,246,0.25)',
            background: 'linear-gradient(145deg, rgba(15,8,30,0.95), rgba(20,12,40,0.9))',
            backdropFilter: 'blur(32px)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(109,40,217,0.12)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Corner glow */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Start a Scan</div>
              <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.4)', marginTop: 2, fontFamily: 'JetBrains Mono' }}>Upload ZIP or paste GitHub URL</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <span style={{ fontSize: 10 }}>🛡️</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', fontFamily: 'JetBrains Mono' }}>SECURE</span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '24px',
              background: 'rgba(139,92,246,0.06)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            {(['zip', 'github'] as InputMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  paddingTop: '11px', paddingBottom: '11px', borderRadius: '9px',
                  fontSize: '13px', fontWeight: 600,
                  transition: 'all 0.25s ease',
                  background: mode === m ? 'linear-gradient(135deg, rgba(109,40,217,0.5), rgba(139,92,246,0.3))' : 'transparent',
                  color: mode === m ? '#e9d5ff' : 'rgba(167,139,250,0.45)',
                  border: mode === m ? '1px solid rgba(139,92,246,0.45)' : '1px solid transparent',
                  boxShadow: mode === m ? '0 0 20px rgba(109,40,217,0.3)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {m === 'zip' ? <Upload size={14} /> : <Github size={14} />}
                {m === 'zip' ? 'Upload ZIP' : 'GitHub URL'}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <AnimatePresence mode="wait">
            {mode === 'zip' ? (
              <motion.div
                key="zip"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div
                  {...getRootProps()}
                  style={{
                    border: `2px dashed ${isDragActive ? '#a78bfa' : file ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.25)'}`,
                    borderRadius: '14px',
                    padding: '36px 24px',
                    textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: isDragActive ? 'rgba(139,92,246,0.1)' : file ? 'rgba(139,92,246,0.07)' : 'rgba(139,92,246,0.04)',
                    boxShadow: isDragActive ? '0 0 30px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.08)' : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <input {...getInputProps()} />

                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}>
                        <Upload size={22} style={{ color: '#a78bfa' }} />
                      </div>
                      {/* Ping ring */}
                      {!file && <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: '1px solid rgba(139,92,246,0.3)', animation: 'ripple 2s ease-out infinite' }} />}
                    </div>
                  </div>

                  {file ? (
                    <div>
                      <p style={{ fontWeight: 600, color: '#ffffff' }}>{file.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', marginTop: '8px' }}>
                        {(file.size / 1024).toFixed(1)} KB — ready to scan
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                        {isDragActive ? 'Drop it here!' : 'Drag & drop your repo zip'}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)' }}>
                        or click to browse files
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '12px', fontFamily: 'monospace' }}>
                        .zip files only, max 50MB
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="github"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div style={{ position: 'relative' }}>
                  <Github
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={e => { setGithubUrl(e.target.value); setError(''); }}
                    className="interactive-hover"
                    placeholder="https://github.com/username/repository"
                    style={{
                      width: '100%',
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#ffffff',
                      outline: 'none',
                      transition: 'all 200ms ease',
                    }}
                  />
                </div>

                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '12px', fontFamily: 'monospace' }}>
                  Public repos only • Cloned with depth=1 for speed
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                borderRadius: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              onClick={handleScan}
              disabled={isScanDisabled}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '15px 20px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 700,
                transition: 'all 0.3s ease',
                border: isScanDisabled ? '1px solid rgba(139,92,246,0.15)' : '1px solid rgba(139,92,246,0.5)',
                background: isScanDisabled
                  ? 'rgba(139,92,246,0.06)'
                  : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)',
                color: isScanDisabled ? 'rgba(167,139,250,0.35)' : '#ffffff',
                cursor: isScanDisabled ? 'not-allowed' : 'pointer',
                boxShadow: isScanDisabled ? 'none' : '0 0 28px rgba(109,40,217,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                textShadow: isScanDisabled ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                letterSpacing: '0.02em',
              }}
            >
              <Shield size={15} />
              {scanning ? '⟳ Scanning...' : 'Run Audit'}
            </button>

            <button
              onClick={handleDemo}
              className="btn-fill"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '15px 22px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              <Zap size={14} />
              View Demo
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Anima-Style AI Demo Section ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        style={{
          position: 'relative',
          padding: '100px 48px',
          overflow: 'hidden',
          background: 'var(--bg-primary)',
        }}
      >
        {/* Ambient gradient orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Subtle grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>

          {/* ── Left: Text ── */}
          <div style={{ flex: '1 1 380px', maxWidth: 480 }}>
            {/* Live badge */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(139,92,246,0.35)', marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #7c3aed', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono' }}>AI-POWERED SCANNING</span>
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.02em', color: '#fff' }}>
              See VibeAudit{' '}
              <span style={{ background: 'linear-gradient(135deg, #c084fc, #7c3aed)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                in Action
              </span>
            </motion.h2>

            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.28 }}
              style={{ fontSize: '1rem', color: 'rgba(200,180,255,0.6)', lineHeight: 1.75, marginBottom: 32 }}>
              Drop in a GitHub URL or ZIP and watch our AI agents scan your codebase for secrets, vulnerabilities, PII leaks, and LLM attack vectors — in seconds.
            </motion.p>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
              {[
                { icon: '🔑', text: 'Instant secret & API key detection' },
                { icon: '🤖', text: 'LLM prompt injection analysis' },
                { icon: '📋', text: 'GDPR & SOC2 compliance gaps' },
                { icon: '⚡', text: 'Real-time AI agent pipeline' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(109,40,217,0.2)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{item.icon}</div>
                  <span style={{ fontSize: 14, color: 'rgba(233,213,255,0.75)', fontWeight: 500 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
              onClick={() => { const el = document.getElementById('upload'); el?.scrollIntoView({ behavior: 'smooth' }); }}
              className="btn-fill-purple"
              style={{ padding: '14px 32px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Space Grotesk', letterSpacing: '0.02em' }}
            >
              Start Free Scan →
            </motion.button>
          </div>

          {/* ── Right: Browser mockup ── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            style={{ flex: '1 1 480px', maxWidth: 640, position: 'relative' }}
          >
            {/* Glow behind mockup */}
            <div style={{ position: 'absolute', inset: -40, borderRadius: 32, background: 'radial-gradient(ellipse at center, rgba(109,40,217,0.35) 0%, transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

            {/* Browser frame */}
            <div style={{
              position: 'relative', borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(139,92,246,0.35)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(109,40,217,0.2)',
              background: '#0d0b18',
            }}>
              {/* Fake Chrome header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(20,14,40,0.95)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
                {/* Traffic lights */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                </div>
                {/* URL bar */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 7, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <span style={{ fontSize: 10, color: 'rgba(200,180,255,0.4)', fontFamily: 'JetBrains Mono' }}>🔒</span>
                  <span style={{ fontSize: 11, color: 'rgba(200,180,255,0.5)', fontFamily: 'JetBrains Mono', letterSpacing: '0.01em' }}>vibeaudit.ai / agent-pipeline</span>
                </div>
                {/* Live badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.35)' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1.4s ease-in-out infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>LIVE DEMO</span>
                </div>
              </div>

              {/* Agent Pipeline Demo */}
              <div style={{ width: '100%', height: 320 }}>
                <AgentPipelineDemo />
              </div>
            </div>

            {/* Floating stat badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', bottom: -18, left: -24, padding: '10px 18px', borderRadius: 12, background: 'rgba(15,8,30,0.92)', border: '1px solid rgba(255,45,85,0.35)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: '#ff2d55', lineHeight: 1, textShadow: '0 0 20px rgba(255,45,85,0.6)', fontVariantNumeric: 'tabular-nums' }}>78%</div>
              <div style={{ fontSize: 10, color: 'rgba(255,150,150,0.6)', marginTop: 2, fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap' }}>AI code has flaws</div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              style={{ position: 'absolute', top: 60, right: -22, padding: '10px 16px', borderRadius: 12, background: 'rgba(15,8,30,0.92)', border: '1px solid rgba(139,92,246,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>⚡ AGENTS RUNNING</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {['David', 'Eva', 'Ben', 'Austin'].map((name) => (
                  <div key={name} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', fontFamily: 'JetBrains Mono' }}>{name}</div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1; box-shadow: 0 0 12px currentColor} }`}</style>
      </motion.section>

      <Pricing />
    </>
  );
}
