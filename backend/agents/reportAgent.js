/**
 * Agent 4: Report Agent
 * LLM-powered — supports OpenAI and Ollama (local, free).
 * Generates the final Go/No-Go executive report.
 * Accepts a customPrompt to steer tone, format, or focus.
 */

const OpenAI = require('openai');

async function runReportAgent(
    report, analytics, engineer, testing,
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
    const context = buildContext(report, analytics, engineer, testing);

    const baseSystem = 'You are a senior security auditor. Write a concise production readiness report in markdown. Be direct. Max 400 words.';
    const systemContent = customPrompt.trim()
        ? `${baseSystem}\n\nAdditional instructions: ${customPrompt.trim()}`
        : baseSystem;

    try {
        const response = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: context },
            ],
            max_tokens: 600,
            temperature: 0.3,
        });

        const markdown = response.choices[0].message.content.trim();
        return {
            agentName: 'Report Agent',
            status: 'done',
            model,
            provider,
            customPromptUsed: customPrompt.trim().length > 0,
            verdict: testing.afterScore.verdict,
            verdictColor: testing.afterScore.color,
            passed: testing.passed,
            markdown,
            tokensUsed: response.usage?.total_tokens || 0,
        };
    } catch (err) {
        if (!isOllama && (err.status === 401 || err.status === 403)) {
            throw new Error('Invalid OpenAI API key — authentication failed.');
        }
        if (isOllama && err.code === 'ECONNREFUSED') {
            throw new Error(`Cannot connect to Ollama at ${ollamaBase}. Is Ollama running? Run: ollama serve`);
        }
        throw err;
    }
}

function buildContext(report, analytics, engineer, testing) {
    const top3 = (analytics.trendInsights || []).slice(0, 3).join(' ');
    const fixedList = (engineer.fixes || []).map(f => `- ${f.issue.name} (${f.issue.severity}): ${f.fix.diffSummary}`).join('\n');
    const remainCrit = (testing.remainingCritical || []).map(r => `- ${r.name} in ${r.file}`).join('\n');
    const s = report.summary || {};
    return `Write a production readiness report for repo: "${report.repoName}".

Scores: Before ${testing.beforeScore.score}/100 (${testing.beforeScore.verdict}) → After ${testing.afterScore.score}/100 (${testing.afterScore.verdict})
Issues: ${s.totalIssues || 0} total (critical: ${s.critical || 0}, high: ${s.high || 0})
Key Findings: ${top3}
Engineer Fixed:\n${fixedList || 'None'}
Remaining Critical:\n${remainCrit || 'None'}

Write: 1) Executive Summary (2-3 sentences, Go/No-Go) 2) Risk Table 3) What Was Fixed 4) What Needs Manual Work 5) Next Steps (3 bullets)`;
}

module.exports = { runReportAgent };
