'use client'

import { useState } from 'react'
import { Settings, Mail, MessageSquare, FolderOpen, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import MessageList, { Message } from './components/MessageList'

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [provider, setProvider] = useState('OPENAI')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`)
  const [showContextSettings, setShowContextSettings] = useState(false)
  
  // Context domain toggles
  const [contextDomains, setContextDomains] = useState({
    emails: true,
    chats: true,
    files: true,
    notion: true,
  })
  
  // Ask before searching context
  const [askBeforeSearching, setAskBeforeSearching] = useState(true)

  function toggleContextDomain(domain: keyof typeof contextDomains) {
    setContextDomains(prev => ({ ...prev, [domain]: !prev[domain] }))
  }

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input,
          provider,
          contextDomains,
          askBeforeSearchingContext: askBeforeSearching,
        }),
      })

      const data = await response.json()
      
      if (data.response) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          sources: data.sources 
        }])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
              ← Back
            </a>
            <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              aria-label="Select AI Model"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="OPENAI">OpenAI</option>
              <option value="GEMINI">Gemini</option>
              <option value="CLAUDE">Claude</option>
            </select>
            
            <button
              onClick={() => setShowContextSettings(!showContextSettings)}
              aria-expanded={showContextSettings}
              aria-controls="context-settings-panel"
              aria-label="Context settings"
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Settings className="h-4 w-4" />
              Context
              {showContextSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        {/* Context Settings Panel */}
        {showContextSettings && (
          <div
            id="context-settings-panel"
            className="max-w-4xl mx-auto mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={askBeforeSearching}
                  onChange={(e) => setAskBeforeSearching(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-medium text-gray-700">Ask before searching context</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                When enabled, AI will ask which sources to search if the query is ambiguous
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Context Domains</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={contextDomains.emails}
                    onChange={() => toggleContextDomain('emails')}
                    className="rounded text-indigo-600"
                  />
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">Emails</span>
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={contextDomains.chats}
                    onChange={() => toggleContextDomain('chats')}
                    className="rounded text-indigo-600"
                  />
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Chats</span>
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={contextDomains.files}
                    onChange={() => toggleContextDomain('files')}
                    className="rounded text-indigo-600"
                  />
                  <FolderOpen className="h-4 w-4 text-orange-600" />
                  <span className="text-gray-700">Files</span>
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={contextDomains.notion}
                    onChange={() => toggleContextDomain('notion')}
                    className="rounded text-indigo-600"
                  />
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-700">Notion</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {/* Bolt: Optimized with memoized component to prevent re-renders on input changes */}
      <MessageList messages={messages} loading={loading} />

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            aria-label="Message input"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
