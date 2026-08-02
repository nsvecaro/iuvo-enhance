import type { SiteAdapter } from './types';
import { setContentEditableValue } from './dom';

// UNVERIFIED against live perplexity.ai — selectors are best-effort, confirm in devtools.
// Ordered most-specific first (Lexical contenteditable), widening to a bare textarea (T-03).
const CANDIDATE_SELECTORS = [
  '[contenteditable="true"][data-lexical-editor]',
  'textarea[placeholder]',
  '.grow textarea',
  'textarea',
];

function isValidInput(el: Element | null): el is HTMLElement {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return true;
  return el.getAttribute('contenteditable') === 'true';
}

const perplexityAdapter: SiteAdapter = {
  id: 'perplexity',
  hostname: 'perplexity.ai',
  matches: ['*://perplexity.ai/*', '*://www.perplexity.ai/*'],
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

export default perplexityAdapter;
