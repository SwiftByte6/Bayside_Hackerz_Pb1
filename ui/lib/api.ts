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
