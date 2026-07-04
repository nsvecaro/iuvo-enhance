<script lang="ts">
  import type { EnhanceParams } from '@/lib/enhance';

  interface Props {
    draftText: string;
    onClose: () => void;
    onEnhance: (params: EnhanceParams) => void;
  }

  let { draftText, onClose, onEnhance }: Props = $props();

  let depth = $state<EnhanceParams['depth']>('standard');
  let simplification = $state<EnhanceParams['simplification']>('as-is');
  let tone = $state<EnhanceParams['tone']>('neutral');
  let length = $state<EnhanceParams['length']>('medium');
  let format = $state<EnhanceParams['format']>('prose');

  function handleEnhance() {
    onEnhance({ depth, simplification, tone, length, format });
  }
</script>

<div class="panel">
  <div class="panel-header">
    <span class="panel-title">Iuvo</span>
    <button class="icon-btn" onclick={onClose} aria-label="Close">✕</button>
  </div>

  <label class="field">
    <span class="field-label">Draft</span>
    <textarea class="draft" readonly rows="4">{draftText}</textarea>
  </label>

  <div class="params">
    <label class="field">
      <span class="field-label">Explanation depth</span>
      <select bind:value={depth}>
        <option value="brief">Brief</option>
        <option value="standard">Standard</option>
        <option value="detailed">Detailed</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Simplification</span>
      <select bind:value={simplification}>
        <option value="as-is">Keep as-is</option>
        <option value="simplify">Simplify</option>
        <option value="eli5">ELI5</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Tone</span>
      <select bind:value={tone}>
        <option value="neutral">Neutral</option>
        <option value="casual">Casual</option>
        <option value="formal">Formal</option>
        <option value="technical">Technical</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Target length</span>
      <select bind:value={length}>
        <option value="short">Short</option>
        <option value="medium">Medium</option>
        <option value="long">Long</option>
      </select>
    </label>

    <label class="field">
      <span class="field-label">Output format</span>
      <select bind:value={format}>
        <option value="prose">Prose</option>
        <option value="bulleted">Bulleted list</option>
        <option value="step-by-step">Step-by-step</option>
      </select>
    </label>
  </div>

  <p class="stub-note">Enhance isn't wired to a provider yet — this just logs {"{"}draftText, params{"}"} to the console.</p>

  <div class="actions">
    <button class="btn btn-secondary" onclick={onClose}>Cancel</button>
    <button class="btn btn-primary" onclick={handleEnhance}>Enhance</button>
  </div>
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

  select {
    background: #14141a;
    color: inherit;
    border: 1px solid #34343d;
    border-radius: 6px;
    padding: 6px 8px;
    font-family: inherit;
    font-size: 12px;
  }

  .params {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stub-note {
    margin: 0;
    font-size: 11px;
    color: #8a8a94;
    font-style: italic;
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
