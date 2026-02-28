/**
 * Agent 1: Analytics Agent
 * Pure computation — zero LLM calls, zero API cost.
 * Generates statistical insights, chart data and risk metrics from the scan report.
 */

async function runAnalyticsAgent(report) {
    // Null-safe defaults — handles partial or malformed report objects
    const summary = report.summary || { totalFiles: 0, totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 };
    const fileBreakdown = report.fileBreakdown || [];
    const allIssues = report.allIssues || [];
    const score = report.score || { score: 0, label: 'N/A', verdict: 'N/A', color: '#888', categoryScores: { secrets: 0, dependencies: 0, pii: 0, promptInjection: 0 } };
    const categories = report.categories || {
        secrets: { count: 0, critical: 0 },
        dependencies: { count: 0 },
        pii: { count: 0 },
        promptInjection: { count: 0 },
    };

    // ── 1. File Risk Scores (0–100, higher = riskier) ─────────────────────────
    const fileRiskScores = fileBreakdown.map(f => {
        let risk = 0;
        for (const issue of (f.issues || [])) {
            if (issue.severity === 'CRITICAL') risk += 40;
            else if (issue.severity === 'HIGH') risk += 20;
            else if (issue.severity === 'MEDIUM') risk += 10;
            else risk += 5;
        }
        return {
            file: f.file,
            riskScore: Math.min(100, risk),
            riskLevel: f.riskLevel,
            issueCount: f.issueCount,
        };
    }).sort((a, b) => b.riskScore - a.riskScore);

    // ── 2. Severity Distribution ───────────────────────────────────────────────
    const total = summary.totalIssues || 0;
    const pct = (n) => total > 0 ? ((n / total) * 100).toFixed(1) : '0';
    const severityDistribution = [
        { name: 'Critical', value: summary.critical, color: '#ff2d55', percentage: pct(summary.critical) },
        { name: 'High', value: summary.high, color: '#ff9500', percentage: pct(summary.high) },
        { name: 'Medium', value: summary.medium, color: '#ffd600', percentage: pct(summary.medium) },
        { name: 'Low', value: summary.low, color: '#00e676', percentage: pct(summary.low) },
    ];

    // ── 3. Category Breakdown Chart ────────────────────────────────────────────
    const categoryBreakdown = [
        { name: 'Secrets', count: categories.secrets.count, score: score.categoryScores.secrets, color: '#ff2d55' },
        { name: 'Dependencies', count: categories.dependencies.count, score: score.categoryScores.dependencies, color: '#ff9500' },
        { name: 'PII / GDPR', count: categories.pii.count, score: score.categoryScores.pii, color: '#00d9ff' },
        { name: 'AI Security', count: categories.promptInjection.count, score: score.categoryScores.promptInjection, color: '#e040fb' },
    ];

    // ── 4. Top 5 Riskiest Files ────────────────────────────────────────────────
    const topRiskyFiles = fileRiskScores.slice(0, 5);

    // ── 5. Issue type frequency ────────────────────────────────────────────────
    const issueFrequency = {};
    for (const issue of allIssues) {
        if (issue && issue.name) {
            issueFrequency[issue.name] = (issueFrequency[issue.name] || 0) + 1;
        }
    }
    const issueFrequencyChart = Object.entries(issueFrequency)
        .map(([name, count]) => ({ name: name.length > 30 ? name.substring(0, 28) + '…' : name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // ── 6. Language-text trend insights ───────────────────────────────────────
    const sortedCats = [...categoryBreakdown].sort((a, b) => b.count - a.count);
    const worstCategory = sortedCats[0];
    const worstFile = topRiskyFiles[0];
    const criticalRatio = total > 0 ? ((summary.critical / total) * 100).toFixed(0) : '0';

    const trendInsights = [
        `🔴 ${criticalRatio}% of all issues are CRITICAL — immediate remediation required before production.`,
        worstCategory && worstCategory.count > 0
            ? `🏆 Worst category: "${worstCategory.name}" with ${worstCategory.count} issues (score: ${worstCategory.score}/100).`
            : null,
        worstFile
            ? `📁 Riskiest file: \`${worstFile.file}\` with a risk score of ${worstFile.riskScore}/100.`
            : null,
        summary.critical > 0
            ? `⚡ ${summary.critical} CRITICAL issue(s) detected — each causes a -20pt deduction. Highest remediation ROI.`
            : '✅ No CRITICAL issues found.',
        (categories.secrets.critical || 0) > 0
            ? `🔑 ${categories.secrets.critical} hardcoded secret(s) — rotate these keys IMMEDIATELY.`
            : '🔑 No hardcoded secrets in CRITICAL severity.',
        categories.promptInjection.count > 0
            ? `⚠️ ${categories.promptInjection.count} AI security issue(s) — prompt injection risk detected.`
            : null,
        `📊 Vibe-to-Value score: ${score.score}/100 (${score.label}) — verdict: ${score.verdict}.`,
        `🗂 ${summary.totalFiles} files scanned, ${fileBreakdown.length} files have issues.`,
    ].filter(Boolean);

    return {
        agentName: 'Analytics Agent',
        status: 'done',
        fileRiskScores,
        severityDistribution,
        categoryBreakdown: [...categoryBreakdown].sort((a, b) => b.count - a.count),
        topRiskyFiles,
        issueFrequencyChart,
        trendInsights,
        meta: {
            totalFiles: summary.totalFiles,
            affectedFiles: fileBreakdown.length,
            criticalRatio: `${criticalRatio}%`,
            overallScore: score.score,
        },
    };
}

module.exports = { runAnalyticsAgent };
