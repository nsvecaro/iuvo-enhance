# Iuvo

Browser extension (WXT + TypeScript) that adds a prompt-enhancer bubble to LLM chat sites. See `iuvo_architecture_v2.0.docx` for the full architecture/requirements doc.

Current state: bubble + panel UI, no provider yet. `entrypoints/content.ts` mounts a Svelte widget (`components/Widget.svelte`) on `chatgpt.com` and `claude.ai` next to the prompt input. Clicking the bubble opens a panel (`components/Panel.svelte`) showing the current draft and 5 hardcoded enhancement params (depth, simplification, tone, length, format). "Enhance" is currently a stub — it just logs to console, since there's no AI provider wired up yet (that's the next step, see `CLAUDE.md`).

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

1. With `npm run dev` running, open **https://chatgpt.com**, log in, land on a chat with the prompt box visible.
2. Wait a second — a small purple ✨ circle button appears bottom-right of the page.
3. Click it — a panel should open showing the current draft text and 5 dropdowns (depth, simplification, tone, length, format).
4. Change a couple of dropdowns and click **Enhance**. Nothing visible happens in the UI (expected — no provider yet), but open DevTools Console (F12) and you should see `[iuvo:chatgpt] enhance requested { draftText, params }` logged.
5. Click **Cancel** — the panel should close.
6. Repeat steps 1-5 on **https://claude.ai**. This one is NOT verified yet — the adapter selector in `lib/adapters/claude.ts` is a best guess. If the bubble doesn't even appear on claude.ai, open DevTools → Elements, find the actual prompt `contenteditable` div, and update `CANDIDATE_SELECTORS` at the top of `lib/adapters/claude.ts` with the right selector (most specific one first).

### Re-verifying the step-1 read/write mechanism

Next to the open panel there's a small **"dev: test write"** button — this re-runs the original PoC test (the riskiest mechanism in the whole project, see `CLAUDE.md` → "The one risk that gates everything"). Type something in the real input first, click it, and you should get an alert saying `setValue worked on chatgpt` with a `[iuvo test ...]` marker appended to your text in the box. Then click into the input and keep typing — if it behaves normally (no glitches/duplication), the mechanism is solid. Use this any time you touch an adapter (e.g. after fixing the Claude.ai selector) to make sure it still works.

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
  content.ts          # injected into matched pages (chatgpt.com, claude.ai)
                       # finds the input, mounts Widget.svelte in a Shadow DOM
  background.ts       # background service worker
  popup/               # extension toolbar popup
lib/
  enhance.ts            # EnhanceParams type — the 5 hardcoded FR4 params
  adapters/
    types.ts              # SiteAdapter interface (findInput/getValue/setValue)
    dom.ts                 # setContentEditableValue() — the execCommand write mechanism
    chatgpt.ts             # ChatGPT adapter
    claude.ts              # Claude.ai adapter (selector unverified, see CLAUDE.md)
    index.ts                # adapter registry, picks adapter by hostname
components/
  Widget.svelte         # the bubble; toggles Panel open/closed; owns the dev test-write button
  Panel.svelte          # draft preview + param dropdowns + Enhance (stub)/Cancel
  counter.ts
wxt.config.ts          # WXT config (registers @wxt-dev/module-svelte)
```
