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

  // The prop is only the input found at mount time. Sites like claude.ai
  // REPLACE the input element on resize/relayout, so we must never hold onto
  // it — currentInput is re-resolved via adapter.findInput() whenever the DOM
  // says our element is gone.
  let currentInput: HTMLElement | null = initialInput;

  let panelOpen = $state(false);
  let draftText = $state('');
  let hasApiKey = $state(false);
  let inputVisible = $state(true);
  // Grammarly-style: the bubble only appears once the draft has text, and hides
  // again when the input is emptied. All three sites read via adapter.getValue
  // (el.innerText), so one trim-based check works uniformly.
  let hasText = $state(false);

  // Horizontally the bubble hugs the input's right edge; vertically it follows
  // the line the caret is on (see updatePosition). Viewport-relative
  // (getBoundingClientRect + position: fixed).
  const BUBBLE_SIZE = 28;
  // Small inset from the right edge; per-adapter bubbleOffset fine-tunes per site.
  const ANCHOR_GAP = 8;
  // How many px above the caret line's top edge the bubble sits.
  const CARET_RAISE = 6;

  let bubbleTop = $state(0);
  let bubbleLeft = $state(0);

  // Vertical position of the caret's line, stored as an offset from the input's
  // top edge (not an absolute viewport y) so scroll/resize reposition it for
  // free via rect.top, and it survives the caret moving out of our input (focus
  // elsewhere) — we just keep the last known line. null = never measured yet.
  let lastCaretOffset: number | null = null;

  // Measure the client rect of the current caret line without mutating the
  // editor where possible. Returns null if it can't be measured.
  function measureCaretRect(range: Range): DOMRect | null {
    // Collapsed caret usually still yields a rect here; prefer one with height.
    const rects = range.getClientRects();
    for (const r of rects) {
      if (r.height > 0) return r;
    }

    const bounding = range.getBoundingClientRect();
    if (bounding.height > 0) return bounding;

    // Empty line / caret at line end can yield zero rects. Fall back to the
    // element the caret sits in (e.g. the empty <p>), which carries the line's
    // box — no DOM mutation, so no risk to the editor's model.
    const node = range.startContainer;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.height > 0) return r;
    }

    // Last resort (rarely reached given the fallback above): briefly insert a
    // zero-width marker at the caret, measure it, and remove it synchronously so
    // the net DOM change is nil. Guarded so it can never break the page.
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

  // Viewport-space top of the line the caret is on, or null if the caret isn't
  // inside our input or can't be measured.
  function getCaretLineTop(): number | null {
    if (!currentInput) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!currentInput.contains(range.startContainer)) return null;
    const rect = measureCaretRect(range);
    return rect ? rect.top : null;
  }

  function updatePosition() {
    if (!currentInput) return;
    const rect = currentInput.getBoundingClientRect();
    // Horizontal: fixed to the input's right edge, never follows the caret.
    bubbleLeft = rect.right - BUBBLE_SIZE - ANCHOR_GAP + (adapter.bubbleOffset?.x ?? 0);

    // Vertical: track the caret line. Store as an offset from the input top so
    // scroll/resize reposition correctly and a lost caret keeps its last line.
    const caretTop = getCaretLineTop();
    if (caretTop !== null) lastCaretOffset = caretTop - rect.top;
    const lineOffset = lastCaretOffset ?? ANCHOR_GAP;
    bubbleTop = rect.top + lineOffset - CARET_RAISE + (adapter.bubbleOffset?.y ?? 0);
  }

  // Reflects whether the current input holds any non-whitespace text; drives
  // whether the bubble is shown. Clearing the input also closes the panel,
  // mirroring how losing the input entirely does (see MutationObserver below).
  function updateHasText() {
    hasText = !!currentInput && adapter.getValue(currentInput).trim() !== '';
    if (!hasText) panelOpen = false;
  }

  // Edit + caret listeners live on whichever element is currently the input.
  // Sites replace the input on relayout, so we track the element we're bound to
  // and move the listeners when it changes.
  let listenedInput: HTMLElement | null = null;
  // Typing changes both the text (show/hide) and the caret line (vertical pos).
  const onInput = () => { updateHasText(); updatePosition(); };
  // Caret can move without editing (arrow keys, clicking into another line).
  const onCaretMove = () => updatePosition();

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

  // Compute immediately so the bubble never flashes at (0, 0) on mount, and so a
  // page that reloads with text already in the input shows the bubble at once.
  updatePosition();
  updateHasText();

  $effect(() => {
    // Watch the current input for edits so we can show/hide the bubble as the
    // user types or clears the draft.
    attachInputListener(currentInput);
    updateHasText();

    // Input growing/shrinking (multi-line drafts) moves its top edge.
    const resizeObserver = new ResizeObserver(() => updatePosition());
    if (currentInput) resizeObserver.observe(currentInput);

    // Detects the input being replaced or removed. isConnected is cheap, so
    // checking on every mutation batch is fine; findInput() only runs once
    // our element is actually gone (or while we're waiting for a new one).
    const mutationObserver = new MutationObserver(() => {
      if (currentInput?.isConnected) return;

      const found = adapter.findInput();
      if (found === currentInput) return;

      resizeObserver.disconnect();
      currentInput = found;
      inputVisible = !!found;
      // Move the 'input' listener onto the new element (removes it from the old
      // one) and re-check emptiness against it. found === null sets hasText false.
      attachInputListener(found);
      updateHasText();
      if (found) {
        resizeObserver.observe(found);
        updatePosition();
      } else {
        panelOpen = false;
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // On window resize, measure after layout settles, not mid-relayout.
    let rafId = 0;
    const onWindowResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    // selectionchange only fires on document; use it to catch caret moves that
    // don't fire keyup/click on the input, but only reposition when the caret is
    // actually inside our input.
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (
        sel &&
        sel.rangeCount > 0 &&
        currentInput?.contains(sel.getRangeAt(0).startContainer)
      ) {
        updatePosition();
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', onWindowResize, { passive: true });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
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
    // Re-read right before sending — the user may have kept typing while the
    // panel was open, and T-02 requires sending exactly what's shown, not a
    // stale snapshot from when the panel opened.
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

  // Step 1's read/write proof, kept reachable for re-verifying on a site
  // (e.g. after fixing a selector) without digging through git history.
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

{#if inputVisible && hasText}
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
    /* Sits below the bubble, right-aligned to it (extends leftward, away from
       the input); top/left come inline from the bubble anchor. */
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
