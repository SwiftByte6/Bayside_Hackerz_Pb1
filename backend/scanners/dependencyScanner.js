const fs = require('fs-extra');
const path = require('path');

// Known hallucinated / typosquatted packages (common vibe-coding mistakes)
const HALLUCINATED_PACKAGES = new Set([
    // Typosquats of popular packages
    'lodahs', 'expres', 'expresss', 'reakt', 'rectjs',
    'mongoos', 'mongoosee', 'reqwest', 'requesst', 'axioos',
    'cooors', 'webpack-cli2', 'react-dom2', 'eslint2',
    'node-fetch2', 'dotenvv', 'momentjs', 'momnet',
    'bode', 'nod', 'exprees', 'node-express',
    // Non-existent packages often hallucinated by AI
    'openai-node', 'gpt-api', 'chatgpt-client', 'openai-chat',
    'ai-helper', 'llm-utils', 'gpt-utils', 'ai-sdk-node',
    'nextjs-auth', 'react-auth-kit2', 'express-auth-middleware',
    'db-connector', 'mongo-helper', 'sql-builder',
    'crypto-utils', 'encrypt-helper', 'hash-utils',
]);

// Deprecated / known vulnerable packages
const DEPRECATED_PACKAGES = {
    'request': { reason: 'Deprecated since 2020. Use axios or node-fetch instead.', severity: 'MEDIUM' },
    'node-uuid': { reason: 'Replaced by the uuid package.', severity: 'LOW' },
    'crypto-js': { reason: 'Use Node.js built-in crypto module instead.', severity: 'MEDIUM' },
    'md5': { reason: 'MD5 is cryptographically broken. Use bcrypt or argon2.', severity: 'HIGH' },
    'sha1': { reason: 'SHA-1 is deprecated. Use SHA-256+ instead.', severity: 'HIGH' },
    'gulp': { reason: 'Consider modern alternatives like esbuild or Vite.', severity: 'LOW' },
    'bower': { reason: 'Bower is deprecated. Use npm/yarn instead.', severity: 'MEDIUM' },
    'xmlhttprequest': { reason: 'Use fetch or axios in modern code.', severity: 'LOW' },
    'colors': { reason: 'Maintainer published malicious version. Use chalk instead.', severity: 'HIGH' },
    'event-stream': { reason: 'Previously compromised. Avoid or vet carefully.', severity: 'HIGH' },
    'flatmap-stream': { reason: 'Known malicious package.', severity: 'CRITICAL' },
    'left-pad': { reason: 'Historic supply chain incident. Use string.padStart() instead.', severity: 'LOW' },
    'node-ipc': { reason: 'Contained malicious code in versions 10.1.1 and 10.1.2.', severity: 'HIGH' },
    'ua-parser-js': { reason: 'Was compromised with cryptominer in v0.7.29, v0.8.0, v1.0.0.', severity: 'CRITICAL' },
    'coa': { reason: 'Was compromised and published with malicious code.', severity: 'CRITICAL' },
    'rc': { reason: 'Was compromised. Audit carefully.', severity: 'HIGH' },
};

// Packages with stars/downloads that are commonly risky
const RISKY_PATTERNS = [
    { pattern: /eval\(/, name: 'Dynamic eval usage', severity: 'HIGH' },
    { pattern: /new Function\(/, name: 'Dynamic Function constructor', severity: 'HIGH' },
    { pattern: /child_process\.exec\(/, name: 'Shell exec usage', severity: 'MEDIUM' },
    { pattern: /require\(['"]child_process['"]\)/, name: 'child_process import', severity: 'LOW' },
];

async function findPackageJsonFiles(rootDir) {
    const pkgFiles = [];

    async function walk(dir) {
        let entries;
        try { entries = await fs.readdir(dir); } catch { return; }
        for (const entry of entries) {
            if (['node_modules', '.git', 'dist', 'build'].includes(entry)) continue;
            const fullPath = path.join(dir, entry);
            let stat;
            try { stat = await fs.stat(fullPath); } catch { continue; }
            if (stat.isDirectory()) await walk(fullPath);
            else if (entry === 'package.json') pkgFiles.push(fullPath);
        }
    }

    await walk(rootDir);
    return pkgFiles;
}

/**
 * Scan dependencies for hallucinations and known vulnerabilities
 */
async function scanDependencies(rootDir) {
    const issues = [];
    const fileSummary = {};

    const pkgFiles = await findPackageJsonFiles(rootDir);

    for (const pkgFile of pkgFiles) {
        let pkg;
        try {
            pkg = await fs.readJson(pkgFile);
        } catch {
            continue;
        }

        const relPath = path.relative(rootDir, pkgFile);
        const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
            ...pkg.peerDependencies,
        };

        for (const [name, version] of Object.entries(allDeps || {})) {
            // Check for hallucinated packages
            if (HALLUCINATED_PACKAGES.has(name)) {
                issues.push({
                    type: 'dependency',
                    category: 'dependencies',
                    name: `Hallucinated Package: ${name}`,
                    severity: 'HIGH',
                    file: relPath,
                    line: null,
                    snippet: `"${name}": "${version}"`,
                    remediation: `Package "${name}" appears to be a hallucinated/non-existent package. Verify it exists on npmjs.com and replace with the correct package.`,
                    persona: ['dev', 'security'],
                });
                fileSummary[relPath] = (fileSummary[relPath] || 0) + 1;
            }

            // Check for deprecated/vulnerable packages
            if (DEPRECATED_PACKAGES[name]) {
                const info = DEPRECATED_PACKAGES[name];
                issues.push({
                    type: 'dependency',
                    category: 'dependencies',
                    name: `Risky Package: ${name}`,
                    severity: info.severity,
                    file: relPath,
                    line: null,
                    snippet: `"${name}": "${version}"`,
                    remediation: info.reason,
                    persona: ['dev', 'security'],
                });
                fileSummary[relPath] = (fileSummary[relPath] || 0) + 1;
            }

            // Check for wildcard versions
            if (version === '*' || version === 'latest') {
                issues.push({
                    type: 'dependency',
                    category: 'dependencies',
                    name: `Unpinned Version: ${name}`,
                    severity: 'MEDIUM',
                    file: relPath,
                    line: null,
                    snippet: `"${name}": "${version}"`,
                    remediation: `Pin dependency "${name}" to a specific semver version (e.g. "^1.2.3") to avoid supply chain attacks.`,
                    persona: ['dev', 'security'],
                });
                fileSummary[relPath] = (fileSummary[relPath] || 0) + 1;
            }
        }
    }

    // Scan for risky code patterns
    const jsFiles = await findJsFiles(rootDir);
    for (const filePath of jsFiles) {
        const relPath = path.relative(rootDir, filePath);
        let content;
        try { content = await fs.readFile(filePath, 'utf-8'); } catch { continue; }

        const lines = content.split('\n');
        for (const { pattern, name, severity } of RISKY_PATTERNS) {
            for (let i = 0; i < lines.length; i++) {
                if (pattern.test(lines[i])) {
                    issues.push({
                        type: 'dependency',
                        category: 'dependencies',
                        name,
                        severity,
                        file: relPath,
                        line: i + 1,
                        snippet: lines[i].trim().substring(0, 100),
                        remediation: `Avoid using ${name} in production code. It may be exploitable for Remote Code Execution.`,
                        persona: ['dev', 'security'],
                    });
                    fileSummary[relPath] = (fileSummary[relPath] || 0) + 1;
                }
            }
        }
    }

    return { issues, fileSummary, count: issues.length };
}

async function findJsFiles(rootDir) {
    const files = [];
    async function walk(dir) {
        let entries;
        try { entries = await fs.readdir(dir); } catch { return; }
        for (const entry of entries) {
            if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) continue;
            const fullPath = path.join(dir, entry);
            let stat;
            try { stat = await fs.stat(fullPath); } catch { continue; }
            if (stat.isDirectory()) await walk(fullPath);
            else if (['.js', '.ts', '.jsx', '.tsx'].includes(path.extname(entry))) files.push(fullPath);
        }
    }
    await walk(rootDir);
    return files;
}

module.exports = { scanDependencies };
