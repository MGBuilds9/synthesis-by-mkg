'use client'

import { useState } from 'react'
import { MessageSquare, Search, Filter, ChevronDown, Hash } from 'lucide-react'

export default function ChatsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedWorkspace, setSelectedWorkspace] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const showWorkspaceSelector = selectedPlatform === 'discord' || selectedPlatform === 'slack'
  const showChannelSelector = selectedPlatform === 'discord' || selectedPlatform === 'slack'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPlatform('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedPlatform('discord')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === 'discord'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Discord
            </button>
            <button
              onClick={() => setSelectedPlatform('whatsapp')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === 'whatsapp'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedPlatform('slack')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === 'slack'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Slack
            </button>
            <button
              onClick={() => setSelectedPlatform('telegram')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === 'telegram'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Telegram
            </button>
          </div>

          <div className="flex-1 min-w-[300px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {showFilters && (showWorkspaceSelector || showChannelSelector || selectedPlatform === 'telegram') && (
          <div className="flex gap-4 flex-wrap items-center bg-gray-50 p-4 rounded-lg">
            {showWorkspaceSelector && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {selectedPlatform === 'discord' ? 'Server:' : 'Workspace:'}
                </label>
                <div className="relative">
                  <select
                    value={selectedWorkspace}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">All {selectedPlatform === 'discord' ? 'Servers' : 'Workspaces'}</option>
                    <option value="1">Gaming Server</option>
                    <option value="2">Work Team</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {showChannelSelector && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Channel:</label>
                <div className="relative">
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">All Channels</option>
                    <option value="1"># general</option>
                    <option value="2"># random</option>
                    <option value="3"># announcements</option>
                  </select>
                  <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {selectedPlatform === 'telegram' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Chat:</label>
                <div className="relative">
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">All Chats</option>
                    <option value="1">Family Group</option>
                    <option value="2">Tech News</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No chats yet</p>
          <p className="text-sm mt-1">Connect your Discord, WhatsApp, Slack, or Telegram to get started</p>
        </div>
      </div>
    </div>
  )
}
