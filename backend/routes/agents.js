const express = require('express');
const { runPipeline } = require('../agents/pipeline');

const router = express.Router();

/**
 * POST /api/agents/run
 * Body: { report, openaiKey?, provider?, ollamaModel?, ollamaBase?, customPrompt? }
 * provider: 'openai' | 'ollama'
 */
router.post('/run', async (req, res) => {
    const { report, openaiKey, provider = 'openai', ollamaModel = 'llama3.2', ollamaBase = 'http://localhost:11434/v1', customPrompt = '' } = req.body;

    if (!report || !report.scanId) {
        return res.status(400).json({ error: 'Invalid or missing scan report in request body.' });
    }

    console.log(`[Agents] Pipeline start — repo: ${report.repoName}, provider: ${provider}${provider === 'ollama' ? ` (${ollamaModel})` : ''}`);

    try {
        const result = await runPipeline(report, openaiKey, provider, ollamaModel, ollamaBase, customPrompt);
        res.json(result);
    } catch (err) {
        console.error('[Agents] Pipeline error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
