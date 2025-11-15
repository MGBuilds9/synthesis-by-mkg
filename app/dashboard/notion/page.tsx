'use client'

import { useState } from 'react'
import { FileText, Search } from 'lucide-react'

export default function NotionPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notion</h1>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <div className="flex-1 min-w-[300px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search Notion pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No Notion pages synced yet</p>
          <p className="text-sm mt-1">Connect your Notion workspace to get started</p>
        </div>
      </div>
    </div>
  )
}
