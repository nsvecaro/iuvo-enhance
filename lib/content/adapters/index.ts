import type { SiteAdapter } from './types';
import chatgptAdapter from './chatgpt';
import claudeAdapter from './claude';

export const adapters: SiteAdapter[] = [chatgptAdapter, claudeAdapter];

export function getAdapterForHostname(hostname: string): SiteAdapter | null {
  return adapters.find((a) => hostname.includes(a.hostname)) ?? null;
}

export type { SiteAdapter };
