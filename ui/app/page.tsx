'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Shield, Github, Upload, Zap, Lock, Eye, AlertTriangle, ChevronRight } from 'lucide-react';
import { scanZip, scanGitHub } from '@/lib/api';
import { setReport } from '@/lib/store';

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
    { icon: Lock, label: 'Secret Detection', desc: 'AWS keys, OpenAI tokens, DB passwords', color: 'var(--danger)' },
    { icon: AlertTriangle, label: 'Dependency Audit', desc: 'Hallucinated & vulnerable packages', color: 'var(--warning)' },
    { icon: Eye, label: 'PII / GDPR Scan', desc: 'Compliance gaps & data exposure', color: 'var(--cyan)' },
    { icon: Zap, label: 'Prompt Injection', desc: 'AI attack vectors & LLM risks', color: 'var(--pink)' },
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 40px', borderBottom: '1px solid var(--border)',
          background: 'rgba(8, 8, 16, 0.9)', backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--cyan), #0084ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={20} color="#000" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Vibe<span className="text-neon-cyan">Audit</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 999, fontFamily: 'var(--font-mono)' }}>
            PS-01
          </span>
          <span style={{ fontSize: 12, color: 'var(--cyan)', padding: '4px 12px', border: '1px solid var(--border-cyan)', borderRadius: 999, fontFamily: 'var(--font-mono)', background: 'var(--cyan-dim)' }}>
            AI / Security
          </span>
        </div>
      </motion.header>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: 60, maxWidth: 700 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '6px 16px', borderRadius: 999, background: 'var(--cyan-dim)',
            border: '1px solid var(--border-cyan)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)' }} />
            <span style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Production Readiness Scanner
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(42px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 20 }}>
            The{' '}
            <span className="text-neon-cyan">Vibe</span>
            -Audit
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            AI-generated code ships fast — but is it <strong style={{ color: 'var(--text-primary)' }}>actually safe?</strong> Scan your repo for secrets, vulnerabilities, and compliance gaps. Get a <strong style={{ color: 'var(--cyan)' }}>Vibe-to-Value</strong> score.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 999,
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <f.icon size={14} color={f.color} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {f.desc}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{ width: '100%', maxWidth: 600, padding: 32 }}
        >
          {/* Mode Toggle */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 28,
            background: 'var(--bg-secondary)', borderRadius: 10, padding: 4,
          }}>
            {(['zip', 'github'] as InputMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                  transition: 'all 0.2s',
                  background: mode === m ? 'var(--bg-glass)' : 'transparent',
                  color: mode === m ? 'var(--cyan)' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 0 12px var(--cyan-dim), inset 0 0 0 1px var(--border-cyan)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
                    border: `2px dashed ${isDragActive ? 'var(--cyan)' : file ? 'var(--safe)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
                    background: isDragActive ? 'var(--cyan-dim)' : file ? 'var(--safe-dim)' : 'var(--bg-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  <input {...getInputProps()} />
                  <div style={{ marginBottom: 12 }}>
                    {file
                      ? <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--safe-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><Upload size={22} color="var(--safe)" /></div>
                      : <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><Upload size={22} color="var(--cyan)" /></div>
                    }
                  </div>
                  {file ? (
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--safe)' }}>{file.name}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB — ready to scan</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>
                        {isDragActive ? 'Drop it here!' : 'Drag & drop your repo zip'}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse files</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>.zip files only, max 50MB</p>
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
                  <Github size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={e => { setGithubUrl(e.target.value); setError(''); }}
                    placeholder="https://github.com/username/repository"
                    style={{
                      width: '100%', padding: '14px 14px 14px 40px',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 10, color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)', fontSize: 13,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--border-cyan)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
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
              style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--danger-dim)', border: '1px solid rgba(255,45,85,0.3)', fontSize: 13, color: 'var(--danger)' }}
            >
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              className="btn-cyber"
              onClick={handleScan}
              disabled={scanning || (mode === 'zip' ? !file : !githubUrl)}
              style={{
                flex: 1, justifyContent: 'center',
                opacity: (scanning || (mode === 'zip' ? !file : !githubUrl)) ? 0.5 : 1,
                cursor: (scanning || (mode === 'zip' ? !file : !githubUrl)) ? 'not-allowed' : 'pointer',
              }}
            >
              <Shield size={16} />
              {scanning ? 'Scanning...' : 'Run Audit'}
            </button>
            <button
              className="btn-ghost"
              onClick={handleDemo}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Zap size={14} />
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: 32, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {[
            { value: '16+', label: 'Secret Patterns' },
            { value: '40+', label: 'Known Risky Packages' },
            { value: '10+', label: 'GDPR Checks' },
            { value: '100', label: 'Max V2V Score' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--cyan)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        VIbe-Audit · PS-01 · AI / Security Challenge · Curvet AI
      </footer>
    </main>
  );
}
