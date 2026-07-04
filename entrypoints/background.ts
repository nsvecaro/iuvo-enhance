import { defaultProvider } from '@/lib/background/providers';
import type { EnhanceParams } from '@/lib/enhance';

interface EnhanceMessage {
  type: 'iuvo:enhance';
  draftText: string;
  params: EnhanceParams;
}

type EnhanceResponse = { ok: true; result: string } | { ok: false; error: string };

function isEnhanceMessage(message: unknown): message is EnhanceMessage {
  return typeof message === 'object' && message !== null && (message as any).type === 'iuvo:enhance';
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message): Promise<EnhanceResponse> | undefined => {
    if (!isEnhanceMessage(message)) return undefined;

    return defaultProvider
      .rewrite(message.draftText, message.params)
      .then((result): EnhanceResponse => ({ ok: true, result }))
      .catch((err): EnhanceResponse => ({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }));
  });
});
