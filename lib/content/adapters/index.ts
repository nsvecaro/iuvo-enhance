import type { SiteAdapter } from './types';
import chatgptAdapter from './chatgpt';
import claudeAdapter from './claude';
import geminiAdapter from './gemini';
import perplexityAdapter from './perplexity';

export const adapters: SiteAdapter[] = [chatgptAdapter, claudeAdapter, geminiAdapter, perplexityAdapter];

export function getAdapterForHostname(hostname: string): SiteAdapter | null {
  return adapters.find((a) => hostname.includes(a.hostname)) ?? null;
}

export type { SiteAdapter };
