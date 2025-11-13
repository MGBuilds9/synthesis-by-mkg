'use client'

import { useState } from 'react'

export default function AIChatPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [provider, setProvider] = useState('OPENAI')
  const [useContext, setUseContext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`)

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
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
          useContext,
        }),
      })

      const data = await response.json()
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
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
            <h1 className="text-xl font-bold text-gray-900">AI Chat</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="OPENAI">OpenAI</option>
              <option value="GEMINI">Gemini</option>
              <option value="CLAUDE">Claude</option>
            </select>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useContext}
                onChange={(e) => setUseContext(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-gray-700">Use Context</span>
            </label>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              Start a conversation with AI
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-4 py-3 shadow">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
