const express = require('express');
const { runAnalyticsAgent } = require('../agents/analyticsAgent');
const { runEngineerAgent } = require('../agents/engineerAgent');
const { runTestingAgent } = require('../agents/testingAgent');
const { runReportAgent } = require('../agents/reportAgent');

const router = express.Router();

// 1. Analytics
router.post('/step/analytics', async (req, res) => {
    const { report } = req.body;
    if (!report) return res.status(400).json({ error: 'Missing report' });
    try {
        const data = await runAnalyticsAgent(report);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Engineer
router.post('/step/engineer', async (req, res) => {
    const { report, openaiKey, provider, ollamaModel, ollamaBase, customPrompt } = req.body;
    if (!report) return res.status(400).json({ error: 'Missing report' });
    try {
        const data = await runEngineerAgent(report, openaiKey, provider, ollamaModel, ollamaBase, customPrompt);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Testing
router.post('/step/testing', async (req, res) => {
    const { report, engineer } = req.body;
    if (!report || !engineer) return res.status(400).json({ error: 'Missing report or engineer data' });
    try {
        const data = await runTestingAgent(report, engineer);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Report
router.post('/step/report', async (req, res) => {
    const { report, analytics, engineer, testing, openaiKey, provider, ollamaModel, ollamaBase, customPrompt } = req.body;
    if (!report || !analytics || !engineer || !testing) return res.status(400).json({ error: 'Missing required previous steps' });
    try {
        const data = await runReportAgent(report, analytics, engineer, testing, openaiKey, provider, ollamaModel, ollamaBase, customPrompt);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
