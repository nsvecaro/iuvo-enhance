export default defineContentScript({
  matches: ['*://chatgpt.com/*'],
  main() {
    let bubble: HTMLElement | null = null;

    function createBubble() {
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

      btn.addEventListener('click', () => {
        alert('Iuvo bubble clicked! Panel coming next.');
      });

      shadow.appendChild(btn);
      document.body.appendChild(host);
      bubble = host;
    }

    function waitForInput() {
      const interval = setInterval(() => {
        const input = document.querySelector('#prompt-textarea');
        if (!input) return;

        clearInterval(interval);

        if (!bubble) createBubble();
      }, 500);
    }

    waitForInput();
  },
});
