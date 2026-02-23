import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AIChatPage from '@/app/dashboard/ai-assistant/page'

// Mock MessageList to simplify testing
vi.mock('@/app/dashboard/ai-assistant/components/MessageList', () => ({
  default: ({ loading }: { loading: boolean }) => (
    <div data-testid="message-list">
      {loading ? 'Loading...' : 'Messages'}
    </div>
  ),
}))

// Mock fetch
global.fetch = vi.fn()

describe('AIChatPage UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'AI response', sources: [] }),
    })
  })

  it('focuses input when pressing Ctrl+K', async () => {
    render(<AIChatPage />)
    const input = screen.getByLabelText('Message input')

    // Simulate Ctrl+K keydown
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
  })

  it('focuses input when pressing Cmd+K (Mac)', async () => {
    // Mock navigator.platform for Mac
    Object.defineProperty(window.navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    })

    render(<AIChatPage />)
    const input = screen.getByLabelText('Message input')

    // Simulate Cmd+K keydown
    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
  })

  it('displays the correct shortcut hint in placeholder (Mac)', async () => {
     // Mock navigator.platform for Mac
     Object.defineProperty(window.navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    })

    render(<AIChatPage />)
    const input = screen.getByLabelText('Message input')

    // Check if placeholder contains the Mac symbol
    expect(input.getAttribute('placeholder')).toContain('⌘+K')
  })

  it('displays the correct shortcut hint in placeholder (Windows/Linux)', async () => {
     // Mock navigator.platform for Windows
     Object.defineProperty(window.navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    })

    render(<AIChatPage />)
    const input = screen.getByLabelText('Message input')

    // Check if placeholder contains the Ctrl symbol
    expect(input.getAttribute('placeholder')).toContain('Ctrl+K')
  })
})
