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

  {/* ---------------- Feature Section ---------------- */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      flex: 1,
      gap: '20px',
      maxWidth: '42rem',
    }}
  >
      <h1
        style={{
          fontSize: '2.25rem',
          lineHeight: 1.2,
          fontWeight: 700,
          background: 'linear-gradient(to bottom, #ffffff, rgba(255,255,255,0.2))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
      Cyber Security Scan
    </h1>

    {features.map((f, i) => (
      <motion.div
        key={f.label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + i * 0.08 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderRadius: '9999px',
          border: `1px solid ${f.border}`,
          background: f.bg,
          backdropFilter: 'blur(8px)',
          transition: 'all 300ms ease',
        }}
      >
        <f.icon size={16} style={{ color: f.color, transition: 'all 200ms ease' }} />
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#ffffff',
          }}
        >
          {f.label}
        </span>
        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)' }}>
          — {f.desc}
        </span>
      </motion.div>
    ))}
  </motion.div>

  {/* ---------------- Upload Card ---------------- */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    style={{
      width: '100%',
      maxWidth: '36rem',
      padding: '32px',
      borderRadius: '1rem',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 0 40px rgba(255,255,255,0.05)',
    }}
  >

    {/* Mode Toggle */}
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        background: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '0.75rem',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {(['zip', 'github'] as InputMode[]).map(m => (
        <button
          key={m}
          onClick={() => { setMode(m); setError(''); }}
          className="interactive-hover"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 200ms ease',
            background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: mode === m ? '#ffffff' : 'rgba(255,255,255,0.45)',
            border: mode === m ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
            cursor: 'pointer',
          }}
        >
          {m === 'zip' ? <Upload size={15} /> : <Github size={15} />}
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
              borderWidth: '2px',
              borderStyle: 'dashed',
              borderColor: isDragActive ? '#ffffff' : file ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
              borderRadius: '0.75rem',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 300ms ease',
              background: isDragActive ? 'rgba(255,255,255,0.1)' : file ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <input {...getInputProps()} />

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />
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
        className="interactive-hover"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          paddingTop: '16px',
          paddingBottom: '16px',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 300ms ease',
          border: 'none',
          background: isScanDisabled ? 'rgba(255,255,255,0.1)' : '#ffffff',
          color: isScanDisabled ? 'rgba(255,255,255,0.45)' : '#000000',
          cursor: isScanDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        <Shield size={16} />
        {scanning ? 'Scanning...' : 'Run Audit'}
      </button>

      <button
        onClick={handleDemo}
        className="interactive-hover"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '16px 24px',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255,255,255,0.2)',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#ffffff',
          background: 'transparent',
          transition: 'all 300ms ease',
          cursor: 'pointer',
        }}
      >
        <Zap size={15} />
        View Demo
      </button>
    </div>
  </motion.div>
</div>
    <Pricing />
    </>
  );
}
