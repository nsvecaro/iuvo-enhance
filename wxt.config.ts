import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    // Scoped to the one BYOK provider that exists (T-08: never <all_urls>).
    host_permissions: ['https://api.anthropic.com/*'],
    // Required for chrome.storage (API key + any future presets/prefs) to work
    // anywhere, including content scripts.
    permissions: ['storage'],
  },
});
