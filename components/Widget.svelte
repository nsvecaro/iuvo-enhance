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

  let { adapter, input: initialInput }: Props = $props();

  // Re-resolved via adapter.findInput() when the site replaces the DOM node (e.g. claude.ai on relayout).
  let currentInput: HTMLElement | null = initialInput;

  let panelOpen = $state(false);
  let draftText = $state('');
  let hasApiKey = $state(false);
  let inputVisible = $state(true);
  // Bubble only shows once the draft has text (Grammarly-style).
  let hasText = $state(false);
  // No single caret line to anchor to during a non-collapsed selection.
  let hasSelection = $state(false);

  const BUBBLE_SIZE = 28;
  // Inset from the caret / input edges; bubbleOffset fine-tunes per site.
  const ANCHOR_GAP = 8;
  const CARET_RAISE = 36;

  let bubbleTop = $state(0);
  let bubbleLeft = $state(0);

  // Offset from the input's top/left edges, not viewport coords, so scroll/resize reposition for free,
  // and the last known spot survives the caret leaving the input.
  let lastCaretOffset: number | null = null;
  let lastCaretLeftOffset: number | null = null;

  // Caret rect without mutating the editor, where possible.
  function measureCaretRect(range: Range): DOMRect | null {
    const rects = range.getClientRects();
    for (const r of rects) {
      if (r.height > 0) return r;
    }

    const bounding = range.getBoundingClientRect();
    if (bounding.height > 0) return bounding;

    // Empty-line carets often yield no rect; fall back to the containing block, collapsed to its
    // left edge since the block itself spans the full composer width.
    const node = range.startContainer;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.height > 0) return DOMRect.fromRect({ x: r.left, y: r.top, width: 0, height: r.height });
    }

    // Last resort: insert, measure, and remove a zero-width marker synchronously.
    try {
      const marker = document.createElement('span');
      marker.textContent = '​';
      const markerRange = range.cloneRange();
      markerRange.collapse(true);
      markerRange.insertNode(marker);
      const r = marker.getBoundingClientRect();
      marker.parentNode?.removeChild(marker);
      if (r.height > 0) return r;
    } catch {
      // fall through
    }
    return null;
  }

  function getCaretRect(): DOMRect | null {
    if (!currentInput) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!currentInput.contains(range.startContainer)) return null;
    return measureCaretRect(range);
  }

  function updateSelectionState() {
    const selection = window.getSelection();
    hasSelection =
      !!selection &&
      !selection.isCollapsed &&
      selection.rangeCount > 0 &&
      !!currentInput &&
      currentInput.contains(selection.getRangeAt(0).commonAncestorContainer);
    if (hasSelection) panelOpen = false;
  }

  function updatePosition() {
    if (!currentInput) return;
    const rect = currentInput.getBoundingClientRect();
    const caretRect = getCaretRect();
    if (caretRect) {
      lastCaretOffset = caretRect.top - rect.top;
      lastCaretLeftOffset = caretRect.right - rect.left;
    }

    const lineOffset = lastCaretOffset ?? ANCHOR_GAP;
    bubbleTop = rect.top + lineOffset - CARET_RAISE + (adapter.bubbleOffset?.y ?? 0);

    // Centered above the caret, clamped to the input's box; falls back to the right edge before
    // the caret's ever been measured (e.g. not focused yet).
    const caretLeft = lastCaretLeftOffset !== null ? rect.left + lastCaretLeftOffset : null;
    const minLeft = rect.left + ANCHOR_GAP;
    const maxLeft = rect.right - BUBBLE_SIZE - ANCHOR_GAP;
    const target = caretLeft !== null ? caretLeft - BUBBLE_SIZE / 2 : maxLeft;
    bubbleLeft = Math.min(Math.max(target, minLeft), Math.max(maxLeft, minLeft)) + (adapter.bubbleOffset?.x ?? 0);
  }

  // ProseMirror/Quill leave a zero-width space on "empty" lines that .trim() alone won't catch.
  const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
  function isBlank(text: string): boolean {
    return text.replace(ZERO_WIDTH_RE, '').trim() === '';
  }

  function updateHasText() {
    hasText = !!currentInput && !isBlank(adapter.getValue(currentInput));
    if (!hasText) panelOpen = false;
  }

  // Listeners move with the input element since sites replace it on relayout.
  let listenedInput: HTMLElement | null = null;
  const onInput = () => { updateHasText(); updatePosition(); updateSelectionState(); };
  const onCaretMove = () => { updatePosition(); updateSelectionState(); };

  function attachInputListener(el: HTMLElement | null) {
    if (listenedInput === el) return;
    if (listenedInput) {
      listenedInput.removeEventListener('input', onInput);
      listenedInput.removeEventListener('keyup', onCaretMove);
      listenedInput.removeEventListener('click', onCaretMove);
    }
    listenedInput = el;
    if (el) {
      el.addEventListener('input', onInput);
      el.addEventListener('keyup', onCaretMove);
      el.addEventListener('click', onCaretMove);
    }
  }

  // Compute immediately so the bubble doesn't flash at (0, 0) or miss text already in the input on load.
  updatePosition();
  updateHasText();
  updateSelectionState();

  $effect(() => {
    attachInputListener(currentInput);
    updateHasText();

    const resizeObserver = new ResizeObserver(() => updatePosition());
    if (currentInput) resizeObserver.observe(currentInput);

    // Some editors don't guarantee their DOM is settled by the time 'input' fires, so watch the
    // input's own mutations too (fixes the bubble not hiding right when the draft is cleared).
    const contentObserver = new MutationObserver(() => {
      updateHasText();
      updatePosition();
    });
    if (currentInput) {
      contentObserver.observe(currentInput, { childList: true, subtree: true, characterData: true });
    }

    // Re-finds the input if the site swaps or removes it.
    const mutationObserver = new MutationObserver(() => {
      if (currentInput?.isConnected) return;

      const found = adapter.findInput();
      if (found === currentInput) return;

      resizeObserver.disconnect();
      contentObserver.disconnect();
      currentInput = found;
      inputVisible = !!found;
      attachInputListener(found);
      updateHasText();
      if (found) {
        resizeObserver.observe(found);
        contentObserver.observe(found, { childList: true, subtree: true, characterData: true });
        updatePosition();
      } else {
        panelOpen = false;
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    let rafId = 0;
    const onWindowResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    // selectionchange only fires on document, so filter to selections inside our input.
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (
        sel &&
        sel.rangeCount > 0 &&
        currentInput?.contains(sel.getRangeAt(0).startContainer)
      ) {
        updatePosition();
      }
      updateSelectionState();
    };
    document.addEventListener('selectionchange', onSelectionChange);

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', onWindowResize, { passive: true });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      contentObserver.disconnect();
      attachInputListener(null);
      document.removeEventListener('selectionchange', onSelectionChange);
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', onWindowResize);
    };
  });

  async function toggle() {
    if (!panelOpen) {
      if (!currentInput) return;
      draftText = adapter.getValue(currentInput);
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
    // Re-read here — the user may have kept typing while the panel was open (T-02).
    if (!currentInput) {
      throw new Error('The prompt input disappeared from the page.');
    }
    draftText = adapter.getValue(currentInput);

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
    if (currentInput) adapter.setValue(currentInput, rewrittenText);
    panelOpen = false;
  }

  // Kept for re-verifying setValue on a site after fixing a selector.
  function runWriteTest() {
    if (!currentInput) return;
    const testInput = currentInput;
    const before = adapter.getValue(testInput);
    const marker = `[iuvo test ${Date.now()}]`;
    const testText = before ? `${before} ${marker}` : marker;
    adapter.setValue(testInput, testText);

    setTimeout(() => {
      const after = adapter.getValue(testInput);
      const stuck = after.includes(marker);
      alert(
        stuck
          ? `setValue worked on ${adapter.id}. Try typing more in the box now — if it behaves normally, the mechanism is solid.`
          : `setValue did NOT stick on ${adapter.id}. Check the devtools console and lib/content/adapters/${adapter.id}.ts.`
      );
    }, 50);
  }
</script>

{#if inputVisible && hasText && !hasSelection}
  <button
    class="bubble"
    style="top: {bubbleTop}px; left: {bubbleLeft}px;"
    onclick={toggle}
    aria-label="Open Iuvo">✨</button>

  {#if panelOpen}
    {#if !hasApiKey}
      <ApiKeySetup onSaved={handleKeySaved} onClose={close} />
    {:else}
      <Panel {draftText} onClose={close} onEnhance={handleEnhance} onAccept={handleAccept} />
    {/if}
    <button
      class="dev-test-btn"
      style="top: {bubbleTop + BUBBLE_SIZE + 8}px; left: {bubbleLeft + BUBBLE_SIZE}px;"
      onclick={runWriteTest}>dev: test write</button>
  {/if}
{/if}

<style>
  .bubble {
    position: fixed;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #6c47ff;
    color: white;
    font-size: 13px;
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
    /* Right-aligned to the bubble, extending leftward. */
    transform: translateX(-100%);
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
