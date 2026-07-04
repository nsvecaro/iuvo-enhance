<script lang="ts">
  import { anthropicApiKey } from '@/lib/storage';

  interface Props {
    onSaved: () => void;
    onClose: () => void;
  }

  let { onSaved, onClose }: Props = $props();

  let key = $state('');
  let saving = $state(false);

  async function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) return;
    saving = true;
    await anthropicApiKey.setValue(trimmed);
    saving = false;
    onSaved();
  }
</script>

<div class="panel">
  <div class="panel-header">
    <span class="panel-title">Iuvo setup</span>
    <button class="icon-btn" onclick={onClose} aria-label="Close">✕</button>
  </div>

  <p class="hint">
    Paste your Anthropic API key to enable Enhance. It's stored only in this browser's local
    extension storage, never synced, and sent only to Anthropic's API. Get one at
    <span class="mono">console.anthropic.com/settings/keys</span>.
  </p>

  <label class="field">
    <span class="field-label">Anthropic API key</span>
    <input
      type="password"
      placeholder="sk-ant-..."
      autocomplete="off"
      bind:value={key}
      disabled={saving}
    />
  </label>

  <div class="actions">
    <button class="btn btn-secondary" onclick={onClose} disabled={saving}>Cancel</button>
    <button class="btn btn-primary" onclick={handleSave} disabled={saving || !key.trim()}>
      {saving ? 'Saving…' : 'Save & continue'}
    </button>
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

  .hint {
    margin: 0;
    font-size: 12px;
    color: #b3b3bd;
    line-height: 1.4;
  }

  .mono {
    font-family: ui-monospace, monospace;
    font-size: 11px;
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

  input {
    background: #14141a;
    color: inherit;
    border: 1px solid #34343d;
    border-radius: 6px;
    padding: 6px 8px;
    font-family: inherit;
    font-size: 12px;
  }

  input:disabled {
    opacity: 0.6;
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
