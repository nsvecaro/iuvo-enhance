/**
 * Writes text into a contenteditable element the way a real user paste/typing
 * would, so frameworks that keep their own document model over the DOM
 * (ProseMirror, Lexical, Draft.js — what ChatGPT and Claude.ai use) actually
 * observe the change instead of silently reverting it on their next render.
 *
 * Plain `el.innerText = text` + a synthetic `dispatchEvent(new InputEvent(...))`
 * does NOT work reliably for these editors: the synthetic event fires, but the
 * editor's internal model was never updated through its own transaction
 * pipeline, so it can resync from its own state and undo the DOM edit.
 * `execCommand('insertText', ...)` goes through the browser's native text
 * insertion path, which these editors do listen to via `beforeinput`/`input`.
 */
export function setContentEditableValue(el: HTMLElement, text: string): boolean {
  el.focus();

  const selection = window.getSelection();
  if (!selection) return false;

  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);

  const inserted = document.execCommand('insertText', false, text);
  if (inserted) return true;

  // Fallback if execCommand is unavailable/blocked. Known to be unreliable
  // for React/ProseMirror-controlled inputs, but better than doing nothing.
  el.textContent = text;
  el.dispatchEvent(
    new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text })
  );
  return false;
}
