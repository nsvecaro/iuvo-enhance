import type { RewriteProvider } from './types';
import type { EnhanceParams } from '@/lib/enhance';

// Ollama's OpenAI-compatible endpoint. Local-only, no auth (T-07: never expose 11434 to the net).
const ENDPOINT = 'http://localhost:11434/v1/chat/completions';
// Configurable: any locally pulled model works (e.g. 'deepseek-r1', 'qwen2.5'). Default per build order.
const MODEL = 'llama3.2';

const DEPTH_TEXT: Record<EnhanceParams['depth'], string> = {
  brief: 'Keep explanations brief and to the point.',
  standard: 'Use a standard level of detail.',
  detailed: 'Go into detailed, thorough explanations.',
};

const SIMPLIFICATION_TEXT: Record<EnhanceParams['simplification'], string> = {
  'as-is': 'Keep the technical level of the original wording.',
  simplify: 'Simplify the language so it is easy to follow.',
  eli5: 'Explain it like the reader is a beginner with no background (ELI5).',
};

const TONE_TEXT: Record<EnhanceParams['tone'], string> = {
  neutral: 'neutral',
  casual: 'casual and conversational',
  formal: 'formal and professional',
  technical: 'precise and technical',
};

const LENGTH_TEXT: Record<EnhanceParams['length'], string> = {
  short: 'short',
  medium: 'medium-length',
  long: 'long and comprehensive',
};

const FORMAT_TEXT: Record<EnhanceParams['format'], string> = {
  prose: 'plain prose',
  bulleted: 'a bulleted list',
  'step-by-step': 'numbered step-by-step instructions',
};

function buildInstruction(params: EnhanceParams): string {
  return [
    DEPTH_TEXT[params.depth],
    SIMPLIFICATION_TEXT[params.simplification],
    `Use a ${TONE_TEXT[params.tone]} tone.`,
    `Target a ${LENGTH_TEXT[params.length]} response.`,
    `Format the output as ${FORMAT_TEXT[params.format]}.`,
  ].join(' ');
}

const ollamaProvider: RewriteProvider = {
  id: 'self-hosted-ollama',

  async rewrite(draftText, params) {
    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          messages: [
            {
              role: 'system',
              content:
                'You rewrite draft prompts that a user is about to send to an LLM chat assistant. ' +
                'Rewrite the draft below to be clearer and better specified, following the given ' +
                'style instructions. Reply with ONLY the rewritten prompt text, no preamble, no ' +
                'commentary, no markdown fences.',
            },
            {
              role: 'user',
              content: `Style instructions: ${buildInstruction(params)}\n\nDraft:\n${draftText}`,
            },
          ],
        }),
      });
    } catch {
      // A refused connection / DNS failure surfaces as a TypeError from fetch, not an HTTP status.
      throw new Error('Ollama is not running. Start it with: ollama serve');
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new Error('Ollama API returned an unexpected response shape.');
    }
    return text;
  },
};

export default ollamaProvider;
