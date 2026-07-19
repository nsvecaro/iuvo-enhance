import type { SiteAdapter } from './types';
import { setContentEditableValue } from './dom';

// Verified working on live claude.ai (ProseMirror contenteditable), round-trip tested.
const CANDIDATE_SELECTORS = [
  'div[contenteditable="true"].ProseMirror',
  'div[aria-label="Write your prompt to Claude"]',
  'fieldset div[contenteditable="true"]',
  'div[contenteditable="true"]',
];

function isValidInput(el: Element | null): el is HTMLElement {
  if (!el) return false;
  return el.getAttribute('contenteditable') === 'true';
}

const claudeAdapter: SiteAdapter = {
  id: 'claude',
  hostname: 'claude.ai',
  matches: ['*://claude.ai/*'],
  bubbleOffset: { x: 0, y: 0 },

  findInput() {
    for (const selector of CANDIDATE_SELECTORS) {
      const el = document.querySelector(selector);
      if (isValidInput(el)) return el;
    }
    return null;
  },

  getValue(el) {
    return el.innerText;
  },

  setValue(el, text) {
    setContentEditableValue(el, text);
  },
};

export default claudeAdapter;
