<script lang="ts">
  import Panel from './Panel.svelte';
  import ApiKeySetup from './ApiKeySetup.svelte';
  import type { SiteAdapter } from '@/lib/content/adapters';
  import type { EnhanceParams } from '@/lib/enhance';
  import { anthropicApiKey } from '@/lib/storage';

  interface Props {
    adapter: SiteAdapter;
    input: HTMLElement;
  }

  let { adapter, input }: Props = $props();

  let panelOpen = $state(false);
  let draftText = $state('');
  let hasApiKey = $state(false);

  async function toggle() {
    if (!panelOpen) {
      draftText = adapter.getValue(input);
      hasApiKey = !!(await anthropicApiKey.getValue());
    }
    panelOpen = !panelOpen;
  }

  function handleKeySaved() {
    hasApiKey = true;
  }

  function close() {
    panelOpen = false;
  }

  async function handleEnhance(params: EnhanceParams): Promise<string> {
    // Re-read right before sending — the user may have kept typing while the
    // panel was open, and T-02 requires sending exactly what's shown, not a
    // stale snapshot from when the panel opened.
    draftText = adapter.getValue(input);

    const response = await browser.runtime.sendMessage({
      type: 'iuvo:enhance',
      draftText,
      params,
    });

    if (!response?.ok) {
      throw new Error(response?.error ?? 'Enhance failed for an unknown reason.');
    }
    return response.result;
  }

  function handleAccept(rewrittenText: string) {
    adapter.setValue(input, rewrittenText);
    panelOpen = false;
  }

  // Step 1's read/write proof, kept reachable for re-verifying on a site
  // (e.g. after fixing a selector) without digging through git history.
  function runWriteTest() {
    const before = adapter.getValue(input);
    const marker = `[iuvo test ${Date.now()}]`;
    const testText = before ? `${before} ${marker}` : marker;
    adapter.setValue(input, testText);

    setTimeout(() => {
      const after = adapter.getValue(input);
      const stuck = after.includes(marker);
      alert(
        stuck
          ? `setValue worked on ${adapter.id}. Try typing more in the box now — if it behaves normally, the mechanism is solid.`
          : `setValue did NOT stick on ${adapter.id}. Check the devtools console and lib/content/adapters/${adapter.id}.ts.`
      );
    }, 50);
  }
</script>

<button class="bubble" onclick={toggle} aria-label="Open Iuvo">✨</button>

{#if panelOpen}
  {#if !hasApiKey}
    <ApiKeySetup onSaved={handleKeySaved} onClose={close} />
  {:else}
    <Panel {draftText} onClose={close} onEnhance={handleEnhance} onAccept={handleAccept} />
  {/if}
  <button class="dev-test-btn" onclick={runWriteTest}>dev: test write</button>
{/if}

<style>
  .bubble {
    position: fixed;
    bottom: 120px;
    right: 32px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #6c47ff;
    color: white;
    font-size: 18px;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dev-test-btn {
    position: fixed;
    bottom: 120px;
    right: 344px;
    background: #34343d;
    color: #b3b3bd;
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    cursor: pointer;
    z-index: 999999;
  }

  .dev-test-btn:hover {
    background: #3f3f4a;
  }
</style>
