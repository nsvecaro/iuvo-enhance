import anthropicProvider from './anthropic';
import type { RewriteProvider } from './types';

// Only one provider exists so far (build order step 3). When self-hosted
// Ollama / hosted backend are added later (steps 6-7), this is where a
// user-selected provider would be looked up instead of a hardcoded default.
export const defaultProvider: RewriteProvider = anthropicProvider;

export type { RewriteProvider, ProviderId } from './types';
