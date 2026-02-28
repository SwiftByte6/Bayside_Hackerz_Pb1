/**
 * Scoring Engine — Vibe-to-Value Score
 *
 * Base score: 100
 * Deductions:
 *   CRITICAL: -20 per issue (min floor: 0 per issue)
 *   HIGH:     -10 per issue
 *   MEDIUM:   -5  per issue
 *   LOW:      -2  per issue
 *
 * Score bands:
 *   0-40:  DANGER  (No-Go)
 *   41-70: RISKY   (Conditional Go)
 *   71-100: SAFE   (Go)
 */

const DEDUCTIONS = {
    CRITICAL: 20,
    HIGH: 10,
    MEDIUM: 5,
    LOW: 2,
};

const SCORE_BANDS = [
    { min: 0, max: 40, label: 'DANGER', verdict: 'No-Go', color: '#ff2d55', emoji: '🔴' },
    { min: 41, max: 70, label: 'RISKY', verdict: 'Conditional Go', color: '#ffa500', emoji: '🟡' },
    { min: 71, max: 100, label: 'PRODUCTION READY', verdict: 'Go', color: '#00ff88', emoji: '🟢' },
];

/**
 * Calculate the Vibe-to-Value score from scan results
 */
function calculateScore(scanResults) {
    const { allIssues } = scanResults;

    let score = 100;
    let totalDeductions = 0;

    const deductionBreakdown = {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
    };

    for (const issue of allIssues) {
        const deduction = DEDUCTIONS[issue.severity] || 0;
        totalDeductions += deduction;
        deductionBreakdown[issue.severity] = (deductionBreakdown[issue.severity] || 0) + deduction;
    }

    score = Math.max(0, score - totalDeductions);

    // Find the band
    const band = SCORE_BANDS.find(b => score >= b.min && score <= b.max) || SCORE_BANDS[0];

    // Category scores
    const categoryScores = {
        secrets: categoryScore(scanResults.secrets.issues),
        dependencies: categoryScore(scanResults.dependencies.issues),
        pii: categoryScore(scanResults.pii.issues),
        promptInjection: categoryScore(scanResults.promptInjection.issues),
    };

    // Top recommendations (unique, sorted by severity)
    const recommendations = generateRecommendations(allIssues);

    return {
        score,
        totalDeductions,
        deductionBreakdown,
        label: band.label,
        verdict: band.verdict,
        color: band.color,
        emoji: band.emoji,
        categoryScores,
        recommendations,
    };
}

function categoryScore(issues) {
    let deductions = 0;
    for (const issue of issues) {
        deductions += DEDUCTIONS[issue.severity] || 0;
    }
    return Math.max(0, 100 - deductions);
}

function generateRecommendations(allIssues) {
    // Deduplicate by name and sort CRITICAL first
    const seen = new Set();
    const unique = [];
    const sorted = [...allIssues].sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.severity] || 3) - (order[b.severity] || 3);
    });

    for (const issue of sorted) {
        if (!seen.has(issue.name)) {
            seen.add(issue.name);
            unique.push({
                severity: issue.severity,
                name: issue.name,
                remediation: issue.remediation,
                category: issue.category,
                occurrences: allIssues.filter(i => i.name === issue.name).length,
            });
        }
        if (unique.length >= 10) break;
    }

    return unique;
}

module.exports = { calculateScore };
