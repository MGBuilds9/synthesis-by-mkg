// Bolt: Extract array literals used for scope type checking into Set constants at the module level.
// This eliminates redundant object allocations and garbage collection overhead during every request execution.
export const EMAIL_SCOPES = new Set(['GMAIL_LABEL', 'OUTLOOK_FOLDER']);
export const CHAT_SCOPES = new Set(['DISCORD_SERVER', 'DISCORD_CHANNEL', 'WHATSAPP_ACCOUNT', 'SLACK_WORKSPACE', 'SLACK_CHANNEL', 'TELEGRAM_CHAT', 'TEAMS_WORKSPACE', 'TEAMS_CHANNEL']);
export const FILE_SCOPES = new Set(['DRIVE_FOLDER', 'ONEDRIVE_FOLDER']);
export const NOTION_SCOPES = new Set(['NOTION_WORKSPACE', 'NOTION_DATABASE', 'NOTION_PAGE']);
