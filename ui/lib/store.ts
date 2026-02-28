/**
 * In-memory store for the scan report.
 * Avoids sessionStorage 5MB quota limits for large repos.
 */
import { ScanReport } from './api';

let _report: ScanReport | null = null;
let _repoName: string = '';

export function setReport(report: ScanReport, repoName: string) {
    _report = report;
    _repoName = repoName;
}

export function getReport(): ScanReport | null {
    return _report;
}

export function getRepoName(): string {
    return _repoName;
}

export function clearReport() {
    _report = null;
    _repoName = '';
}
