import type { EnhanceParams } from '@/lib/enhance';

export type ProviderId = 'byok-anthropic' | 'byok-openai' | 'self-hosted-ollama' | 'hosted-backend';

// One interface behind BYOK / self-hosted / hosted providers (doc 6.4) so the background worker
// and UI never need to know which one is active.
export interface RewriteProvider {
  id: ProviderId;
  rewrite(draftText: string, params: EnhanceParams): Promise<string>;
}
