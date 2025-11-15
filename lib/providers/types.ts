import { ProviderType } from '@prisma/client'

export interface ProviderConfig {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  metadata?: any
}

export interface MessageProvider {
  fetchMessages(config: ProviderConfig, scopeId: string, lastSyncedAt?: Date): Promise<NormalizedMessage[]>
  sendMessage(config: ProviderConfig, threadId: string, content: string): Promise<void>
  refreshToken?(config: ProviderConfig): Promise<ProviderConfig>
}

export interface StorageProvider {
  fetchFiles(config: ProviderConfig, folderId?: string, lastSyncedAt?: Date): Promise<NormalizedFile[]>
  searchFiles(config: ProviderConfig, query: string): Promise<NormalizedFile[]>
  refreshToken?(config: ProviderConfig): Promise<ProviderConfig>
}

export interface KnowledgeProvider {
  fetchResources(config: ProviderConfig, workspaceId: string): Promise<NormalizedResource[]>
  searchResources(config: ProviderConfig, query: string): Promise<NormalizedResource[]>
  refreshToken?(config: ProviderConfig): Promise<ProviderConfig>
}

export interface NormalizedMessage {
  providerThreadId: string
  providerMessageId: string
  sender: string
  subject?: string
  content: string
  htmlContent?: string
  sentAt: Date
  participants: string[]
  metadata?: any
}

export interface NormalizedFile {
  providerFileId: string
  name: string
  mimeType?: string
  size?: number
  webViewLink?: string
  iconLink?: string
  modifiedTime: Date
  path?: string
  metadata?: any
}

export interface NormalizedResource {
  providerResourceId: string
  resourceType: 'PAGE' | 'DATABASE'
  title: string
  url?: string
  lastEditedTime: Date
  metadata?: any
}

export interface LLMProvider {
  chat(messages: ChatMessage[], model?: string, systemPrompt?: string): Promise<string>
  streamChat?(messages: ChatMessage[], model?: string, systemPrompt?: string): AsyncGenerator<string>
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ProviderHealth {
  provider: ProviderType
  isHealthy: boolean
  lastSuccessfulSync?: Date
  lastError?: string
  rateLimitStatus?: {
    remaining: number
    resetAt: Date
  }
  tokenStatus?: {
    isValid: boolean
    expiresAt?: Date
  }
}

export enum ContextDomain {
  EMAILS = 'EMAILS',
  CHATS = 'CHATS',
  FILES = 'FILES',
  NOTION = 'NOTION'
}

export interface RetrievalSource {
  provider: ProviderType
  resourceId: string
  resourceType: 'message' | 'file' | 'notion'
  title: string
  excerpt: string
  url?: string
  timestamp: Date
}
