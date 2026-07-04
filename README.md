# Iuvo

Browser extension (WXT + TypeScript) that adds a prompt-enhancer bubble to LLM chat sites. See `iuvo_architecture_v2.0.docx` for the full architecture/requirements doc.

Current state: bubble + panel + a real BYOK provider (Anthropic). `entrypoints/content.ts` mounts a Svelte widget (`components/Widget.svelte`) on `chatgpt.com` and `claude.ai` next to the prompt input. First click ever shows an inline API key setup screen (`components/ApiKeySetup.svelte`); after that, clicking the bubble opens the real panel (`components/Panel.svelte`) showing the current draft and 5 hardcoded enhancement params (depth, simplification, tone, length, format). Clicking **Enhance** calls Anthropic's API (via the background worker) and shows a **preview** of the rewritten prompt — nothing is written back into the page until you click **Use this**.

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

## 3. Test the full flow

1. With `npm run dev` running, open **https://chatgpt.com**, log in, land on a chat with the prompt box visible.
2. Wait a second — a small purple ✨ circle button appears bottom-right of the page.
3. Click it. **First time only**, you'll see a setup screen asking for an Anthropic API key instead of the usual panel — get one at **https://console.anthropic.com/settings/keys**, paste it in, click **Save & continue**. It's stored only in this browser's local extension storage (never synced, never sent anywhere except Anthropic's API), and you won't be asked again.
4. Type a rough draft prompt in the ChatGPT input (e.g. "explain how photosynthesis works").
5. Click the ✨ bubble again — this time the real panel opens, showing your draft and 5 dropdowns (depth, simplification, tone, length, format). Pick some options.
6. Click **Enhance**. After a moment you should see a preview: your original draft and the rewritten version side by side. **Nothing has touched the real input yet.**
7. Click **Use this** — now the ChatGPT input should update with the rewritten text. Click into it and keep typing to confirm it still behaves normally.
8. (Or click **Discard** to go back and try different params instead.)
9. Repeat on **https://claude.ai**. This one is NOT verified yet — the adapter selector in `lib/content/adapters/claude.ts` is a best guess. If the bubble doesn't even appear on claude.ai, open DevTools → Elements, find the actual prompt `contenteditable` div, and update `CANDIDATE_SELECTORS` at the top of `lib/content/adapters/claude.ts` with the right selector (most specific one first).

The toolbar popup (click the Iuvo icon in the browser toolbar) still exists if you ever need to view/change the saved key without going through the bubble.

If Enhance shows an error in the preview area instead of a rewrite, check: is the API key saved correctly in the popup? Does the key have credit/access on your Anthropic account? Check DevTools Console (F12) on the page, and also check the background worker's console (`chrome://extensions` → Iuvo card → **service worker** link → Console tab) since that's where the actual API call happens.

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

## Architecture — the 3 contexts

This is a browser extension, not a client/server app — there's no traditional "backend" yet
(that's a future Cloudflare Worker, step 7 in `CLAUDE.md`, not built). What separates the code
today is which **browser execution context** it runs in:

| Context | What it does | Can call `fetch`? | Files |
|---|---|---|---|
| **Content script** | Injected into ChatGPT/Claude.ai pages; finds the input, renders the bubble/panel, reads/writes the draft | **No** — hard rule | `entrypoints/content.ts`, `components/*.svelte`, `lib/content/` |
| **Background worker** | The extension's own always-available script; the only place network calls are allowed | Yes — only here | `entrypoints/background.ts`, `lib/background/` |
| **Popup** | Toolbar settings page | Not currently | `entrypoints/popup/` |

`lib/enhance.ts` and `lib/storage.ts` sit outside all three because both the content script and
the background worker need them (the shared `EnhanceParams` type, and the API key storage
item). Everything under `lib/content/` is content-script-only code; everything under
`lib/background/` is background-only code. If you're ever unsure where a new file belongs,
ask "does this run on the page, or does it make a network call?" — that answers it.

## Project layout

```
entrypoints/                    # WXT scans this folder name specifically — don't rename it
  content.ts                     # injected into matched pages (chatgpt.com, claude.ai)
                                  # finds the input, mounts Widget.svelte in a Shadow DOM
  background.ts                  # ONLY file allowed to fetch(); handles 'iuvo:enhance' messages
  popup/                          # toolbar popup — same API key settings, for editing it later

components/                     # also a WXT-scanned folder name
  Widget.svelte                  # the bubble; checks for a saved key, shows ApiKeySetup or Panel
  ApiKeySetup.svelte              # inline first-run screen — paste key, save, continue to Panel
  Panel.svelte                    # draft + params -> Enhance -> preview -> Use this/Discard

lib/
  enhance.ts                      # shared: EnhanceParams type — the 5 hardcoded FR4 params
  storage.ts                      # shared: anthropicApiKey, chrome.storage.local only (T-06)

  content/                        # content-script-only code
    adapters/
      types.ts                     # SiteAdapter interface (findInput/getValue/setValue)
      dom.ts                        # setContentEditableValue() — the execCommand write mechanism
      chatgpt.ts                    # ChatGPT adapter
      claude.ts                     # Claude.ai adapter (selector unverified, see CLAUDE.md)
      index.ts                      # adapter registry, picks adapter by hostname

  background/                     # background-worker-only code
    providers/
      types.ts                      # RewriteProvider interface (Provider Abstraction Layer, doc 6.4)
      anthropic.ts                   # BYOK Anthropic provider — the only one that exists so far
      index.ts                       # defaultProvider export

wxt.config.ts                    # WXT config: @wxt-dev/module-svelte, host_permissions, storage permission
```
