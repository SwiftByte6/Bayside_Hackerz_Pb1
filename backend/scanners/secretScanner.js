const fs = require('fs-extra');
const path = require('path');

// Comprehensive secret patterns
const SECRET_PATTERNS = [
    {
        name: 'AWS Access Key',
        regex: /AKIA[0-9A-Z]{16}/g,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'AWS Secret Key',
        regex: /aws[_\-\s]*secret[_\-\s]*access[_\-\s]*key\s*[=:]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'Generic API Key',
        regex: /(?:api[_\-]?key|apikey)\s*[=:]\s*['"]([A-Za-z0-9\-_]{16,})['"]/gi,
        severity: 'HIGH',
        category: 'secrets',
    },
    {
        name: 'Private Key (RSA/SSH)',
        regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'Google API Key',
        regex: /AIza[0-9A-Za-z\-_]{35}/g,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'GitHub Token',
        regex: /ghp_[A-Za-z0-9]{36}/g,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'GitHub OAuth',
        regex: /gho_[A-Za-z0-9]{36}/g,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'Stripe Secret Key',
        regex: /sk_live_[A-Za-z0-9]{24,}/g,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'Stripe Test Key',
        regex: /sk_test_[A-Za-z0-9]{24,}/g,
        severity: 'MEDIUM',
        category: 'secrets',
    },
    {
        name: 'JWT Secret',
        regex: /jwt[_\-]?secret\s*[=:]\s*['"]([^'"]{8,})['"]/gi,
        severity: 'HIGH',
        category: 'secrets',
    },
    {
        name: 'Database Password',
        regex: /(?:db|database|mysql|postgres|mongo)[_\-]?(?:pass(?:word)?|pwd)\s*[=:]\s*['"]([^'"]{4,})['"]/gi,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'Hardcoded Password',
        regex: /(?:password|passwd|pwd)\s*[=:]\s*['"](?!.*\$\{)([^'"]{4,})['"]/gi,
        severity: 'HIGH',
        category: 'secrets',
    },
    {
        name: 'OpenAI API Key',
        regex: /sk-[A-Za-z0-9]{48}/g,
        severity: 'CRITICAL',
        category: 'secrets',
    },
    {
        name: 'Slack Token',
        regex: /xox[baprs]-[A-Za-z0-9\-]{10,}/g,
        severity: 'HIGH',
        category: 'secrets',
    },
    {
        name: 'SendGrid API Key',
        regex: /SG\.[A-Za-z0-9\-_]{22}\.[A-Za-z0-9\-_]{43}/g,
        severity: 'HIGH',
        category: 'secrets',
    },
    {
        name: 'Twilio Auth Token',
        regex: /(?:twilio|auth[_\-]?token)\s*[=:]\s*['"]([a-f0-9]{32})['"]/gi,
        severity: 'HIGH',
        category: 'secrets',
    },
    {
        name: 'Bearer Token Hardcoded',
        regex: /Authorization\s*:\s*['"]?Bearer\s+[A-Za-z0-9\-_.~+/]+=*/g,
        severity: 'HIGH',
        category: 'secrets',
    },
];

// File extensions to scan
const SCANNABLE_EXTENSIONS = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java',
    '.php', '.cs', '.cpp', '.c', '.sh', '.bash', '.env', '.yaml',
    '.yml', '.json', '.toml', '.ini', '.conf', '.config', '.xml',
    '.properties', '.tf', '.tfvars',
];

// Files/dirs to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', 'vendor'];
const SKIP_FILES = ['.min.js', '.lock', 'yarn.lock', 'package-lock.json'];

function shouldSkip(filePath) {
    const parts = filePath.split(path.sep);
    if (parts.some(p => SKIP_DIRS.includes(p))) return true;
    if (SKIP_FILES.some(s => filePath.endsWith(s))) return true;
    return false;
}

/**
 * Scan a directory for hardcoded secrets and sensitive data
 */
async function scanSecrets(rootDir) {
    const issues = [];
    const fileSummary = {};

    async function walkDir(dir) {
        let entries;
        try {
            entries = await fs.readdir(dir);
        } catch {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const relPath = path.relative(rootDir, fullPath);

            if (shouldSkip(fullPath)) continue;

            let stat;
            try {
                stat = await fs.stat(fullPath);
            } catch {
                continue;
            }

            if (stat.isDirectory()) {
                await walkDir(fullPath);
            } else {
                const ext = path.extname(entry);
                if (!SCANNABLE_EXTENSIONS.includes(ext) && !entry.startsWith('.env')) continue;

                let content;
                try {
                    content = await fs.readFile(fullPath, 'utf-8');
                } catch {
                    continue;
                }

                const lines = content.split('\n');
                for (const pattern of SECRET_PATTERNS) {
                    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
                    let match;
                    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                        regex.lastIndex = 0;
                        while ((match = regex.exec(lines[lineIdx])) !== null) {
                            const issue = {
                                type: 'secret',
                                category: 'secrets',
                                name: pattern.name,
                                severity: pattern.severity,
                                file: relPath,
                                line: lineIdx + 1,
                                snippet: lines[lineIdx].trim().substring(0, 100),
                                remediation: `Remove hardcoded ${pattern.name} from source code. Use environment variables: process.env.SECRET_NAME or a secrets manager (AWS Secrets Manager, HashiCorp Vault).`,
                                persona: ['dev', 'security'],
                            };
                            issues.push(issue);
                            fileSummary[relPath] = (fileSummary[relPath] || 0) + 1;
                        }
                    }
                }
            }
        }
    }

    await walkDir(rootDir);

    return {
        issues,
        fileSummary,
        count: issues.length,
        critical: issues.filter(i => i.severity === 'CRITICAL').length,
    };
}

module.exports = { scanSecrets };
