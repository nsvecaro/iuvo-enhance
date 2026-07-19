import anthropicProvider from './anthropic';
import type { RewriteProvider } from './types';

// Only provider so far; a user-selected lookup replaces this once Ollama/hosted backend exist.
export const defaultProvider: RewriteProvider = anthropicProvider;

export type { RewriteProvider, ProviderId } from './types';
