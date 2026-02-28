const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { extractZip } = require('../utils/extractor');
const { cloneRepo } = require('../utils/gitCloner');
const { runAllScanners } = require('../scanners');
const { calculateScore } = require('../scoring/engine');

const router = express.Router();

// Multer config for zip uploads
const upload = multer({
    dest: path.join(__dirname, '../tmp/uploads'),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' ||
            file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only .zip files are allowed'));
        }
    }
});

/**
 * POST /api/scan
 * Accepts either:
 *   - multipart/form-data with field "repo" (zip file)
 *   - JSON body with { repoUrl: "https://github.com/..." }
 */
router.post('/scan', upload.single('repo'), async (req, res) => {
    const scanId = uuidv4();
    const workDir = path.join(__dirname, '../tmp', scanId);

    try {
        await fs.ensureDir(workDir);

        let repoPath;
        let repoName = 'uploaded-repo';

        if (req.file) {
            // ZIP upload
            console.log(`[${scanId}] Extracting zip: ${req.file.originalname}`);
            repoName = req.file.originalname.replace('.zip', '');
            repoPath = await extractZip(req.file.path, workDir);
        } else if (req.body && req.body.repoUrl) {
            // GitHub URL
            const { repoUrl } = req.body;
            console.log(`[${scanId}] Cloning repo: ${repoUrl}`);
            repoName = repoUrl.split('/').slice(-2).join('/');
            repoPath = await cloneRepo(repoUrl, workDir);
        } else {
            return res.status(400).json({ error: 'Provide either a zip file or a repoUrl' });
        }

        // Run all scanners
        console.log(`[${scanId}] Running scanners on: ${repoPath}`);
        const scanResults = await runAllScanners(repoPath);

        // Calculate score
        const scoreData = calculateScore(scanResults);

        // Build final report
        const report = {
            scanId,
            repoName,
            timestamp: new Date().toISOString(),
            score: scoreData,
            summary: {
                totalFiles: scanResults.totalFiles,
                totalIssues: scanResults.allIssues.length,
                critical: scanResults.allIssues.filter(i => i.severity === 'CRITICAL').length,
                high: scanResults.allIssues.filter(i => i.severity === 'HIGH').length,
                medium: scanResults.allIssues.filter(i => i.severity === 'MEDIUM').length,
                low: scanResults.allIssues.filter(i => i.severity === 'LOW').length,
            },
            categories: {
                secrets: scanResults.secrets,
                dependencies: scanResults.dependencies,
                pii: scanResults.pii,
                promptInjection: scanResults.promptInjection,
            },
            fileBreakdown: scanResults.fileBreakdown,
            allIssues: scanResults.allIssues,
        };

        console.log(`[${scanId}] Scan complete. Score: ${scoreData.score}`);
        res.json(report);

    } catch (err) {
        console.error(`[${scanId}] Scan failed:`, err.message);
        res.status(500).json({ error: err.message });
    } finally {
        // Cleanup work directory
        await fs.remove(workDir).catch(() => { });
        if (req.file) await fs.remove(req.file.path).catch(() => { });
    }
});

module.exports = router;
