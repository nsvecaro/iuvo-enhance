import type { EnhanceParams } from '@/lib/enhance';

export type ProviderId = 'byok-anthropic' | 'byok-openai' | 'self-hosted-ollama' | 'hosted-backend';

// See architecture doc 6.4 — one interface behind BYOK / self-hosted / hosted
// providers so the background worker and UI never need to know which one is
// active. Only 'byok-anthropic' exists so far (build order step 3).
export interface RewriteProvider {
  id: ProviderId;
  rewrite(draftText: string, params: EnhanceParams): Promise<string>;
}
