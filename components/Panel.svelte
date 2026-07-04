<script lang="ts">
  import type { EnhanceParams } from '@/lib/enhance';

  interface Props {
    draftText: string;
    onClose: () => void;
    onEnhance: (params: EnhanceParams) => Promise<string>;
    onAccept: (rewrittenText: string) => void;
  }

  let { draftText, onClose, onEnhance, onAccept }: Props = $props();

  type Phase = 'editing' | 'loading' | 'preview' | 'error';
  let phase = $state<Phase>('editing');
  let rewritten = $state('');
  let errorMessage = $state('');

  let depth = $state<EnhanceParams['depth']>('standard');
  let simplification = $state<EnhanceParams['simplification']>('as-is');
  let tone = $state<EnhanceParams['tone']>('neutral');
  let length = $state<EnhanceParams['length']>('medium');
  let format = $state<EnhanceParams['format']>('prose');

  async function handleEnhance() {
    phase = 'loading';
    try {
      rewritten = await onEnhance({ depth, simplification, tone, length, format });
      phase = 'preview';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      phase = 'error';
    }
  }

  function handleUseThis() {
    onAccept(rewritten);
  }

  function handleDiscard() {
    phase = 'editing';
  }

  function handleRetry() {
    phase = 'editing';
  }
</script>

<div class="panel">
  <div class="panel-header">
    <span class="panel-title">Iuvo</span>
    <button class="icon-btn" onclick={onClose} aria-label="Close">✕</button>
  </div>

  {#if phase === 'editing' || phase === 'loading'}
    <label class="field">
      <span class="field-label">Draft</span>
      <textarea class="draft" readonly rows="4">{draftText}</textarea>
    </label>

    <div class="params">
      <label class="field">
        <span class="field-label">Explanation depth</span>
        <select bind:value={depth} disabled={phase === 'loading'}>
          <option value="brief">Brief</option>
          <option value="standard">Standard</option>
          <option value="detailed">Detailed</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Simplification</span>
        <select bind:value={simplification} disabled={phase === 'loading'}>
          <option value="as-is">Keep as-is</option>
          <option value="simplify">Simplify</option>
          <option value="eli5">ELI5</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Tone</span>
        <select bind:value={tone} disabled={phase === 'loading'}>
          <option value="neutral">Neutral</option>
          <option value="casual">Casual</option>
          <option value="formal">Formal</option>
          <option value="technical">Technical</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Target length</span>
        <select bind:value={length} disabled={phase === 'loading'}>
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">Output format</span>
        <select bind:value={format} disabled={phase === 'loading'}>
          <option value="prose">Prose</option>
          <option value="bulleted">Bulleted list</option>
          <option value="step-by-step">Step-by-step</option>
        </select>
      </label>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" onclick={onClose} disabled={phase === 'loading'}>Cancel</button>
      <button class="btn btn-primary" onclick={handleEnhance} disabled={phase === 'loading'}>
        {phase === 'loading' ? 'Enhancing…' : 'Enhance'}
      </button>
    </div>
  {:else if phase === 'preview'}
    <label class="field">
      <span class="field-label">Original draft</span>
      <textarea class="draft draft-muted" readonly rows="3">{draftText}</textarea>
    </label>

    <label class="field">
      <span class="field-label">Enhanced preview</span>
      <textarea class="draft draft-preview" readonly rows="6">{rewritten}</textarea>
    </label>

    <p class="preview-note">Nothing has been written back yet — review before applying.</p>

    <div class="actions">
      <button class="btn btn-secondary" onclick={handleDiscard}>Discard</button>
      <button class="btn btn-primary" onclick={handleUseThis}>Use this</button>
    </div>
  {:else if phase === 'error'}
    <p class="error-message">{errorMessage}</p>
    <div class="actions">
      <button class="btn btn-secondary" onclick={onClose}>Cancel</button>
      <button class="btn btn-primary" onclick={handleRetry}>Try again</button>
    </div>
  {/if}
</div>

<style>
  .panel {
    position: fixed;
    bottom: 170px;
    right: 32px;
    width: 300px;
    background: #1e1e24;
    color: #f2f2f5;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    padding: 16px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-title {
    font-weight: 600;
    font-size: 14px;
  }

  .icon-btn {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 11px;
    color: #b3b3bd;
  }

  .draft {
    resize: none;
    background: #14141a;
    color: inherit;
    border: 1px solid #34343d;
    border-radius: 6px;
    padding: 6px 8px;
    font-family: inherit;
    font-size: 12px;
  }

  .draft-muted {
    opacity: 0.6;
  }

  .draft-preview {
    border-color: #6c47ff;
  }

  .preview-note {
    margin: 0;
    font-size: 11px;
    color: #8a8a94;
    font-style: italic;
  }

  .error-message {
    margin: 0;
    font-size: 12px;
    color: #ff8a8a;
  }

  select {
    background: #14141a;
    color: inherit;
    border: 1px solid #34343d;
    border-radius: 6px;
    padding: 6px 8px;
    font-family: inherit;
    font-size: 12px;
  }

  select:disabled {
    opacity: 0.6;
  }

  .params {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .btn {
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .btn-secondary {
    background: #34343d;
    color: inherit;
  }

  .btn-secondary:hover {
    background: #3f3f4a;
  }

  .btn-primary {
    background: #6c47ff;
    color: white;
  }

  .btn-primary:hover {
    background: #7c5cff;
  }
</style>
