import type { SiteAdapter } from './types';
import { setContentEditableValue } from './dom';

// VERIFIED AND WORKS
const CANDIDATE_SELECTORS = [
  'rich-textarea div[contenteditable="true"]',
  'div.ql-editor[contenteditable="true"]',
  'div[aria-label="Enter a prompt here"]',
  'div[contenteditable="true"][role="textbox"]',
];

function isValidInput(el: Element | null): el is HTMLElement {
  if (!el) return false;
  return el.getAttribute('contenteditable') === 'true';
}

const geminiAdapter: SiteAdapter = {
  id: 'gemini',
  hostname: 'gemini.google.com',
  matches: ['*://gemini.google.com/*'],
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

export default geminiAdapter;
