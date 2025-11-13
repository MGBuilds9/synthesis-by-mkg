'use client'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    unreadMessages: 0,
    recentFiles: 0,
    notionPages: 0,
  })

  useEffect(() => {
    // Fetch dashboard stats
    // This is a placeholder for now
    setStats({
      unreadMessages: 12,
      recentFiles: 45,
      notionPages: 8,
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.unreadMessages}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Files</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentFiles}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notion Pages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.notionPages}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/dashboard/messages" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-center">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm font-medium text-gray-900">Messages</div>
            </a>
            <a href="/dashboard/storage" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-center">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm font-medium text-gray-900">Storage</div>
            </a>
            <a href="/dashboard/ai-chat" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-center">
              <div className="text-2xl mb-2">🧠</div>
              <div className="text-sm font-medium text-gray-900">AI Chat</div>
            </a>
            <a href="/dashboard/settings" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-medium text-gray-900">Settings</div>
            </a>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h2>
          <p className="text-gray-600 mb-4">
            Connect your accounts to start syncing messages, files, and more.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Manage Accounts
          </a>
        </div>
      </div>
    </div>
  )
}
