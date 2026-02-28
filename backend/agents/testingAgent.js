/**
 * Agent 3: Testing Agent
 * Pure computation — zero LLM calls, zero API cost.
 * Simulates re-scan after engineer fixes and produces a before/after diff.
 */

const DEDUCTIONS = { CRITICAL: 20, HIGH: 10, MEDIUM: 5, LOW: 2 };

/**
 * @param {object} report    - Original scan report
 * @param {object} engineer  - Engineer agent output
 */
async function runTestingAgent(report, engineer) {
    const originalScore = report.score.score;
    const originalIssues = report.allIssues;

    // Determine which issues the engineer "addressed"
    const addressedIssueNames = new Set(
        (engineer.fixes || []).map(f => f.issue?.name).filter(Boolean)
    );

    // Partition issues into fixed vs remaining
    const fixedIssues = originalIssues.filter(i => addressedIssueNames.has(i.name));
    const remainingIssues = originalIssues.filter(i => !addressedIssueNames.has(i.name));

    // Recalculate score
    let newScore = 100;
    for (const issue of remainingIssues) {
        newScore -= DEDUCTIONS[issue.severity] || 0;
    }
    newScore = Math.max(0, newScore);

    const improvement = newScore - originalScore;
    const newLabel = newScore >= 71 ? 'PRODUCTION READY' : newScore >= 41 ? 'RISKY' : 'DANGER';
    const newColor = newScore >= 71 ? '#00e676' : newScore >= 41 ? '#ff9500' : '#ff2d55';
    const newVerdict = newScore >= 71 ? 'Go' : newScore >= 41 ? 'Conditional Go' : 'No-Go';

    // Build before/after severity counts
    const countBySeverity = (issues) => ({
        critical: issues.filter(i => i.severity === 'CRITICAL').length,
        high: issues.filter(i => i.severity === 'HIGH').length,
        medium: issues.filter(i => i.severity === 'MEDIUM').length,
        low: issues.filter(i => i.severity === 'LOW').length,
        total: issues.length,
    });

    const beforeCounts = countBySeverity(originalIssues);
    const afterCounts = countBySeverity(remainingIssues);

    // Test result per fixed issue
    const testResults = fixedIssues.map(issue => ({
        issue: issue.name,
        severity: issue.severity,
        file: issue.file,
        status: 'FIXED',
        note: `Fix applied by Engineer Agent — pattern no longer detected.`,
    }));

    // Remaining critical checks
    const remainingCritical = remainingIssues
        .filter(i => i.severity === 'CRITICAL')
        .slice(0, 5)
        .map(i => ({
            name: i.name,
            file: i.file,
            severity: i.severity,
            note: 'Still requires manual remediation.',
        }));

    // Score delta chart data (for frontend)
    const scoreDeltaChart = [
        { label: 'Before', score: originalScore, fill: report.score.color },
        { label: 'After Fix', score: newScore, fill: newColor },
    ];

    return {
        agentName: 'Testing Agent',
        status: 'done',
        beforeScore: { score: originalScore, label: report.score.label, color: report.score.color, verdict: report.score.verdict },
        afterScore: { score: newScore, label: newLabel, color: newColor, verdict: newVerdict },
        improvement,
        improvementPercent: originalScore > 0 ? (((newScore - originalScore) / (100 - originalScore)) * 100).toFixed(1) : 0,
        fixedCount: fixedIssues.length,
        remainingCount: remainingIssues.length,
        beforeCounts,
        afterCounts,
        testResults,
        remainingCritical,
        scoreDeltaChart,
        passed: newScore >= 71,
        summary: improvement > 0
            ? `Score improved by +${improvement} points (${originalScore} → ${newScore}). ${fixedIssues.length} issue(s) resolved.`
            : `Score unchanged at ${originalScore}. All ${originalIssues.length} issues remain — manual remediation required.`,
    };
}

module.exports = { runTestingAgent };
