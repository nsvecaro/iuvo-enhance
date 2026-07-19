export interface SiteAdapter {
  /** short identifier, e.g. 'chatgpt' */
  id: string;
  /** hostname substring used to pick the right adapter at runtime, e.g. 'chatgpt.com' */
  hostname: string;
  /** WXT/manifest match patterns for this site, used to build content_scripts.matches */
  matches: string[];
  /** Locate the chat input on the page. Return null if not present (yet). */
  findInput(): HTMLElement | null;
  /** Read the current draft text out of the input. */
  getValue(el: HTMLElement): string;
  /** Write text back into the input so the site's own framework picks it up. */
  setValue(el: HTMLElement, text: string): void;
  /**
   * Per-site tweak added to the bubble's computed anchor position, in px
   * (x = horizontal, y = vertical, either may be negative). Each site pads
   * its visual composer box around the contenteditable differently, so one
   * universal offset doesn't sit right anywhere. Missing means { x: 0, y: 0 }.
   */
  bubbleOffset?: { x: number; y: number };
}
