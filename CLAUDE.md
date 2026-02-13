# Synthesis

## Project Context

- **Type:** Next.js App (App Router)
- **Stack:** Next.js 16.1, React 19, TypeScript, Tailwind CSS, Prisma, PostgreSQL
- **Auth:** NextAuth v4 (credentials + Google OAuth)
- **AI Providers:** OpenAI, Anthropic Claude, Google Gemini (via lib/providers/llm/)
- **Test Runner:** `npm test` (Vitest + React Testing Library, 123 tests)
- **Build Command:** `npm run build`
- **Deploy Target:** Vercel (production) + Coolify (192.168.0.229) + Cloudflare Tunnel (future)
- **Package Manager:** npm
- **Key Directories:**
  - `app/` — Next.js pages and API routes
  - `lib/` — Auth, Prisma, LLM providers, context retrieval, sync engine
  - `tests/` — Vitest test suite (unit, API, component)
  - `docs/plans/` — Architecture blueprints
  - `prisma/` — Database schema

## Architecture Direction

**AI-first knowledge assistant** — NOT a unified inbox. The AI is the front door.
See `docs/plans/2026-02-06-synthesis-blueprint.md` for full blueprint.

Key decisions:
- MCP-first integrations (no local data sync)
- Chat-first UI with command palette and dashboard as secondary
- Three-tier memory system (session, working, preference)
- Full activity logging for transparency and adaptive learning
- Risk-tiered tool autonomy (safe=auto, destructive=confirm)
- PWA for mobile, Capacitor later if needed

Day-one platforms: Craft (5 MCPs), Teams, Telegram, OneDrive

## Build Phases

1. Core AI Chat + Craft (strip current app, new schema, wire Craft MCPs)
2. Memory System + Activity Log
3. Teams + Telegram + OneDrive MCP servers
4. Command Palette + PWA + Polish + Deploy

## Rules

- `"type": "module"` in package.json — all .js files must use ESM syntax
- Current codebase will be largely replaced in Phase 1 (strip sync engine, browsing pages)
- Tests exist for current code but will need rewriting as architecture changes
- Auth (NextAuth v4) is configured but sign-in form is a placeholder — not wired to `signIn()`. Dashboard pages have no session protection. Env vars (NEXTAUTH_SECRET, DATABASE_URL, GOOGLE_CLIENT_ID/SECRET) not set on Vercel.

## Session Log

### Feb 9, 2026 — Repo hygiene pass #4: security PR merged
- **Changes:** Merged #43 (Zod validation + DB-backed rate limiting for AI chat). Adds input validation schema (max 5000 chars) and 10 req/min per-user rate limit.
- **Tests:** 142/142 passing, build clean. Not pushed (GitHub outage).

- Feb 9: Repo hygiene pass #3 — merged #35 test conflict, #15 engine optimization. 140/140 tests.
- Feb 9: Repo hygiene pass #2 — merged #40 (bcrypt hashing). 138/138 tests.

### Feb 6, 2026 — CVE fix, Vercel deploy, auth audit
- **Changes:** Next.js 16.0.3 → 16.1.6 (CVE-2025-66478), Vercel deploy, auth audit
- **Tests:** 123/123, next steps: wire auth or Phase 1 rebuild

- Feb 6: Architecture blueprint, test suite bootstrap, ESM fix (123/123, 5a3ddd3)

- Feb 10: Repo hygiene #7 — merged 3 PRs (security rate limiting, UX chat input, perf context retrieval). 151/151 tests. All branches cleaned.
### Feb 13, 2026 — Repo Hygiene #12: Security + Perf + UX
- **Changes:** Merged 4 PRs: #64 (Security: Timing Attack), #61 (Security: Model Validation), #62 (Perf: File List Query), #63 (UX: Storage Loading).
- **Verification:** 155/155 tests passed. Build clean.
