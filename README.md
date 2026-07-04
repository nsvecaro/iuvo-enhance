# Iuvo

Browser extension (WXT + TypeScript) that adds a prompt-enhancer bubble to LLM chat sites. See `iuvo_architecture_v2.0.docx` for the full architecture/requirements doc.

Current state: proof-of-concept only. `entrypoints/content.ts` injects a bubble on `chatgpt.com` and `claude.ai` next to the prompt input. Clicking it now actually **reads the draft and writes a test string back into the input** — this is the single riskiest mechanism in the whole project (see `CLAUDE.md`), so proving it works reliably is the current priority, before any panel/provider code gets built.

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

This is the important test right now — it proves (or disproves) that we can write text back into ChatGPT's and Claude.ai's input reliably. Read `CLAUDE.md` → "The one risk that gates everything" for why this matters before doing anything else.

1. With `npm run dev` running, open **https://chatgpt.com**, log in, land on a chat with the prompt box visible.
2. Wait a second — a small purple ✨ circle button appears bottom-right of the page.
3. Type something in the ChatGPT input first (e.g. "hello world"), then click the ✨ bubble.
4. You should get an alert saying `setValue worked on chatgpt` — and the input itself should now show your original text plus a `[iuvo test ...]` marker appended.
5. **The real test**: click into the input and keep typing normally. If the cursor behaves, text appears where expected, and nothing duplicates/glitches, the mechanism is solid. If typing breaks or the box looks corrupted, that's a real problem — screenshot it and flag it.
6. Repeat steps 1-5 on **https://claude.ai**. This one is NOT verified yet — the adapter selector in `lib/adapters/claude.ts` is a best guess. If the bubble doesn't even appear on claude.ai, open DevTools → Elements, find the actual prompt `contenteditable` div, and update `CANDIDATE_SELECTORS` at the top of `lib/adapters/claude.ts` with the right selector (most specific one first).

Open DevTools Console (F12) while testing — every click logs `[iuvo:chatgpt] draft before:` / `draft after:` so you can see exactly what the adapter read and wrote.

If the bubble never shows up on a site that's already wired up:
- Check `chrome://extensions` → click **Errors** on the Iuvo card for stack traces.
- Open DevTools on the page (F12) → Console, look for errors from the content script.
- Try reloading the extension (the reload icon on the card in `chrome://extensions`) and refreshing the tab.

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
  content.ts          # injected into matched pages (chatgpt.com, claude.ai) — bubble PoC
  background.ts       # background service worker
  popup/               # extension toolbar popup
lib/adapters/
  types.ts             # SiteAdapter interface (findInput/getValue/setValue)
  dom.ts                # setContentEditableValue() — the execCommand write mechanism
  chatgpt.ts            # ChatGPT adapter
  claude.ts             # Claude.ai adapter (selector unverified, see CLAUDE.md)
  index.ts               # adapter registry, picks adapter by hostname
components/
  counter.ts
wxt.config.ts          # WXT config
```
