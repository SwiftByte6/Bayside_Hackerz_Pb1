import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ScanReport {
    scanId: string;
    repoName: string;
    timestamp: string;
    score: {
        score: number;
        totalDeductions: number;
        deductionBreakdown: Record<string, number>;
        label: string;
        verdict: string;
        color: string;
        emoji: string;
        categoryScores: {
            secrets: number;
            dependencies: number;
            pii: number;
            promptInjection: number;
        };
        recommendations: Array<{
            severity: string;
            name: string;
            remediation: string;
            category: string;
            occurrences: number;
        }>;
    };
    summary: {
        totalFiles: number;
        totalIssues: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    categories: {
        secrets: { count: number; critical: number; issues: Issue[] };
        dependencies: { count: number; issues: Issue[] };
        pii: { count: number; gdprIssues: number; soc2Issues: number; issues: Issue[] };
        promptInjection: { count: number; critical: number; issues: Issue[] };
    };
    fileBreakdown: FileBreakdown[];
    allIssues: Issue[];
}

export interface Issue {
    type: string;
    category: string;
    name: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    file: string;
    line: number | null;
    snippet: string;
    remediation: string;
    persona: string[];
    gdpr?: boolean;
    soc2?: boolean;
}

export interface FileBreakdown {
    file: string;
    issues: Issue[];
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    issueCount: number;
}

export async function scanZip(file: File, onProgress?: (phase: string) => void): Promise<ScanReport> {
    const formData = new FormData();
    formData.append('repo', file);
    onProgress?.('Uploading repository...');
    const response = await axios.post<ScanReport>(`${API_BASE}/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
    });
    return response.data;
}

export async function scanGitHub(repoUrl: string, onProgress?: (phase: string) => void): Promise<ScanReport> {
    onProgress?.('Cloning repository...');
    const response = await axios.post<ScanReport>(`${API_BASE}/scan`, { repoUrl }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
    });
    return response.data;
}

export interface PipelineResult {
    pipelineId: string;
    elapsed: string;
    provider: string;
    analytics: {
        agentName: string;
        status: string;
        fileRiskScores: Array<{ file: string; riskScore: number; riskLevel: string; issueCount: number }>;
        severityDistribution: Array<{ name: string; value: number; color: string; percentage: string }>;
        categoryBreakdown: Array<{ name: string; count: number; score: number; color: string }>;
        topRiskyFiles: Array<{ file: string; riskScore: number; riskLevel: string; issueCount: number }>;
        issueFrequencyChart: Array<{ name: string; count: number }>;
        trendInsights: string[];
        meta: { totalFiles: number; affectedFiles: number; criticalRatio: string; overallScore: number };
    };
    engineer: {
        agentName: string;
        status: string;
        model: string;
        provider: string;
        issuesAddressed: number;
        fixes: Array<{
            issue: { name: string; severity: string; file: string; line: number | null; snippet: string };
            fix: { fixedCode: string; explanation: string; diffSummary: string };
            tokensUsed: number;
        }>;
        skippedCount: number;
        note: string;
    };
    testing: {
        agentName: string;
        status: string;
        beforeScore: { score: number; label: string; color: string; verdict: string };
        afterScore: { score: number; label: string; color: string; verdict: string };
        improvement: number;
        improvementPercent: string;
        fixedCount: number;
        remainingCount: number;
        beforeCounts: { critical: number; high: number; medium: number; low: number; total: number };
        afterCounts: { critical: number; high: number; medium: number; low: number; total: number };
        testResults: Array<{ issue: string; severity: string; file: string; status: string; note: string }>;
        remainingCritical: Array<{ name: string; file: string; severity: string; note: string }>;
        scoreDeltaChart: Array<{ label: string; score: number; fill: string }>;
        passed: boolean;
        summary: string;
    };
    report: {
        agentName: string;
        status: string;
        model: string;
        provider: string;
        verdict: string;
        verdictColor: string;
        passed: boolean;
        markdown: string;
        tokensUsed: number;
    };
}

export async function runAgentStep(step: 'analytics', payload: object): Promise<PipelineResult['analytics']>;
export async function runAgentStep(step: 'engineer', payload: object): Promise<PipelineResult['engineer']>;
export async function runAgentStep(step: 'testing', payload: object): Promise<PipelineResult['testing']>;
export async function runAgentStep(step: 'report', payload: object): Promise<PipelineResult['report']>;
export async function runAgentStep(step: string, payload: object): Promise<any> {
    const response = await axios.post(
        `${API_BASE}/agents/step/${step}`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 300000 }
    );
    return response.data;
}
