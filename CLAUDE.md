# CLAUDE.md

Context for Claude Code when working in this repo. Read this first every session.

## What Iuvo is

A cross-browser extension (Manifest V3) that adds a small floating bubble next to the
prompt input on LLM chat sites (ChatGPT, Claude.ai, Gemini, Perplexity, ...). Clicking it
opens a compact panel where the user tweaks how their draft prompt should be rewritten
(depth, tone, target audience, output format, length) before sending it to the LLM.

It sits between "what the user typed" and "what the LLM receives", without asking the user
to learn prompt engineering. Full spec: `Iuvo_Architecture_v2_0.docx`.

## Current state (keep this section honest as we go)

- WXT + TypeScript + Svelte (via `@wxt-dev/module-svelte`). No providers yet.
- `entrypoints/content.ts` + `lib/adapters/{chatgpt,claude}.ts`: a small adapter pattern
  (`findInput`/`getValue`/`setValue` per site, see doc 6.3). Matches `chatgpt.com` and
  `claude.ai`, polls for the input, mounts a Svelte UI (`components/Widget.svelte`) inside a
  Shadow DOM via `createShadowRootUi`.
- `Widget.svelte` renders the bubble; clicking it toggles `Panel.svelte` open/closed. The
  panel shows the current draft (read via the adapter) and the 5 hardcoded FR4 params
  (depth, simplification, tone, target length, output format — see `lib/enhance.ts`). Its
  "Enhance" button is a stub — logs `{draftText, params}` to console, no provider exists yet
  (that's step 3, do not build ahead of it).
- The step-1 read/write proof is still reachable via a small "dev: test write" button that
  appears next to the open panel, so it can be re-verified any time without digging through
  git history. It writes a marker string back via `execCommand('insertText', ...)` (not a
  plain `dispatchEvent` — see below) and alerts whether it stuck.
- **The Claude.ai selector in `lib/adapters/claude.ts` is unverified against the live site**
  — it has fallbacks but needs a human to confirm/correct it in devtools.
- The architecture doc describes the TARGET state, not what is built. Do not assume
  anything in the doc exists in code yet.

## The one risk that gates everything (doc 1.2)

Reliably writing text back into `contenteditable` inputs whose React/Vue/ProseMirror
internal state does NOT update from a plain `dispatchEvent`. If this does not work
robustly, the whole value proposition is dead.

Status: **partially closed**. `lib/adapters/dom.ts` uses `document.execCommand('insertText',
...)` after selecting the element's contents — this goes through the browser's native text
insertion path, which ProseMirror-based editors (what both ChatGPT and Claude.ai use) do
observe correctly, unlike a synthetic `dispatchEvent` which they can silently ignore/revert.
This works reliably on ChatGPT as implemented. **Still needs a human to test on claude.ai**
(selector unverified) and to confirm typing normally after a programmatic write doesn't
corrupt the editor's state on either site — that's the real bar for "closed."

## Build order (doc section 11) — do not skip ahead

1. Injection PoC: WXT scaffold, adapters with `findInput`/`getValue`/`setValue`. Confirm
   `execCommand('insertText', ...)` reliably updates the site's internal state on ChatGPT
   (done) and Claude.ai (selector needs live verification — see above).
2. Bubble + panel UI in Shadow DOM, hardcoded enhancement params. **Done** — Svelte
   `Widget.svelte`/`Panel.svelte`, params in `lib/enhance.ts`. Enhance button is a stub.
3. Provider Abstraction Layer interface + BYOK provider (Anthropic or OpenAI direct). **Next.**
4. End-to-end test of the full flow on 1 site with BYOK.
5. Add second and third site adapters.
6. Self-hosted Ollama provider (test with a DeepSeek model).
7. Hosted backend (Cloudflare Worker) as third provider, with auth (Clerk/Supabase).
8. Security pass against the threat model before any public beta.

Build providers in order of increasing complexity; ship the user experience in order of
increasing simplicity (hosted backend is the eventual default so a new user needs no setup).

## Tech stack (decided in the doc)

- Scaffold: WXT (cross-browser Chrome/Edge/Firefox from MVP, smaller bundle than Plasmo).
- UI: Svelte + TypeScript, rendered inside a Shadow DOM root (smallest runtime for an
  injected content-script UI). Set up via `@wxt-dev/module-svelte`.
- Styling: Tailwind scoped inside the Shadow root, or plain CSS.
- Background worker: plain TS `fetch`. MV3 workers are short-lived, so keep logic stateless
  and put state in storage.
- Storage: `chrome.storage.local` for secrets, `chrome.storage.sync` for presets/prefs only.
- Providers: BYOK (direct Anthropic/OpenAI) -> self-hosted Ollama (OpenAI-compatible, just a
  different base URL) -> hosted Cloudflare Worker.

## Hard rules / guardrails (from NFRs + threat model)

- Content script talks to the background worker ONLY via `chrome.runtime.sendMessage`.
  The background worker is the ONLY component allowed to make network calls.
- All injected UI lives inside a Shadow DOM so host-page CSS cannot leak in or out.
- Never show the rewrite as auto-applied: the user must see the full draft and the rewritten
  preview before anything replaces their input (T-02).
- Per-adapter `host_permissions`, never `<all_urls>` (Web Store review + trust + T-08).
- API keys go ONLY in `chrome.storage.local`, never `.sync` (T-06).
- Never log raw prompt content anywhere, client or server; if debug logging is unavoidable,
  redact and keep short retention (T-04, T-05).
- A self-hosted inference endpoint is never network-accessible without auth + rate limiting
  (T-07). Never expose Ollama port 11434 directly to the internet.
- Adapters must fail safe: on any mismatch the bubble simply does not appear, it never breaks
  the host page (FR10). Verify the matched element's type/role/aria before writing to it,
  not just a CSS selector match (T-03).
- Prefer a scoped MutationObserver over polling for input detection (NFR performance). The
  current PoC uses `setInterval` polling; that is a known thing to replace.

## Commands

```
npm run dev            # WXT watch mode, auto-loads extension into Chrome
npm run dev:firefox    # same for Firefox
npm run build          # production build -> .output/
npm run compile        # type-check only (tsc --noEmit)
npm run zip            # package for store upload
```

## Conventions

- TypeScript everywhere, no `any` unless there is a comment saying why.
- One adapter = one small isolated file, so a site DOM change breaks one adapter, not the app.
- Keep the content-script bundle small; it is injected on every supported page.
