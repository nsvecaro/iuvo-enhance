import anthropicProvider from './anthropic';
import ollamaProvider from './ollama';
import type { ProviderId, RewriteProvider } from './types';

// Default stays BYOK Anthropic; a user-selected id (see lib/storage's activeProvider) picks the
// actual provider at request time via getProvider().
export const defaultProvider: RewriteProvider = anthropicProvider;

// Registry of the providers that are actually implemented. byok-openai / hosted-backend are
// build-order steps not built yet, so they're absent and fall back to the default.
const providers: Partial<Record<ProviderId, RewriteProvider>> = {
  'byok-anthropic': anthropicProvider,
  'self-hosted-ollama': ollamaProvider,
};

export function getProvider(id: ProviderId): RewriteProvider {
  return providers[id] ?? defaultProvider;
}

export { anthropicProvider, ollamaProvider };
export type { RewriteProvider, ProviderId } from './types';
