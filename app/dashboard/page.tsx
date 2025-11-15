'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, MessageSquare, FolderOpen, FileText, Bot, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react'

export default function DashboardPage() {
  const [todayStats, setTodayStats] = useState({
    newEmails: 0,
    newChats: 0,
    recentFiles: 0,
    recentNotionPages: 0,
  })

  const [connectedAccounts, setConnectedAccounts] = useState([
    { provider: 'Gmail', status: 'connected', icon: Mail },
    { provider: 'Discord', status: 'connected', icon: MessageSquare },
    { provider: 'Google Drive', status: 'needs_attention', icon: FolderOpen },
    { provider: 'Notion', status: 'not_connected', icon: FileText },
    { provider: 'Outlook', status: 'not_connected', icon: Mail },
    { provider: 'Slack', status: 'not_connected', icon: MessageSquare },
  ])

  useEffect(() => {
    // Fetch today's stats
    setTodayStats({
      newEmails: 5,
      newChats: 12,
      recentFiles: 8,
      recentNotionPages: 3,
    })
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Command Center</h1>

      {/* Today Widgets */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Today</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/inbox" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Emails</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{todayStats.newEmails}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/chats" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Chat Messages</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{todayStats.newChats}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/storage" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Files</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{todayStats.recentFiles}</p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/notion" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Notion Pages</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{todayStats.recentNotionPages}</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link href="/dashboard/inbox" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Inbox</span>
            </div>
          </Link>

          <Link href="/dashboard/chats" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Chats</span>
            </div>
          </Link>

          <Link href="/dashboard/storage" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <FolderOpen className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Storage</span>
            </div>
          </Link>

          <Link href="/dashboard/notion" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Notion</span>
            </div>
          </Link>

          <Link href="/dashboard/ai-assistant" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">AI Assistant</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Connected Accounts Status Strip */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Connected Accounts</h2>
          <Link 
            href="/dashboard/settings" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Manage All
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {connectedAccounts.map((account) => {
            const Icon = account.icon
            return (
              <div 
                key={account.provider}
                className="relative bg-gray-50 rounded-lg p-4 text-center border-2 border-transparent hover:border-indigo-200 transition-colors"
              >
                <div className={`h-10 w-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  account.status === 'connected' ? 'bg-green-100' :
                  account.status === 'needs_attention' ? 'bg-yellow-100' :
                  'bg-gray-200'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    account.status === 'connected' ? 'text-green-600' :
                    account.status === 'needs_attention' ? 'text-yellow-600' :
                    'text-gray-400'
                  }`} />
                </div>
                <p className="text-xs font-medium text-gray-900 mb-1">{account.provider}</p>
                <div className="absolute top-2 right-2">
                  {account.status === 'connected' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {account.status === 'needs_attention' && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  {account.status === 'not_connected' && (
                    <PlusCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
