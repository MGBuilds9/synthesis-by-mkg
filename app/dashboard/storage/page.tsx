'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ExternalLink, X } from 'lucide-react'

export default function StoragePage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('ALL')

  useEffect(() => {
    fetchFiles()
  }, [])

  const filteredFiles = files.filter((file: any) => {
    if (selectedProvider === 'ALL') return true
    return file.provider === selectedProvider
  })

  async function fetchFiles(search?: string) {
    try {
      const url = search 
        ? `/api/files/list?search=${encodeURIComponent(search)}`
        : '/api/files/list'
      const response = await fetch(url)
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    setLoading(true)
    fetchFiles(searchQuery)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Storage</h1>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search files..."
                aria-label="Search files"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    fetchFiles('')
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              aria-busy={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[100px] justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Searching...</span>
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
          <div
            className="flex gap-2 mt-3"
            role="group"
            aria-label="Filter by provider"
          >
            <button
              onClick={() => setSelectedProvider('ALL')}
              aria-pressed={selectedProvider === 'ALL'}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                selectedProvider === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedProvider('GDRIVE')}
              aria-pressed={selectedProvider === 'GDRIVE'}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                selectedProvider === 'GDRIVE'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Google Drive
            </button>
            <button
              onClick={() => setSelectedProvider('ONEDRIVE')}
              aria-pressed={selectedProvider === 'ONEDRIVE'}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                selectedProvider === 'ONEDRIVE'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              OneDrive
            </button>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {files.length === 0
                ? "No files yet. Connect your storage accounts to start syncing."
                : `No ${selectedProvider === 'GDRIVE' ? 'Google Drive' : 'OneDrive'} files found.`
              }
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file: any) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {file.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.size ? `${(Number(file.size) / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.modifiedTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 group"
                          aria-label={`Open ${file.name} in new tab`}
                          title={`Open ${file.name} in new tab`}
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3 group-hover:underline" aria-hidden="true" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
