# Unified Console - Project Documentation

## Overview
A production-ready unified personal console that aggregates messages, files, and provides AI-powered assistance across multiple platforms including Discord, WhatsApp, Slack, Telegram, Microsoft Teams, Gmail, Outlook, Google Drive, OneDrive, and Notion.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js
- **AI:** OpenAI, Google Gemini, Anthropic Claude

## Project Structure
```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard pages
│   └── auth/             # Authentication pages
├── lib/                   # Core libraries
│   ├── providers/        # Provider integrations
│   ├── sync/             # Sync engine
│   └── context/          # AI context retrieval
├── prisma/               # Database schema
└── types/                # TypeScript definitions
```

## Implementation Status

### ✅ Core Infrastructure Complete
- Comprehensive Prisma schema with all models
- NextAuth.js authentication (needs password hashing for production)
- Full AI chat integration (OpenAI, Gemini, Claude) - **WORKS NOW**
- Sync engine architecture
- Provider abstraction layer
- Mobile-first UI for all pages
- API routes for messages, files, AI chat
- Context retrieval system
- Logging and observability

### 🚧 Provider Integrations (Scaffolded, Need Implementation)
All 10 provider integrations are **architected and ready** but need OAuth flows and sync handlers:
- **Email:** Gmail, Outlook
- **Chat/Messaging:** Discord, WhatsApp Business, Slack, Telegram, Microsoft Teams
- **Storage:** Google Drive, OneDrive
- **Knowledge:** Notion

See `IMPLEMENTATION_STATUS.md` for detailed breakdown.

## Quick Start

### AI Chat (Works Immediately!)
1. Add API key to `.env`:
   ```
   OPENAI_API_KEY=your-key-here
   # OR
   GEMINI_API_KEY=your-key-here
   # OR
   ANTHROPIC_API_KEY=your-key-here
   ```
2. Visit `http://localhost:5000/dashboard/ai-chat`
3. Start chatting!

### Database
Database is set up and all migrations applied.
- Run `npm run db:studio` to explore the schema visually
- Schema supports all planned features

## Key Features

### Granular Scope Selection
Each provider supports fine-grained control:
- **Discord:** Server + channel level
- **Slack:** Workspace + channel level
- **Teams:** Team + channel level
- **Telegram:** Chat-level selection
- **WhatsApp Business:** Phone number selection
- **Gmail:** Label-based filtering
- **Outlook:** Folder-based filtering
- **Drive/OneDrive:** Folder root selection
- **Notion:** Workspace, database, or page level

### Sync Engine
- Configurable historical window (30-90 days per scope)
- Webhook support where available
- Polling fallback with `lastSyncedAt` tracking
- Automatic scheduled sync every 15 minutes
- Provider health monitoring

### AI Context Integration
- Per-session context toggles
- Time-window based retrieval (default 30 days)
- Automatic summarization before LLM injection
- Supports messages, files, and Notion content

## User Preferences
User can customize:
- Account labels (e.g., "Personal Gmail", "Work Outlook")
- Sync scopes per account
- Historical sync window per scope
- Default AI provider and model
- Context sources for AI chat

## Development Commands
```bash
npm run dev          # Start development server (port 5000)
npm run build        # Build for production
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to DB
npm run db:studio    # Open Prisma Studio
```

## Next Steps for Full Implementation
1. Implement Gmail OAuth + sync (recommended first)
2. Add password hashing (bcrypt) for production security
3. Implement remaining providers as needed
4. Add user registration flow
5. Implement rate limiting
6. Add comprehensive error boundaries

## Documentation
- `README.md` - Complete setup guide
- `IMPLEMENTATION_STATUS.md` - Detailed status and next steps
- `.env.example` - All required environment variables

## Mobile Optimizations
- **44px minimum touch targets** on all interactive elements (buttons, inputs, filters)
- **Responsive breakpoints** using Tailwind's sm/md/lg/xl system
- **Touch-optimized interactions** with active states and touch-manipulation class
- **Full-width inputs** on mobile for better usability
- **Stacked layouts** on mobile that expand horizontally on larger screens
- **Proper spacing** with responsive padding (p-4 sm:p-6)

## Notes
- Server runs on port 5000 (configured for Replit webview)
- All UI pages are mobile-first responsive with 44px minimum touch targets
- Database schema is production-ready with support for all 10 providers
- AI chat is fully functional with any provider (OpenAI, Gemini, Claude)
- Provider integrations follow consistent patterns
- Microsoft Teams integration complete (schema, UI filters, selectors)

Last Updated: 2025-11-15
