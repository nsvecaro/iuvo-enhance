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

- Plain WXT + TypeScript starter. No Svelte, no adapters, no providers, no panel yet.
- `entrypoints/content.ts` is a proof-of-concept: matches `chatgpt.com`, polls for
  `#prompt-textarea`, injects a purple bubble into a Shadow DOM host, click shows an alert.
- The architecture doc describes the TARGET state, not what is built. Do not assume
  anything in the doc exists in code yet.

## The one risk that gates everything (doc 1.2)

Reliably writing text back into `contenteditable` inputs whose React/Vue internal state
does NOT update from a plain `dispatchEvent`. If this does not work robustly, the whole
value proposition is dead. So: prove the read/write mechanism on ChatGPT AND Claude.ai
before building any UI, provider, or preset code. Everything else is worthless without it.

## Build order (doc section 11) — do not skip ahead

1. Injection PoC: WXT + Svelte scaffold, ONE adapter, only findInput/getValue/setValue.
   Confirm event dispatch reliably updates the site's internal state.
2. Only if step 1 works: bubble + panel UI in Shadow DOM, hardcoded enhancement params.
3. Provider Abstraction Layer interface + BYOK provider (Anthropic or OpenAI direct).
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
  injected content-script UI). Not set up yet.
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
