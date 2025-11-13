'use client'

import { useEffect, useState } from 'react'

export default function MessagesPage() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    try {
      const response = await fetch('/api/messages/list')
      const data = await response.json()
      setThreads(data.threads || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </a>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">All</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Discord</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">WhatsApp</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Gmail</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Outlook</button>
          </div>
        </div>

        {/* Message Threads */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading messages...</div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No messages yet. Connect your accounts to start syncing.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {threads.map((thread: any) => (
                <div key={thread.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {thread.provider}
                        </span>
                        {thread.isUnread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {thread.subject || 'No subject'}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {thread.messages[0]?.content || 'No preview available'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 ml-4">
                      {new Date(thread.lastMessageAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
