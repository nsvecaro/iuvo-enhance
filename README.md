# Iuvo

Browser extension (WXT + TypeScript + Svelte) that adds a prompt-enhancer bubble to LLM
chat sites. You write a rough prompt, click the bubble, and Iuvo rewrites it into a clearer,
better-structured prompt before you send it — like Grammarly, but for prompts.

## Status

Early development. The hard part is proven; the product around it is being built.

- Text injection works on ChatGPT and Claude.ai: read the draft, write an enhanced version
  back into the composer, round-trip verified (the message sends intact).
- Per-site adapter layer (ChatGPT, Claude.ai) behind a shared interface.
- Provider layer scaffolded with BYOK (bring-your-own-key) for Anthropic; the API key is
  stored locally only (`chrome.storage.local`), never synced.
- (WIP) The enhancement UI panel is currently a shell: it reads the input, but the full
  "click -> enhance -> write back" flow is not wired end to end yet.
- (Planned) Gemini / Perplexity adapters, a self-hosted (Ollama) provider, and a hosted
  backend provider.

A temporary `dev: test write` button is present to test the injection mechanism directly.
It will be removed once the real panel is wired.

## Why this is non-trivial

ChatGPT and Claude.ai use rich-text editors (Lexical / ProseMirror) that keep their own
model of the text on top of the DOM. Setting `innerText` and dispatching a synthetic event
does not reliably work: the editor resyncs from its own state and discards the change. Iuvo
writes through the browser's native text-insertion path (`execCommand('insertText')`), which
these editors observe, so the injected prompt lands in the editor's model and can be sent.
See `lib/content/adapters/dom.ts`.

## Tech stack

- WXT: cross-browser Manifest V3 framework (Chrome, Edge, Firefox from one codebase)
- TypeScript
- Svelte 5 for the injected UI, mounted inside a Shadow DOM so page styles don't leak in or out
- Anthropic API (BYOK) as the first rewrite provider

## Project structure

```
entrypoints/
  content.ts             # injected into matched sites; picks the adapter, mounts the UI
  background.ts          # background service worker (the only component that makes network calls)
  popup/                 # toolbar popup
components/              # Svelte UI (Widget, Panel, ApiKeySetup)
lib/
  content/adapters/      # per-site DOM layer: types, dom (injection), chatgpt, claude, index
  background/providers/  # per-LLM layer: types, anthropic (BYOK), index
  enhance.ts             # builds the rewrite request
  storage.ts             # chrome.storage wrapper (API key, etc.)
```

The two layers are independent by design: adapters know how to talk to a **site**, providers
know how to talk to an **LLM**. Adding a site is a new adapter; changing how prompts are
rewritten (BYOK -> self-hosted -> hosted) is a new provider. Neither change touches the other.

## Run it (dev)

```
npm install
npm run dev            # Chrome
npm run dev:firefox    # Firefox
```

WXT opens a browser with the extension loaded and reloads on save.

### Testing on Claude.ai

The dev browser WXT launches uses a fresh profile, so Cloudflare's bot check on claude.ai can
block login. To test there, load the built extension into your normal Chrome instead:
`chrome://extensions` -> enable Developer mode -> Load unpacked -> select `.output/chrome-mv3/`.

## Other commands

```
npm run build          # production build -> .output/
npm run compile        # type-check only
npm run zip            # package for store upload
```

## Roadmap

1. Prove injection on ChatGPT + Claude.ai (done)
2. Working enhancement panel (bubble -> panel -> enhance -> write back)
3. Provider abstraction + BYOK end to end
4. More site adapters (Gemini, Perplexity)
5. Self-hosted (Ollama) provider
6. Hosted backend provider + auth
7. Security pass against the threat model before public beta
