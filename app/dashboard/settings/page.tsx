'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [accounts] = useState([
    // Placeholder data
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </a>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
          </div>
          <div className="p-6">
            {accounts.length === 0 ? (
              <p className="text-gray-500 mb-4">No accounts connected yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {accounts.map((account: any) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{account.provider}</div>
                      <div className="text-sm text-gray-500">{account.accountLabel}</div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 text-sm">
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                <div className="font-medium text-gray-900">+ Gmail</div>
                <div className="text-xs text-gray-500">Connect email</div>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                <div className="font-medium text-gray-900">+ Outlook</div>
                <div className="text-xs text-gray-500">Connect email</div>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                <div className="font-medium text-gray-900">+ Google Drive</div>
                <div className="text-xs text-gray-500">Connect storage</div>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                <div className="font-medium text-gray-900">+ OneDrive</div>
                <div className="text-xs text-gray-500">Connect storage</div>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                <div className="font-medium text-gray-900">+ Discord</div>
                <div className="text-xs text-gray-500">Connect bot</div>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                <div className="font-medium text-gray-900">+ Notion</div>
                <div className="text-xs text-gray-500">Connect workspace</div>
              </button>
            </div>
          </div>
        </div>

        {/* AI Provider Preferences */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">AI Preferences</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default AI Provider
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="OPENAI">OpenAI</option>
                <option value="GEMINI">Google Gemini</option>
                <option value="CLAUDE">Anthropic Claude</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Model
              </label>
              <input
                type="text"
                placeholder="e.g., gpt-4o-mini"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Provider Health */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Provider Health</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm">
              Monitor the health and sync status of your connected providers.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">All Systems</span>
                <span className="text-sm text-green-600 font-medium">● Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
