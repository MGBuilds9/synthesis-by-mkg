# Synthesis

## Project Context

- **Type:** Next.js App (App Router)
- **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma, PostgreSQL
- **Auth:** NextAuth v4 (credentials + Google OAuth)
- **AI Providers:** OpenAI, Anthropic Claude, Google Gemini (via lib/providers/llm/)
- **Test Runner:** `npm test` (Vitest + React Testing Library, 123 tests)
- **Build Command:** `npm run build`
- **Deploy Target:** Coolify (192.168.0.229) + Cloudflare Tunnel
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

## Session Log

### Feb 6, 2026 — Architecture blueprint, test suite bootstrap, ESM fix
- **Changes:** Fixed CJS/ESM conflict (package.json "type": "module" + next.config.js export default). Bootstrapped Vitest test infrastructure with 123 tests across 16 files. Created full architecture blueprint for AI-first rebuild.
- **Decisions:** Rearchitected from unified inbox to AI-first knowledge assistant. MCP-first (no local sync), chat-first UI, 6-table Prisma schema replacing current 14 models. Coolify + Cloudflare Tunnel deployment. PWA for mobile.
- **Tests:** 123 passed, 0 failed, 123 new tests added (16 files)
- **Next steps:** Phase 1 — strip current app, implement new Prisma schema, build chat UI, wire Claude tool use to Craft MCPs
