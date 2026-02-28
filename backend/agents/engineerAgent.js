/**
 * Agent 2: Engineer Agent
 * LLM-powered — supports OpenAI and Ollama (local, free).
 * Generates code fixes for top 3 CRITICAL/HIGH issues.
 * Accepts a custom system prompt to guide the LLM's behaviour.
 */

const OpenAI = require('openai');

async function runEngineerAgent(
    report,
    apiKey,
    provider = 'openai',
    ollamaModel = 'llama3.2',
    ollamaBase = 'http://localhost:11434/v1',
    customPrompt = ''
) {
    const isOllama = provider === 'ollama';

    if (!isOllama && !apiKey && !process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key required. Please enter your key, or switch to Ollama (free, local).');
    }

    const openai = isOllama
        ? new OpenAI({ apiKey: 'ollama', baseURL: ollamaBase })
        : new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });

    const model = isOllama ? ollamaModel : 'gpt-3.5-turbo';

    // Top 3 CRITICAL → HIGH → MEDIUM issues
    const priorityIssues = [...(report.allIssues || [])]
        .sort((a, b) => {
            const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
        })
        .slice(0, 3);

    const fixes = [];
    for (const issue of priorityIssues) {
        try {
            const fix = await generateFix(openai, model, issue, customPrompt);
            fixes.push(fix);
        } catch (err) {
            console.error(`  [Engineer Agent] LLM error for "${issue.name}":`, err.message);
            if (!isOllama && (err.status === 401 || err.status === 403)) {
                throw new Error('Invalid OpenAI API key — authentication failed. Please check your key.');
            }
            if (isOllama && err.code === 'ECONNREFUSED') {
                throw new Error(`Cannot connect to Ollama at ${ollamaBase}. Is Ollama running? Run: ollama serve`);
            }
            // Skip on transient errors (rate limit, timeout, etc.)
        }
    }

    const allCount = (report.allIssues || []).length;
    return {
        agentName: 'Engineer Agent',
        status: 'done',
        model,
        provider,
        customPromptUsed: customPrompt.trim().length > 0,
        issuesAddressed: fixes.length,
        fixes,
        skippedCount: allCount - priorityIssues.length,
        note: `Addressed top ${priorityIssues.length} priority issues via ${isOllama ? `Ollama (${model})` : 'OpenAI gpt-3.5-turbo'}. ${allCount - priorityIssues.length} lower-severity issues require manual review.`,
    };
}

async function generateFix(openai, model, issue, customPrompt = '') {
    // Build merged system prompt
    const baseSystem = 'You are a senior security engineer. Respond ONLY in valid JSON with keys: fixedCode, explanation, diffSummary. No markdown fences. No extra text.';
    const systemContent = customPrompt.trim()
        ? `${baseSystem}\n\nAdditional instructions: ${customPrompt.trim()}`
        : baseSystem;

    const response = await openai.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: systemContent },
            {
                role: 'user',
                content: `Issue: ${issue.name} (${issue.severity})
File: ${issue.file}${issue.line ? `, line ${issue.line}` : ''}
Code: ${issue.snippet || 'N/A'}
Problem: ${issue.remediation}

Return JSON: { "fixedCode": "corrected snippet", "explanation": "1-2 sentences", "diffSummary": "one-line summary" }`,
            },
        ],
        max_tokens: 400,
        temperature: 0.2,
    });

    const raw = response.choices[0].message.content.trim();
    const clean = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
    let parsed;
    try {
        parsed = JSON.parse(clean);
    } catch {
        parsed = { fixedCode: 'See explanation below.', explanation: raw.substring(0, 200), diffSummary: 'Manual review required.' };
    }

    return {
        issue: { name: issue.name, severity: issue.severity, file: issue.file, line: issue.line, snippet: issue.snippet },
        fix: parsed,
        tokensUsed: response.usage?.total_tokens || 0,
    };
}

module.exports = { runEngineerAgent };
