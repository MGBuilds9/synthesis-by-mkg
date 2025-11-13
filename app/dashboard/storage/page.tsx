'use client'

import { useEffect, useState } from 'react'

export default function StoragePage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFiles()
  }, [])

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
          <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </a>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search files..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">All</button>
            <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Google Drive</button>
            <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">OneDrive</button>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No files yet. Connect your storage accounts to start syncing.
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
                {files.map((file: any) => (
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
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Open
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
