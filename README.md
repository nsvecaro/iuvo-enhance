# Iuvo

Browser extension (WXT + TypeScript) that adds a prompt-enhancer bubble to LLM chat sites. See `iuvo_architecture_v2.0.docx` for the full architecture/requirements doc.

Current state: proof-of-concept only. `entrypoints/content.ts` injects a bubble on `chatgpt.com` next to the prompt textarea. Clicking it just shows an alert for now — no panel, no providers yet.

## 1. Install

Requirements: Node 20+ and npm (already have these? skip to the command).

```bash
git clone https://github.com/nsvecaro/iuvo-enhance.git
cd iuvo-enhance
npm install
```

`npm install` also runs `wxt prepare` automatically (via `postinstall`) — it generates the `.wxt/` folder needed for TypeScript to work. If your editor shows red squiggles everywhere after cloning, just run `npm install` again.

## 2. Run it (dev mode)

```bash
npm run dev
```

This starts WXT in watch mode and should auto-open a Chrome window with the extension already loaded. Leave this running in a terminal — it rebuilds and reloads automatically whenever you save a file.

If it doesn't auto-open a browser, or you want to load it manually:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3/` folder from this project

For Firefox instead of Chrome:

```bash
npm run dev:firefox
```

## 3. Test the current PoC

1. With `npm run dev` running, open **https://chatgpt.com** in the browser window WXT opened (or a browser you loaded the extension into).
2. Log in / land on a chat with the prompt input visible.
3. Wait a second — a small purple ✨ circle button should appear bottom-right of the page.
4. Click it — you should get an `alert("Iuvo bubble clicked! Panel coming next.")`.

If the bubble never shows up:
- Make sure the URL is exactly `chatgpt.com` (not `chat.openai.com` — the adapter only matches `chatgpt.com` right now).
- Check `chrome://extensions` → click **Errors** on the Iuvo card for stack traces.
- Open DevTools on the page (F12) → Console, look for errors from the content script.
- Try reloading the extension (the reload icon on the card in `chrome://extensions`) and refreshing the ChatGPT tab.

That's it — there's no build step required to "test" it, `npm run dev` is the only command you need day to day.

## Other commands (not needed for normal dev)

```bash
npm run build          # production build -> .output/
npm run build:firefox  # production build for firefox
npm run zip             # zip the extension for store upload
npm run compile         # type-check only, no build
```

## Project layout

```
entrypoints/
  content.ts        # injected into matched pages (currently just chatgpt.com) — bubble PoC
  background.ts      # background service worker
  popup/              # extension toolbar popup
components/
  counter.ts
wxt.config.ts         # WXT config
```
