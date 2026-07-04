import { adapters, getAdapterForHostname } from '@/lib/adapters';

export default defineContentScript({
  matches: adapters.flatMap((a) => a.matches),
  main() {
    const adapter = getAdapterForHostname(location.hostname);
    if (!adapter) return;

    let bubbleHost: HTMLElement | null = null;

    function createBubble(input: HTMLElement) {
      const host = document.createElement('div');
      host.id = 'iuvo-host';

      const shadow = host.attachShadow({ mode: 'open' });

      const btn = document.createElement('button');
      btn.textContent = '✨';
      btn.style.cssText = `
        position: fixed;
        bottom: 120px;
        right: 32px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #6c47ff;
        color: white;
        font-size: 18px;
        border: none;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // PoC test only: proves setValue reliably updates the site's own
      // editor state (doc 1.2 / the risk that gates everything else).
      // Not the real "Enhance" UX — that needs a preview before writing
      // anything back (T-02).
      btn.addEventListener('click', () => {
        const before = adapter!.getValue(input);
        console.log(`[iuvo:${adapter!.id}] draft before:`, before);

        const marker = `[iuvo test ${Date.now()}]`;
        const testText = before ? `${before} ${marker}` : marker;
        adapter!.setValue(input, testText);

        // Give the site's framework a tick to re-render before reading back.
        setTimeout(() => {
          const after = adapter!.getValue(input);
          console.log(`[iuvo:${adapter!.id}] draft after:`, after);
          const stuck = after.includes(marker);
          alert(
            stuck
              ? `setValue worked on ${adapter!.id}. Try typing more in the box now — if it behaves normally, the mechanism is solid.`
              : `setValue did NOT stick on ${adapter!.id}. Check the devtools console and lib/adapters/${adapter!.id}.ts.`
          );
        }, 50);
      });

      shadow.appendChild(btn);
      document.body.appendChild(host);
      bubbleHost = host;
    }

    function waitForInput() {
      const interval = setInterval(() => {
        const input = adapter!.findInput();
        if (!input) return;

        clearInterval(interval);

        if (!bubbleHost) createBubble(input);
      }, 500);
    }

    waitForInput();
  },
});
