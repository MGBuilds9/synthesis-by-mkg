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

### Feb 6, 2026 — CVE fix, Vercel deploy, auth audit
- **Changes:** Upgraded Next.js 16.0.3 → 16.1.6 to fix CVE-2025-66478 (React2Shell RCE). Deployed to Vercel successfully. Audited auth system — NextAuth v4 configured but sign-in form not wired, no middleware, missing env vars.
- **Decisions:** Vercel now primary deploy target (was Coolify-only). Auth needs either quick-wire or full Phase 1 rebuild.
- **Tests:** 123 passed, 0 failed, 0 new (dependency-only change)
- **Next steps:** Decide: quick-wire existing auth OR jump to Phase 1 rebuild. Set Vercel env vars (NEXTAUTH_SECRET, DATABASE_URL, GOOGLE_CLIENT_ID/SECRET).

### Feb 6, 2026 — Architecture blueprint, test suite bootstrap, ESM fix
- Fixed CJS/ESM conflict, bootstrapped 123 tests, created AI-first architecture blueprint (123/123, 5a3ddd3)
