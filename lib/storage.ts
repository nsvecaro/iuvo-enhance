// T-06 (threat model): API keys go ONLY in local storage, never sync.
export const anthropicApiKey = storage.defineItem<string>('local:anthropicApiKey', {
  fallback: '',
});
