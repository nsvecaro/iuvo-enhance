import type { ProviderId } from '@/lib/background/providers/types';

// T-06 (threat model): API keys go ONLY in local storage, never sync.
export const anthropicApiKey = storage.defineItem<string>('local:anthropicApiKey', {
  fallback: '',
});

// Which provider the background worker uses per request. Local so it never leaves the machine
// alongside the key. Defaults to BYOK Anthropic to match defaultProvider.
export const activeProvider = storage.defineItem<ProviderId>('local:activeProvider', {
  fallback: 'byok-anthropic',
});
