const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');

const router = express.Router();

// Helper to interact with Ollama
async function callOllama(messages, model, baseUrl, systemPrompt) {
    // If the frontend passed a '/v1' URL for compatibility, strip it for native Ollama API
    let base = baseUrl || 'http://127.0.0.1:11434';
    if (base.endsWith('/v1')) base = base.replace(/\/v1$/, '');

    const url = `${base}/api/chat`;

    // Ensure system prompt is first
    const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    try {
        const response = await axios.post(url, {
            model: model || 'qwen2.5-coder:3b',
            messages: fullMessages,
            stream: false,
            options: { temperature: 0.7 }
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000 // 60s timeout
        });

        return response.data.message.content;
    } catch (err) {
        const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        throw new Error(`Ollama chat failed: ${detail} (URL: ${url})`);
    }
}

// Helper to interact with OpenAI
async function callOpenAI(messages, model, apiKey, systemPrompt) {
    if (!apiKey) throw new Error('OpenAI API key is required');

    const client = new OpenAI({ apiKey });

    const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    try {
        const response = await client.chat.completions.create({
            model: model || 'gpt-3.5-turbo',
            messages: fullMessages,
            temperature: 0.7,
        });

        return response.choices[0].message.content;
    } catch (err) {
        throw new Error(`OpenAI chat failed: ${err.message}`);
    }
}

router.post('/', async (req, res) => {
    try {
        const { messages, reportSummary, provider, model, baseUrl, apiKey } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        // Create a system prompt that includes context about the codebase
        const systemPrompt = `You are VibeAudit's expert AI security and engineering assistant. 
You are chatting with the developer about their codebase scan results.

Here is the context of their codebase scan:
- Repository: ${reportSummary?.repoName || 'Unknown'}
- Vibe-to-value score: ${reportSummary?.score?.score || 0}/100 (${reportSummary?.score?.verdict || 'Unknown'})
- Total Issues: ${reportSummary?.summary?.totalIssues || 0} (${reportSummary?.summary?.critical} Critical, ${reportSummary?.summary?.high} High)

Your goal is to answer their questions about the code, explain security issues, and provide helpful, concise advice. Use markdown for code and formatting. Be conversational but highly technical.`;

        let reply = '';

        if (provider === 'openai') {
            reply = await callOpenAI(messages, model, apiKey, systemPrompt);
        } else {
            // Default to ollama / local
            reply = await callOllama(messages, model, baseUrl, systemPrompt);
        }

        res.json({ reply });

    } catch (err) {
        console.error('[Chat Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
