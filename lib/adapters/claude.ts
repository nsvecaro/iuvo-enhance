import type { SiteAdapter } from './types';
import { setContentEditableValue } from './dom';

// Unverified against the live site — this is the part of the PoC that needs
// a human to confirm in devtools. Claude.ai's composer is a ProseMirror
// contenteditable div; these are the selectors known to have been used.
// If none match, open devtools on claude.ai, inspect the prompt box, and
// update this list (most specific first).
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
