import type { SiteAdapter } from './types';
import { setContentEditableValue } from './dom';

// Composer selectors have moved before and will again (T-03); ordered most-stable first.
const CANDIDATE_SELECTORS = [
  '#prompt-textarea',
  'form [contenteditable="true"]',
];

function isValidInput(el: Element | null): el is HTMLElement {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return true;
  return el.getAttribute('contenteditable') === 'true';
}

const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',
  hostname: 'chatgpt.com',
  matches: ['*://chatgpt.com/*'],
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

export default chatgptAdapter;
