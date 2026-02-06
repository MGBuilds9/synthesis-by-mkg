# Synthesis — Architecture Blueprint

## Product Vision

Synthesis is a personal AI-first knowledge assistant that connects to your digital life through MCP and acts on your behalf. The AI is the interface — you talk to it, it queries your platforms live, retrieves what you need, and executes tasks with tiered autonomy.

It is NOT a unified inbox or file browser. It's a personal RAG-style app with live access to your messaging, knowledge, and file platforms — managed through conversation.

## Core Principles

1. **AI is the front door** — chat is the primary interface, everything else is secondary
2. **MCP-first** — no local data sync, query platforms live on demand
3. **Autonomous but accountable** — safe actions execute immediately, risky actions require confirmation
4. **Everything is logged** — full audit trail for transparency, debugging, and adaptive learning
5. **Memory makes it better** — distilled preferences and patterns, not raw dumps
6. **Context-efficient** — never waste tokens on stale or redundant context

## Architecture

```
User (Web/PWA) <-> Chat UI <-> Next.js API <-> AI Engine (Claude) <-> MCP Servers
                                                      |
                                                Local Postgres
                                          (conversations, memory,
                                           activity log, preferences)
```

### What's stored locally (Postgres)
- AI conversation history (threads + messages)
- Activity log (every AI action with timestamps and outcomes)
- User memory (distilled preferences and patterns)
- Connected platform config
- Notifications (lightweight previews from webhooks)

### What's NOT stored locally
- Messages from Teams/Telegram
- Files from OneDrive
- Docs from Craft/Notion
- Email content

All platform data is queried live through MCP when the AI needs it.

## AI Engine

### Tool Use Risk Classification

| Risk Level | Examples | Behavior |
|------------|----------|----------|
| **Safe** | Read Craft docs, search OneDrive, read Teams/Telegram messages, search Notion | Execute immediately |
| **Safe** | Create Craft doc, add blocks, log notes | Execute immediately |
| **Confirm** | Send a Teams message, post in Telegram, reply to email | Show draft, wait for approval |
| **Confirm** | Delete anything, modify shared resources, update public content | Show intent, wait for approval |

Risk classification is config-driven, not hardcoded — adjustable over time.

### Memory System — Three Tiers

**1. Session memory**
Current conversation context. Lives for the duration of the thread.

**2. Working memory**
Distilled facts and active context. Key-value pairs with timestamps.
Examples: "MKG Builds uses Coolify for deploys", "pharmacy workspace docs follow X naming convention."
Capped at a token budget (~2000 tokens). Oldest/least-used entries get evicted or compressed.

**3. Preference memory**
How you like things done. Learned from corrections — when you edit AI output or say "do it like this," it extracts a rule.
Examples: "Always format Craft docs with H2 headers", "prefer bullet points over paragraphs."
Stored as simple rules, never raw conversation dumps.

At conversation start: working memory + preference memory are injected as a compact system prompt.

### Activity Log

Every AI action writes an append-only log entry:

```
{ timestamp, action, tool_used, mcp_server, input_summary,
  output_summary, risk_level, user_approved, success,
  error_details, tokens_used }
```

Triple purpose: transparency (you review), debugging (trace failures), learning (AI queries its own log to avoid repeating mistakes).

## Thread Lifecycle

### Auto-organized threads
- Every conversation persists and is resumable
- AI auto-titles and groups threads by topic
- You can pin or rename any thread
- Pinned threads are exempt from expiry

### 60-day lifecycle
- After 60 days inactive, thread enters expiry evaluation
- AI evaluates: extract useful learnings into working/preference memory, summarize key decisions into a compact note
- Then archive or delete the raw conversation
- Pinned threads skip this entirely

## Integration Layer — MCP-First

### Day-One Platforms

| Platform | MCP Server | Capabilities |
|----------|-----------|--------------|
| **Craft** | 5 existing servers (mkg-builds, pharmacy, mdm, natoula, personal) | Read/write docs, blocks, collections, search, tasks, comments |
| **Microsoft Teams** | New — Microsoft Graph API | Read channels/messages, send messages (confirm), list teams, search |
| **Telegram** | New — Telegram Bot API | Read chats/messages, send messages (confirm), list groups |
| **OneDrive** | New — Microsoft Graph API | Browse files, search, read content, share links |

### MCP Runtime
Each MCP server runs as a sidecar container in Coolify alongside the Next.js app. Connected via stdio or SSE. Persistent runtime — no cold starts.

### Webhook Layer (Notifications Only)
Telegram and Teams webhooks push to Next.js API -> Notification store -> Dashboard widget.
Webhooks don't feed the AI directly — they surface notifications. The AI queries platforms live when you interact.

### Later Integrations (Not Day-One)
- Gmail / Outlook (email context)
- Google Drive (redundant with OneDrive initially)
- Notion (secondary knowledge base, "for the vibes")

## UI — Chat-First Design

### Three layers, one screen

```
+--------------------------------------------------+
|  +----------+  +------------------+  +----------+ |
|  |          |  |                  |  |          | |
|  |  Thread  |  |    AI Chat       |  |  Dash    | |
|  |  Sidebar |  |   (primary)      |  |  Panel   | |
|  |          |  |                  |  |          | |
|  |  pinned  |  |                  |  |  notifs  | |
|  |  recent  |  |                  |  |  recent  | |
|  |  grouped |  |                  |  |  quick   | |
|  |          |  |                  |  |  stats   | |
|  |          |  |  [input] [send]  |  |          | |
|  +----------+  +------------------+  +----------+ |
|            Cmd+K overlay when triggered            |
+--------------------------------------------------+
```

**Left panel: Thread sidebar** — Pinned threads at top, auto-grouped by topic, searchable. Collapsible on mobile.

**Center: AI chat** — Primary interface. Full-width when panels collapsed. Shows tool usage badges ("read from Craft", "searched OneDrive"). Inline confirm/deny for risky actions. Activity log toggle.

**Right panel: Dashboard widgets** — Notification feed, recent Craft activity, unread counts, quick stats. Collapsible, hidden by default on mobile.

**Cmd+K command palette** — Quick actions without full prompts. "Search OneDrive for...", "Open Craft doc...", "Show unread Teams". Fuzzy search, keyboard-first.

### Mobile (PWA)
- Progressive Web App with manifest + service worker
- Push notifications for Teams/Telegram webhooks
- Chat-first UI translates naturally (it's a messaging app)
- Add to homescreen, works like native
- Capacitor wrapper later if App Store presence needed

## Data Model (Postgres)

6 tables. The current 14-model schema gets replaced entirely.

```sql
User
  id, email, name, image, created_at

ConnectedPlatform
  id, user_id, platform (CRAFT|TEAMS|TELEGRAM|ONEDRIVE|NOTION|GMAIL)
  mcp_server_id, config (JSON), is_active, created_at

Thread
  id, user_id, title, topic_group, is_pinned
  status (ACTIVE|ARCHIVED|EXPIRED)
  expires_at, summary, created_at, updated_at

Message
  id, thread_id, role (USER|ASSISTANT|SYSTEM)
  content, tool_calls (JSON), sources (JSON)
  tokens_used, created_at

ActivityLog
  id, user_id, thread_id (nullable)
  action, tool_used, mcp_server, input_summary
  output_summary, risk_level (SAFE|CONFIRM)
  user_approved (nullable), success, error_details
  tokens_used, created_at

Memory
  id, user_id, tier (WORKING|PREFERENCE)
  key, value, category, source_thread_id (nullable)
  access_count, last_accessed, created_at, updated_at

Notification
  id, user_id, platform, channel, preview
  is_read, raw_data (JSON), received_at
```

## Deployment

- **Runtime:** Coolify on homelab (192.168.0.229)
- **Public access:** Cloudflare Tunnel (or Nginx Proxy Manager)
- **Database:** Postgres container on Coolify
- **MCP servers:** Sidecar containers in Coolify
- **PWA:** Served from the Next.js app itself

## Build Sequence

### Phase 1: Core AI Chat + Craft (1-2 sessions)
- Strip current app: remove Inbox, Chats, Storage, Notion pages, sync engine, unused models
- Keep: Auth (NextAuth), layout shell, Tailwind, test infrastructure
- Build: New Prisma schema (6 tables), chat UI (center panel + thread sidebar), AI engine with Claude tool use wired to 5 existing Craft MCP servers
- **Milestone:** Talk to Claude, it reads/writes across all 5 Craft workspaces, threads persist and auto-organize

### Phase 2: Memory System + Activity Log (1 session)
- Build: Three-tier memory, activity log on every AI action, risk classification, inline confirm/deny UI
- Build: Memory injection into system prompt at conversation start
- Build: Activity log viewer toggle in chat
- **Milestone:** AI learns preferences, logs everything, risky actions gated

### Phase 3: Teams + Telegram + OneDrive (2-3 sessions)
- Build: MCP server for Microsoft Teams (Graph API)
- Build: MCP server for Telegram (Bot API)
- Build: MCP server for OneDrive (Graph API)
- Build: Webhook endpoints for Teams + Telegram -> Notification table
- Build: Right panel dashboard with notification feed
- **Milestone:** Full day-one integration suite across 4 platforms

### Phase 4: Command Palette + PWA + Polish (1 session)
- Build: Cmd+K palette with fuzzy search, quick actions, recent commands
- Build: Thread lifecycle — 60-day expiry, AI evaluation, memory extraction
- Build: Dashboard widgets (unread counts, recent Craft activity, quick stats)
- Build: PWA manifest, service worker, push notifications
- Deploy: Coolify container setup + Cloudflare Tunnel
- **Milestone:** Complete product, accessible from anywhere, on any device

## Not Building (YAGNI)

- No local data sync/caching of platform content
- No Discord/WhatsApp/Slack integration (not in top 4)
- No multi-user support
- No email integration in v1
- No Notion integration in v1 (Craft covers knowledge base)
- No native mobile app (PWA first, Capacitor later if needed)
- No React Native
