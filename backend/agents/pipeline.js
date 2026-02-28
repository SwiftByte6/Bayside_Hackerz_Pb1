/**
 * Agent Pipeline Orchestrator
 * Supports OpenAI and Ollama providers.
 * Passes customPrompt to LLM agents for user-guided outputs.
 */

const { runAnalyticsAgent } = require('./analyticsAgent');
const { runEngineerAgent } = require('./engineerAgent');
const { runTestingAgent } = require('./testingAgent');
const { runReportAgent } = require('./reportAgent');

async function runPipeline(
    report,
    apiKey,
    provider = 'openai',
    ollamaModel = 'llama3.2',
    ollamaBase = 'http://localhost:11434/v1',
    customPrompt = ''
) {
    const startTime = Date.now();
    const providerLabel = provider === 'ollama' ? `Ollama (${ollamaModel})` : 'OpenAI';
    console.log(`[Pipeline] Provider: ${providerLabel}${customPrompt ? ' | Custom prompt: active' : ''}`);

    console.log('[Pipeline] Step 1/4: Analytics Agent');
    const analytics = await runAnalyticsAgent(report);

    console.log('[Pipeline] Step 2/4: Engineer Agent');
    const engineer = await runEngineerAgent(report, apiKey, provider, ollamaModel, ollamaBase, customPrompt);

    console.log('[Pipeline] Step 3/4: Testing Agent');
    const testing = await runTestingAgent(report, engineer);

    console.log('[Pipeline] Step 4/4: Report Agent');
    const finalReport = await runReportAgent(report, analytics, engineer, testing, apiKey, provider, ollamaModel, ollamaBase, customPrompt);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Pipeline] ✅ Complete in ${elapsed}s via ${providerLabel}`);

    return {
        pipelineId: `pipeline-${Date.now()}`,
        elapsed: `${elapsed}s`,
        provider: providerLabel,
        analytics,
        engineer,
        testing,
        report: finalReport,
    };
}

module.exports = { runPipeline };
