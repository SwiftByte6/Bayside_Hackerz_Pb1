const { scanSecrets } = require('./secretScanner');
const { scanDependencies } = require('./dependencyScanner');
const { scanPII } = require('./piiScanner');
const { scanPromptInjection } = require('./promptInjectionScanner');
const fs = require('fs-extra');
const path = require('path');

/**
 * Run all scanners against a repository path
 * @param {string} repoPath - path to the repository
 * @returns {object} aggregated scan results
 */
async function runAllScanners(repoPath) {
    console.log('  → Running secret scanner...');
    const secrets = await scanSecrets(repoPath);

    console.log('  → Running dependency scanner...');
    const dependencies = await scanDependencies(repoPath);

    console.log('  → Running PII/compliance scanner...');
    const pii = await scanPII(repoPath);

    console.log('  → Running prompt injection scanner...');
    const promptInjection = await scanPromptInjection(repoPath);

    // Aggregate all issues
    const allIssues = [
        ...secrets.issues,
        ...dependencies.issues,
        ...pii.issues,
        ...promptInjection.issues,
    ];

    // Count total files scanned
    const totalFiles = await countFiles(repoPath);

    // Build per-file breakdown
    const fileBreakdownMap = {};
    for (const issue of allIssues) {
        if (!fileBreakdownMap[issue.file]) {
            fileBreakdownMap[issue.file] = {
                file: issue.file,
                issues: [],
                riskLevel: 'LOW',
                issueCount: 0,
            };
        }
        fileBreakdownMap[issue.file].issues.push(issue);
        fileBreakdownMap[issue.file].issueCount++;
    }

    // Determine risk level per file
    for (const fileData of Object.values(fileBreakdownMap)) {
        const hasCritical = fileData.issues.some(i => i.severity === 'CRITICAL');
        const hasHigh = fileData.issues.some(i => i.severity === 'HIGH');
        const hasMedium = fileData.issues.some(i => i.severity === 'MEDIUM');
        if (hasCritical) fileData.riskLevel = 'CRITICAL';
        else if (hasHigh) fileData.riskLevel = 'HIGH';
        else if (hasMedium) fileData.riskLevel = 'MEDIUM';
        else fileData.riskLevel = 'LOW';
    }

    const fileBreakdown = Object.values(fileBreakdownMap).sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return order[a.riskLevel] - order[b.riskLevel];
    });

    return {
        totalFiles,
        allIssues,
        fileBreakdown,
        secrets: {
            count: secrets.count,
            critical: secrets.critical,
            issues: secrets.issues,
        },
        dependencies: {
            count: dependencies.count,
            issues: dependencies.issues,
        },
        pii: {
            count: pii.count,
            gdprIssues: pii.gdprIssues,
            soc2Issues: pii.soc2Issues,
            issues: pii.issues,
        },
        promptInjection: {
            count: promptInjection.count,
            critical: promptInjection.critical,
            issues: promptInjection.issues,
        },
    };
}

async function countFiles(dir, count = { val: 0 }) {
    let entries;
    try { entries = await fs.readdir(dir); } catch { return count.val; }
    for (const entry of entries) {
        if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) continue;
        const fullPath = path.join(dir, entry);
        let stat;
        try { stat = await fs.stat(fullPath); } catch { continue; }
        if (stat.isDirectory()) await countFiles(fullPath, count);
        else count.val++;
    }
    return count.val;
}

module.exports = { runAllScanners };
