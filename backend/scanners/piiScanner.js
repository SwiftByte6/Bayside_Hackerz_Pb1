const fs = require('fs-extra');
const path = require('path');

// PII Pattern definitions
const PII_PATTERNS = [
    {
        name: 'Email Address (Hardcoded)',
        regex: /['"][a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}['"]/g,
        severity: 'MEDIUM',
        gdpr: true,
        soc2: true,
        remediation: 'Remove hardcoded email addresses. Use placeholder variables or environment-based config.',
    },
    {
        name: 'Social Security Number (SSN)',
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        severity: 'CRITICAL',
        gdpr: true,
        soc2: true,
        remediation: 'SSNs are highly sensitive PII. Remove immediately and ensure they are never stored in code or logs.',
    },
    {
        name: 'Credit Card Number',
        regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
        severity: 'CRITICAL',
        gdpr: true,
        soc2: true,
        remediation: 'Credit card numbers must never appear in source code. Remove immediately. Use tokenized payment providers (Stripe, Braintree).',
    },
    {
        name: 'Phone Number (Hardcoded)',
        regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        severity: 'LOW',
        gdpr: true,
        soc2: false,
        remediation: 'Avoid hardcoding phone numbers in source code. Use configuration files or environment variables.',
    },
    {
        name: 'IP Address (Hardcoded)',
        regex: /\b(?!10\.|192\.168\.|172\.|127\.|0\.0\.0\.0|255\.255\.255\.255)(?:\d{1,3}\.){3}\d{1,3}\b/g,
        severity: 'LOW',
        gdpr: false,
        soc2: true,
        remediation: 'Avoid hardcoding external IP addresses. Use DNS names or environment config.',
    },
    {
        name: 'Passport Number',
        regex: /passport[_\-\s]*(?:no|number|num)\s*[=:]\s*['"]?[A-Z]{1,2}[0-9]{6,9}['"]?/gi,
        severity: 'CRITICAL',
        gdpr: true,
        soc2: false,
        remediation: 'Passport numbers are sensitive government ID. Remove from code and ensure encrypted storage.',
    },
    {
        name: 'Missing Privacy Policy',
        regex: /(?:collect|store|process|handle)\s+(?:user\s+)?(?:data|information|details)/gi,
        severity: 'MEDIUM',
        gdpr: true,
        soc2: true,
        remediation: 'Ensure a Privacy Policy exists and is linked. Data collection must be disclosed under GDPR Article 13.',
        isCompliance: true,
    },
    {
        name: 'Missing Data Encryption',
        regex: /(?:http:\/\/(?!localhost|127\.0\.0\.1))/g,
        severity: 'HIGH',
        gdpr: true,
        soc2: true,
        remediation: 'Using HTTP (not HTTPS) for external requests violates GDPR data security requirements (Article 32). Use HTTPS.',
    },
    {
        name: 'User Data Logged',
        regex: /console\.log\([^)]*(?:user|email|password|phone|address|ssn|dob)[^)]*\)/gi,
        severity: 'HIGH',
        gdpr: true,
        soc2: true,
        remediation: 'Logging PII data violates GDPR and SOC2. Remove PII from logs or use a redaction library.',
    },
    {
        name: 'No Cookie Consent Check',
        regex: /document\.cookie\s*=/g,
        severity: 'MEDIUM',
        gdpr: true,
        soc2: false,
        remediation: 'Setting cookies without consent check violates GDPR. Implement a cookie consent banner and only set non-essential cookies after consent.',
    },
];

const SCANNABLE_EXTENSIONS = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java',
    '.php', '.cs', '.env', '.yaml', '.yml', '.json', '.html', '.txt',
];

function shouldSkip(filePath) {
    const parts = filePath.split(path.sep);
    return parts.some(p => ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next'].includes(p));
}

/**
 * Scan for PII exposure and GDPR/SOC2 compliance gaps
 */
async function scanPII(rootDir) {
    const issues = [];
    const fileSummary = {};

    async function walkDir(dir) {
        let entries;
        try { entries = await fs.readdir(dir); } catch { return; }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const relPath = path.relative(rootDir, fullPath);

            if (shouldSkip(fullPath)) continue;

            let stat;
            try { stat = await fs.stat(fullPath); } catch { continue; }

            if (stat.isDirectory()) {
                await walkDir(fullPath);
            } else {
                const ext = path.extname(entry);
                if (!SCANNABLE_EXTENSIONS.includes(ext)) continue;

                let content;
                try { content = await fs.readFile(fullPath, 'utf-8'); } catch { continue; }

                const lines = content.split('\n');
                for (const pattern of PII_PATTERNS) {
                    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
                    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                        regex.lastIndex = 0;
                        if (regex.test(lines[lineIdx])) {
                            issues.push({
                                type: 'pii',
                                category: 'pii',
                                name: pattern.name,
                                severity: pattern.severity,
                                file: relPath,
                                line: lineIdx + 1,
                                snippet: lines[lineIdx].trim().substring(0, 100),
                                gdpr: pattern.gdpr,
                                soc2: pattern.soc2,
                                remediation: pattern.remediation,
                                persona: ['security', 'compliance'],
                            });
                            fileSummary[relPath] = (fileSummary[relPath] || 0) + 1;
                        }
                    }
                }
            }
        }
    }

    await walkDir(rootDir);

    // Check for missing .env.example or no README data policy mention
    const hasEnvExample = await fs.pathExists(path.join(rootDir, '.env.example'));
    const hasReadme = await fs.pathExists(path.join(rootDir, 'README.md'));

    if (!hasEnvExample) {
        issues.push({
            type: 'pii',
            category: 'pii',
            name: 'Missing .env.example',
            severity: 'MEDIUM',
            file: '.env.example',
            line: null,
            snippet: 'File not found',
            gdpr: true,
            soc2: true,
            remediation: 'Add a .env.example file documenting all required environment variables (without real values). This is required for SOC2 documentation.',
            persona: ['dev', 'compliance'],
        });
    }

    return {
        issues,
        fileSummary,
        count: issues.length,
        gdprIssues: issues.filter(i => i.gdpr).length,
        soc2Issues: issues.filter(i => i.soc2).length,
    };
}

module.exports = { scanPII };
