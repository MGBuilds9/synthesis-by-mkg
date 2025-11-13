# Unified Console

A production-ready unified personal console that aggregates messages, files, and provides AI-powered assistance across multiple platforms.

## Features

### 🔔 Unified Messaging
- **Discord** - Server channels via bot authorization
- **WhatsApp Business** - Official Cloud API integration
- **Gmail** - Full email sync with label-based filtering
- **Microsoft Outlook** - Email sync with folder-based filtering

### 📦 Unified Storage
- **Google Drive** - Multiple account support with folder-level sync
- **OneDrive** - Multiple account support with folder-level sync

### 🧠 AI Chat
- **OpenAI** - GPT-4 and other models
- **Google Gemini** - Google's AI models
- **Anthropic Claude** - Claude models
- Context-aware conversations using your connected data

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with OAuth support
- **Integrations**: Official APIs for all providers

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- API keys for desired integrations

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration values:

- Database connection (DATABASE_URL)
- NextAuth configuration (NEXTAUTH_SECRET, NEXTAUTH_URL)
- Provider API keys (see OAuth Configuration below)
- AI provider API keys (OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY)

3. Initialize the database:

```bash
npm run db:push
npm run db:generate
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

## OAuth Configuration

### Google (Gmail & Drive)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API and Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/oauth/gmail/callback`
6. Add credentials to `.env`:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GDRIVE_CLIENT_ID`
   - `GDRIVE_CLIENT_SECRET`

### Microsoft (Outlook & OneDrive)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to App Registrations
3. Create new registration
4. Add redirect URI: `http://localhost:5000/api/oauth/microsoft/callback`
5. Grant permissions for Mail.Read, Mail.Send, Files.Read
6. Add credentials to `.env`:
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Create a bot and get bot token
4. Add OAuth2 redirect URI: `http://localhost:5000/api/oauth/discord/callback`
5. Add credentials to `.env`:
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_BOT_TOKEN`

### WhatsApp Business Cloud API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create WhatsApp Business app
3. Get Phone Number ID and Access Token
4. Set up webhook with verify token
5. Add credentials to `.env`:
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

### Notion

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create new integration
3. Add OAuth redirect URI: `http://localhost:5000/api/oauth/notion/callback`
4. Add credentials to `.env`:
   - `NOTION_CLIENT_ID`
   - `NOTION_CLIENT_SECRET`

### AI Providers

#### OpenAI
- Get API key from [OpenAI Platform](https://platform.openai.com/)
- Add to `.env`: `OPENAI_API_KEY`

#### Google Gemini
- Get API key from [Google AI Studio](https://makersuite.google.com/)
- Add to `.env`: `GEMINI_API_KEY`

#### Anthropic Claude
- Get API key from [Anthropic Console](https://console.anthropic.com/)
- Add to `.env`: `ANTHROPIC_API_KEY`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth routes
│   │   ├── messages/     # Message endpoints
│   │   ├── files/        # File endpoints
│   │   └── ai/           # AI chat endpoints
│   ├── dashboard/         # Dashboard pages
│   └── auth/             # Auth pages
├── components/            # React components
├── lib/                   # Shared libraries
│   ├── providers/        # Provider integrations
│   │   ├── llm/         # AI providers
│   │   └── types.ts     # Type definitions
│   ├── sync/             # Sync engine
│   ├── context/          # Context retrieval
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   └── logger.ts         # Logging utilities
└── prisma/               # Database schema
    └── schema.prisma
```

## Features Implementation Status

### Core Infrastructure ✅
- [x] Next.js setup with TypeScript
- [x] PostgreSQL database with Prisma
- [x] NextAuth authentication
- [x] Provider abstraction layer

### Messaging 🚧
- [x] Data models and API routes
- [ ] Gmail integration (OAuth + sync)
- [ ] Outlook integration (OAuth + sync)
- [ ] Discord integration (bot + OAuth)
- [ ] WhatsApp Business integration (webhooks)

### Storage 🚧
- [x] Data models and API routes
- [ ] Google Drive integration (OAuth + sync)
- [ ] OneDrive integration (OAuth + sync)

### Knowledge 🚧
- [x] Data models and API routes
- [ ] Notion integration (OAuth + sync)

### AI Chat ✅
- [x] OpenAI integration
- [x] Gemini integration
- [x] Claude integration
- [x] Context retrieval system

### Sync Engine 🚧
- [x] Core sync architecture
- [x] Scope-based sync
- [ ] Webhook handlers
- [ ] Provider-specific sync implementations

### UI ✅
- [x] Dashboard layout
- [x] Messages view
- [x] Storage view
- [x] AI Chat interface
- [x] Settings page

## Database Schema

The application uses a comprehensive schema supporting:

- **User management** with NextAuth
- **Connected accounts** for each provider
- **Sync scopes** for granular sync control
- **Messages & threads** with unified structure
- **File items** with metadata
- **Notion resources** (pages/databases)
- **AI chat sessions** with context
- **Provider logs** for observability

Run `npx prisma studio` to explore the database visually.

## Sync Configuration

Each connected account can have multiple sync scopes:

- **Discord**: Per-server and per-channel scopes
- **Gmail**: Per-label scopes
- **Outlook**: Per-folder scopes
- **Google Drive**: Per-folder root scopes
- **OneDrive**: Per-folder root scopes
- **Notion**: Per-workspace, database, or page scopes

Configure historical sync window (default: 90 days) per scope.

## API Endpoints

### Messages
- `GET /api/messages/list` - List message threads
- `POST /api/messages/send` - Send a message

### Files
- `GET /api/files/list` - List files
- `GET /api/files/search` - Search files

### AI Chat
- `POST /api/ai/chat` - Send chat message

### Sync
- `POST /api/sync/trigger` - Manually trigger sync

## Development

### Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

### Building for Production

```bash
npm run build
npm start
```

## Mobile App (Future)

The app is designed with mobile-first UI patterns and can be wrapped with:
- Capacitor for iOS/Android
- React Native wrapper

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
