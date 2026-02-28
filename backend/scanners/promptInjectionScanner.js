const fs = require('fs-extra');
const path = require('path');

// Prompt injection pattern definitions
const INJECTION_PATTERNS = [
    {
        name: 'Direct Injection: Ignore Previous Instructions',
        regex: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/gi,
        severity: 'CRITICAL',
        remediation: 'This is a classic prompt injection pattern. Sanitize user inputs before passing to LLMs. Use an allow-list approach for user-supplied content in prompts.',
    },
    {
        name: 'System Prompt Override Attempt',
        regex: /(?:you are now|act as|pretend to be|disregard your|forget your)\s+(?:a\s+)?(?:new|different|another)?\s*(?:ai|assistant|bot|model|gpt)/gi,
        severity: 'HIGH',
        remediation: 'Potential jailbreak/persona injection. Validate that user content cannot override system prompts. Separate system instructions from user data using structured message roles.',
    },
    {
        name: 'Template Injection in Prompt',
        regex: /\{\{[^}]*\}\}|\$\{[^}]*\}/g,
        severity: 'HIGH',
        remediation: 'Template literals in AI prompts can lead to injection attacks. Use parameterized prompt construction rather than string interpolation with user data.',
    },
    {
        name: 'Unsanitized User Input Passed to LLM',
        regex: /(?:prompt|message|input|query|text)\s*[+=]\s*(?:req\.body|req\.query|req\.params|request\.body|params\.|body\.)/gi,
        severity: 'CRITICAL',
        remediation: 'User input is being directly concatenated into LLM prompts without sanitization. Validate, sanitize, and limit user inputs before including them in AI prompts.',
    },
    {
        name: 'Hidden Instruction Pattern',
        regex: /<!--\s*(?:hidden|secret|system)?\s*prompt/gi,
        severity: 'HIGH',
        remediation: 'Hidden prompts in HTML comments can expose AI configurations. Remove hidden instructions and use proper system prompt channels.',
    },
    {
        name: 'System Role Override',
        regex: /role\s*:\s*['"]system['"]\s*,\s*content\s*:\s*(?:req|request|body|params|user)/gi,
        severity: 'CRITICAL',
        remediation: 'System role content must never come from user input. Only use hardcoded, validated system prompts.',
    },
    {
        name: 'Unvalidated Prompt Concatenation',
        regex: /(?:systemPrompt|userPrompt|aiPrompt|llmPrompt)\s*[+=]\s*[`"'][^`"']*[`"']\s*\+\s*(?:req\.|user|body\.|input\.|params\.)/gi,
        severity: 'HIGH',
        remediation: 'Prompt string concatenation with external data detected. Use a structured prompt builder with input validation.',
    },
    {
        name: 'Leaked System Prompt',
        regex: /(?:print|console\.log|log|puts|echo)\s*\(?\s*(?:systemPrompt|system_prompt|basePrompt|base_prompt)/gi,
        severity: 'MEDIUM',
        remediation: 'System prompts should never be logged or printed. This could expose your AI configuration and instructions.',
    },
    {
        name: 'No Input Length Limit on AI Request',
        regex: /openai\.(?:chat\.)?completions\.create|anthropic\.|groq\.|huggingface\.|together\.ai/gi,
        severity: 'MEDIUM',
        remediation: 'Ensure all AI API calls have input length limits to prevent prompt injection attacks and cost overruns. Add max_tokens limits and input validation.',
    },
    {
        name: 'SQL Injection via LLM Output',
        regex: /(?:query|execute|db\.run)\s*\([^)]*(?:llm|ai|gpt|completion|response)\.?(?:text|content|output|result)/gi,
        severity: 'CRITICAL',
        remediation: 'Using LLM output directly in database queries is extremely dangerous. Always use parameterized queries and validate AI-generated content before DB operations.',
    },
];

const SCANNABLE_EXTENSIONS = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.php', '.cs',
];

function shouldSkip(filePath) {
    const parts = filePath.split(path.sep);
    return parts.some(p => ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next'].includes(p));
}

/**
 * Scan for AI prompt injection vulnerabilities
 */
async function scanPromptInjection(rootDir) {
    const issues = [];
    const fileSummary = {};

    async function walkDir(dir) {
        let entries;
        try { entries = await fs.readdir(dir); } catch { return; }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const relPath = path.relative(rootDir, fullPath);

            if (shouldSkip(fullPath)) continue;

            let stat;
            try { stat = await fs.stat(fullPath); } catch { continue; }

            if (stat.isDirectory()) {
                await walkDir(fullPath);
            } else {
                const ext = path.extname(entry);
                if (!SCANNABLE_EXTENSIONS.includes(ext)) continue;

                let content;
                try { content = await fs.readFile(fullPath, 'utf-8'); } catch { continue; }

                const lines = content.split('\n');
                for (const pattern of INJECTION_PATTERNS) {
                    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
                    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                        regex.lastIndex = 0;
                        if (regex.test(lines[lineIdx])) {
                            issues.push({
                                type: 'promptInjection',
                                category: 'promptInjection',
                                name: pattern.name,
                                severity: pattern.severity,
                                file: relPath,
                                line: lineIdx + 1,
                                snippet: lines[lineIdx].trim().substring(0, 100),
                                remediation: pattern.remediation,
                                persona: ['security', 'dev'],
                            });
                            fileSummary[relPath] = (fileSummary[relPath] || 0) + 1;
                        }
                    }
                }
            }
        }
    }

    await walkDir(rootDir);

    return {
        issues,
        fileSummary,
        count: issues.length,
        critical: issues.filter(i => i.severity === 'CRITICAL').length,
    };
}

module.exports = { scanPromptInjection };
