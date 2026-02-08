import { ExternalLink } from 'lucide-react'
import { memo } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
}

interface MessageListProps {
  messages: Message[]
  loading: boolean
}

const MessageList = memo(function MessageList({ messages, loading }: MessageListProps) {
  // Bolt: Memoized component to prevent unnecessary re-renders when parent input changes
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg font-medium mb-2">Start a conversation with AI</p>
            <p className="text-sm">Ask questions about your emails, chats, files, and Notion pages</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-2xl ${msg.role === 'assistant' ? 'w-full' : ''}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Sources Display */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2">Sources Used:</p>
                    <div className="space-y-1">
                      {msg.sources.map((source: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <ExternalLink className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-blue-900">{source.title}</span>
                            {source.excerpt && (
                              <p className="text-blue-700 mt-0.5">{source.excerpt}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start" role="status" aria-live="polite">
            <div className="bg-white rounded-lg px-4 py-3 shadow">
              <div className="flex gap-1">
                <span className="sr-only">AI is thinking...</span>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default MessageList
