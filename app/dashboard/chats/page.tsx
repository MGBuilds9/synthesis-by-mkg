'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Search, Filter, ChevronDown, Hash, X } from 'lucide-react'

export default function ChatsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedWorkspace, setSelectedWorkspace] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [shortcutSymbol, setShortcutSymbol] = useState("Ctrl")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check platform only once on mount
    const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    if (isMac) {
      setShortcutSymbol("⌘");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, []) // Empty dependency array ensures this runs only once

  const showWorkspaceSelector = selectedPlatform === 'discord' || selectedPlatform === 'slack' || selectedPlatform === 'teams'
  const showChannelSelector = selectedPlatform === 'discord' || selectedPlatform === 'slack' || selectedPlatform === 'teams'

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chats</h1>
      </div>

      <div className="mb-6 space-y-3 sm:space-y-4">
        <div className="flex gap-3 sm:gap-4 flex-wrap items-center">
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Platform filter">
            <button
              onClick={() => setSelectedPlatform('all')}
              aria-pressed={selectedPlatform === 'all'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedPlatform === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedPlatform('discord')}
              aria-pressed={selectedPlatform === 'discord'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedPlatform === 'discord'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Discord
            </button>
            <button
              onClick={() => setSelectedPlatform('whatsapp')}
              aria-pressed={selectedPlatform === 'whatsapp'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedPlatform === 'whatsapp'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedPlatform('slack')}
              aria-pressed={selectedPlatform === 'slack'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedPlatform === 'slack'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Slack
            </button>
            <button
              onClick={() => setSelectedPlatform('teams')}
              aria-pressed={selectedPlatform === 'teams'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedPlatform === 'teams'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Teams
            </button>
            <button
              onClick={() => setSelectedPlatform('telegram')}
              aria-pressed={selectedPlatform === 'telegram'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedPlatform === 'telegram'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Telegram
            </button>
          </div>

          <div className="flex-1 min-w-full sm:min-w-[300px] sm:max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search chats... (${shortcutSymbol}+K)`}
              aria-label="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  searchInputRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
            className="p-3 sm:p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
          >
            <Filter className="h-5 w-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        {showFilters && (showWorkspaceSelector || showChannelSelector || selectedPlatform === 'telegram') && (
          <div className="flex gap-3 sm:gap-4 flex-wrap items-center bg-gray-50 p-3 sm:p-4 rounded-lg">
            {showWorkspaceSelector && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {selectedPlatform === 'discord' ? 'Server:' : selectedPlatform === 'teams' ? 'Team:' : 'Workspace:'}
                </label>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedWorkspace}
                    aria-label={selectedPlatform === 'discord' ? 'Select Server' : selectedPlatform === 'teams' ? 'Select Team' : 'Select Workspace'}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                    className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer touch-manipulation"
                  >
                    <option value="all">All {selectedPlatform === 'discord' ? 'Servers' : selectedPlatform === 'teams' ? 'Teams' : 'Workspaces'}</option>
                    <option value="1">{selectedPlatform === 'discord' ? 'Gaming Server' : selectedPlatform === 'teams' ? 'Engineering Team' : 'Work Team'}</option>
                    <option value="2">{selectedPlatform === 'discord' ? 'Work Team' : selectedPlatform === 'teams' ? 'Marketing Team' : 'Side Project'}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            )}

            {showChannelSelector && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Channel:</label>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedChannel}
                    aria-label="Select Channel"
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer touch-manipulation"
                  >
                    <option value="all">All Channels</option>
                    <option value="1"># general</option>
                    <option value="2"># random</option>
                    <option value="3"># announcements</option>
                  </select>
                  <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            )}

            {selectedPlatform === 'telegram' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Chat:</label>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedChannel}
                    aria-label="Select Chat"
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer touch-manipulation"
                  >
                    <option value="all">All Chats</option>
                    <option value="1">Family Group</option>
                    <option value="2">Tech News</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 sm:p-8 text-center text-gray-500">
          <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="text-base sm:text-lg font-medium">No chats yet</p>
          <p className="text-sm mt-1 px-4">
            <Link href="/dashboard/settings" className="text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
              Connect your accounts
            </Link> to get started
          </p>
        </div>
      </div>
    </div>
  )
}
