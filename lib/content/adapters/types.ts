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
}
