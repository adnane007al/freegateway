# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo developers who want usable LLM capacity without paying for it. Their situation:
they are running a coding agent (Claude Code, Codex CLI, Cursor, Cline, Aider,
OpenCode…) or a side project that burns through tokens, they already have accounts
with several AI labs, and they are manually juggling free tiers they cannot combine.
Secondary audience: self-hosters and small teams who want one private gateway for
several tools.

Their job on the landing page: understand in seconds that this turns many free
provider keys into one endpoint, then download the desktop app.

## Product Purpose

FreeGateway is a local-first, self-hosted gateway that stacks the free tiers of many
AI providers behind a single OpenAI-compatible `/v1` API. Provider keys are encrypted
at rest; a router picks the healthiest model for each request and fails over to the
next when a provider rate-limits or errors. Success means a developer points one
OpenAI-compatible client at `http://localhost:3001/v1` and stops thinking about which
provider is serving the request.

## Positioning

The different mechanism is **quota-aware routing over free tiers**: per-key
RPM/RPD/TPM/TPD counters learn each provider's real ceiling, live reliability/speed/
intelligence scores rank the chain, and a 429 or 5xx moves the request to the next
model with a cooldown instead of failing. Neighbouring gateways route paid models
across paid keys; this one routes across many *free* allowances and keeps you under
every one of them.

## Operating Context

- Single-user, local-first: the dashboard, the SQLite database and the router all run
  on the operator's own machine, in Docker, or as a native tray app.
- Desktop app = the whole router + dashboard from a tray icon, no terminal, no Docker.
- Server installs (Docker, one-liner, `npm run dev`) use an email + password account.
- `npm run dev` starts the API on :3001 and the dashboard on :5173.
- The CLI (`npx freegateway setup-claude --url … --api-key …`) writes each agent's
  config file, backing up and merging into whatever is already there.

## Capabilities and Constraints

Confirmed capabilities:

- Every OpenAI-style surface: `/v1/chat/completions`, `/v1/responses`,
  `/v1/completions`, `/v1/images/generations`, `/v1/videos/generations`,
  `/v1/audio/speech`, `/v1/audio/transcriptions`, `/v1/embeddings`, `/v1/models`.
- Anthropic Messages API at `/v1/messages` (Claude Code + the Anthropic SDKs).
- Native Gemini surface at `/v1beta`, opt-in Ollama emulation.
- MCP server at `/mcp`; dependency-free OpenAPI viewer at `/v1/docs`.
- Tool calling, structured outputs, `response_format`, sampling params, streaming.
- Fusion: request the virtual `fusion` model to fan out to a panel of models and
  synthesize one answer with a judge model.
- Seven routing strategies: priority (manual order), balanced, smartest, fastest,
  reliable, custom (saved weights), decision.
- Named fallback-chain profiles callable per request as `auto:<profile>`.
- Per-key RPM/RPD/TPM/TPD tracking with provider-reported ceilings; cooldowns and
  key rotation; sticky sessions with optional context handoff.
- Opt-in prompt compression, opt-in response cache, encrypted DB backups.
- Provider adapters: 86 registered adapters covering ~85 platforms (chat,
  embeddings, speech, transcription, video, search, decision), plus a `custom`
  OpenAI-compatible provider for any external endpoint.
- Dashboard: 60 locales, light/dark themes, RTL support, p50/p95/TTFT analytics over
  24h–90d, playground, key management, chain reordering.

Constraints that must be respected in any marketing surface:

- Free tiers only: no frontier models, variable latency, no SLA. Intelligence dips
  late in the day as top models hit daily caps, resetting at UTC midnight.
- Local-first and single-user by design; not exposed to the internet by default.
- Provider keys are encrypted (AES-256-GCM) in SQLite and decrypted per request.
- The upstream project (github.com/tashfeenahmed/freegateway) is MIT licensed and is
  the code this product is built on; attribution must remain visible.

## Brand Commitments

- Name: FreeGateway. Product identifier `com.freegateway.desktop`.
- App icon (committed): cream `#F9E0AE` ground, rose `#E01B6A` circle and portal
  mark — the "rose on cream" variant, stored as `desktop/assets/appicon.svg` and
  rendered to `desktop/assets/appicon_1024.png` for the installers.
- The dashboard's brand accent is rose `#E01B6A` (OKLCH `0.62 0.28 350` light,
  `0.78 0.22 350` dark) on a warm cream ground — the landing page inherits this
  palette family rather than inventing a new one.
- Voice: plain, engineering-first, no hype. The README's own tone is the reference.
- MIT license. Upstream credited in the footer and in the README's credits section.

## Evidence on Hand

- Real product screenshots captured from a running instance:
  `repo-assets/screenshot-models.png` (Models page: token budget, routing strategy,
  scored model table) and `repo-assets/screenshot-agents.png` (Agents page: setup
  commands, separate BASE_URL / API_KEY copy buttons). Copies live under
  `landing/assets/screenshots/`.
- Real provider logos: `landing/assets/providers/` (Google, Groq, Cerebras,
  OpenCode Zen, Mistral, OpenRouter, Cloudflare, Cohere, Z.ai, NVIDIA,
  HuggingFace).
- Real agent logos: `landing/assets/agents/` (Claude Code, Codex CLI, Gemini CLI,
  Cursor, Cline, Roo Code, OpenCode, Aider, Continue, Goose, Qwen Code, Kilo Code,
  Crush, Zed, JetBrains, and more).
- App icon: `landing/assets/icon.svg`.
- Release metadata is fetched from the GitHub Releases API at page load, but the
  request is pinned to an explicit tag (`v0.16.22`) rather than `releases/latest`,
  so the download buttons always serve one known version instead of drifting to
  whatever happened to be published last.
- **Absence — must not be fabricated:** no customer logos, testimonials, benchmarks,
  uptime claims, or user counts exist for this fork. The live catalog's model counts
  (474 model families / 635 free endpoints / ~7.4B tokens per month) come from the
  upstream hosted catalog service, not from this repository; the repository's own
  adapter count is 86.

## Product Principles

1. **One endpoint, one key.** The visitor must never have to think about which
   provider is serving the request.
2. **Free tiers are the product.** Honesty about their limits is more persuasive
   than inflated capacity claims.
3. **Local-first.** Nothing leaves the operator's machine except requests to the
   providers they enabled.
4. **The router is the product.** Show the mechanism working; do not only describe it.
5. **Failover is the promise.** A rate limit is a reroute, not an error.

## Accessibility & Inclusion

- The dashboard supports 60 languages including four right-to-left locales
  (العربية, עברית, فارسی, اردو); the landing page is English-only but must be
  responsive and keyboard-navigable, with visible focus states and honoured
  `prefers-reduced-motion`.
- Contrast: body text ≥ 4.5:1, large text ≥ 3:1 on the dark ground.
