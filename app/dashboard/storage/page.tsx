"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, X, Loader2, FolderOpen } from "lucide-react";

export default function StoragePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [shortcutSymbol, setShortcutSymbol] = useState("Ctrl");

  // Bolt: Use refs to manage request cancellation and avoid stale closures in effects
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchQueryRef = useRef(searchQuery);

  // Bolt: Sync searchQuery ref to access latest value in useEffect without triggering re-fetch
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Palette: Detect platform for keyboard shortcut symbol
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    ) {
      setShortcutSymbol("⌘");
    }

    // Palette: Add CMD/Ctrl+K shortcut for search focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Bolt: Memoized fetch function to handle request cancellation and params
  const fetchFiles = useCallback(async (provider: string, search?: string) => {
    // Cancel any in-flight request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (provider !== "ALL") params.append("provider", provider);

      const queryString = params.toString();
      const url = queryString
        ? `/api/files/list?${queryString}`
        : "/api/files/list";

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Failed to fetch files:", error);
      setFiles([]);
    } finally {
      // Only reset loading state if this request wasn't aborted/superseded
      if (abortControllerRef.current === controller) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, []);

  // Bolt: Fetch whenever provider changes, using current search query
  useEffect(() => {
    fetchFiles(selectedProvider, searchQueryRef.current);
  }, [selectedProvider, fetchFiles]);

  function handleSearch() {
    fetchFiles(selectedProvider, searchQuery);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Storage</h1>
        <p className="text-gray-600">View and manage all your synced files from Google Drive and OneDrive.</p>
      </div>

      {/* Storage Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/dashboard/integrations"
          className="border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Google Drive</h3>
              <p className="text-sm text-gray-600">Connect your Google Drive</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/integrations"
          className="border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0a12 12 0 0 0-4.8 23.04l1.44-1.2a10.08 10.08 0 1 1 6.72 0l1.44 1.2A12 12 0 0 0 12 0z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">OneDrive</h3>
              <p className="text-sm text-gray-600">Connect your OneDrive</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Search files"
              placeholder={`Search files... (${shortcutSymbol}+K)`}
              className="w-full px-4 py-2 border rounded-lg pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  fetchFiles(selectedProvider, "");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 min-w-[120px] justify-center"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Provider Filter */}
        <div className="mt-4 flex gap-2" role="group" aria-label="Filter by provider">
          <button
            onClick={() => setSelectedProvider("ALL")}
            aria-pressed={selectedProvider === "ALL"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedProvider === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Files
          </button>
          <button
            onClick={() => setSelectedProvider("GDRIVE")}
            aria-pressed={selectedProvider === "GDRIVE"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedProvider === "GDRIVE"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Google Drive
          </button>
          <button
            onClick={() => setSelectedProvider("ONEDRIVE")}
            aria-pressed={selectedProvider === "ONEDRIVE"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedProvider === "ONEDRIVE"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            OneDrive
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p>Searching files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No files found</h3>
            <p className="max-w-md mx-auto">
            {selectedProvider === "ALL"
              ? "Connect your storage accounts or change your search terms."
              : `No ${selectedProvider === "GDRIVE" ? "Google Drive" : "OneDrive"} files found matching your criteria.`}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Provider
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Modified
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file: any) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {file.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {file.provider === "GDRIVE" ? "Google Drive" : "OneDrive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.modifiedTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${file.name} in new tab`}
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
