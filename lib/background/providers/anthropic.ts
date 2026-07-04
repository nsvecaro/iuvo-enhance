import type { RewriteProvider } from './types';
import type { EnhanceParams } from '@/lib/enhance';
import { anthropicApiKey } from '@/lib/storage';

const MODEL = 'claude-sonnet-5';

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

const anthropicProvider: RewriteProvider = {
  id: 'byok-anthropic',

  async rewrite(draftText, params) {
    const apiKey = await anthropicApiKey.getValue();
    if (!apiKey) {
      throw new Error('No Anthropic API key set. Add one in the extension popup.');
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required for calling the Messages API directly from a browser/extension context.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system:
          'You rewrite draft prompts that a user is about to send to an LLM chat assistant. ' +
          'Rewrite the draft below to be clearer and better specified, following the given ' +
          'style instructions. Reply with ONLY the rewritten prompt text, no preamble, no ' +
          'commentary, no markdown fences.',
        messages: [
          {
            role: 'user',
            content: `Style instructions: ${buildInstruction(params)}\n\nDraft:\n${draftText}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (typeof text !== 'string') {
      throw new Error('Anthropic API returned an unexpected response shape.');
    }
    return text;
  },
};

export default anthropicProvider;
