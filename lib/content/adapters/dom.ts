// execCommand('insertText', ...) goes through the browser's native text insertion path, which
// ProseMirror/Lexical/Draft.js editors observe via beforeinput/input — a plain innerText write +
// synthetic dispatchEvent does not, and these editors silently revert it on their next render.
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

  // Fallback if execCommand is unavailable/blocked; unreliable for these editors but better than nothing.
  el.textContent = text;
  el.dispatchEvent(
    new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text })
  );
  return false;
}
