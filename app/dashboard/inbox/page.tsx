'use client'

import { useState, useRef, useEffect } from 'react'
import { Mail, Search, Filter, ChevronDown, Calendar, X } from 'lucide-react'

export default function InboxPage() {
  const [selectedProvider, setSelectedProvider] = useState('all')
  const [selectedEmailAddress, setSelectedEmailAddress] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [shortcutSymbol, setShortcutSymbol] = useState("Ctrl")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    ) {
      setShortcutSymbol("⌘")
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inbox</h1>
        <button className="px-3 sm:px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0">
          Compose
        </button>
      </div>

      <div className="mb-6 space-y-3 sm:space-y-4">
        <div className="flex gap-3 sm:gap-4 flex-wrap items-center">
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by provider">
            <button
              onClick={() => setSelectedProvider('all')}
              aria-pressed={selectedProvider === 'all'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedProvider === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedProvider('gmail')}
              aria-pressed={selectedProvider === 'gmail'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedProvider === 'gmail'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Gmail
            </button>
            <button
              onClick={() => setSelectedProvider('outlook')}
              aria-pressed={selectedProvider === 'outlook'}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedProvider === 'outlook'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Outlook
            </button>
          </div>

          <div className="flex-1 min-w-full sm:min-w-[300px] sm:max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Search emails"
              placeholder={`Search emails... (${shortcutSymbol}+K)`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            />
            {searchQuery && (
              <button
                type="button"
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
            aria-controls="filter-panel"
            className="p-3 sm:p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
          >
            <Filter className="h-5 w-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        {showFilters && (
          <div id="filter-panel" className="flex gap-3 sm:gap-4 flex-wrap items-center bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Email Account:</label>
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedEmailAddress}
                  onChange={(e) => setSelectedEmailAddress(e.target.value)}
                  className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer touch-manipulation"
                >
                  <option value="all">All Accounts</option>
                  <option value="personal@gmail.com">personal@gmail.com</option>
                  <option value="work@outlook.com">work@outlook.com</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</label>
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer touch-manipulation"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 sm:p-8 text-center text-gray-500">
          <Mail className="h-10 sm:h-12 w-10 sm:w-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="text-base sm:text-lg font-medium">No emails yet</p>
          <p className="text-sm mt-1">Connect your Gmail or Outlook account to get started</p>
        </div>
      </div>
    </div>
  )
}
