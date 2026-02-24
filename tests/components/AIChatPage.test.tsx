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

describe('AIChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'AI response', sources: [] }),
    })
  })

  it('renders with accessible labels', () => {
    render(<AIChatPage />)

    expect(screen.getByLabelText('Message input')).toBeInTheDocument()
    expect(screen.getByLabelText('Select AI Model')).toBeInTheDocument()
    expect(screen.getByLabelText('Context settings')).toBeInTheDocument()
  })

  it('toggles context settings panel accessibility attributes', () => {
    render(<AIChatPage />)

    const settingsButton = screen.getByLabelText('Context settings')
    expect(settingsButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(settingsButton)
    expect(settingsButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Ask before searching context')).toBeInTheDocument()
  })

  it('shows loading state on send button when submitting', async () => {
    render(<AIChatPage />)

    const input = screen.getByLabelText('Message input')
    const button = screen.getByRole('button', { name: 'Send message' })

    // Button disabled initially (empty input)
    expect(button).toBeDisabled()

    // Type message
    fireEvent.change(input, { target: { value: 'Hello AI' } })
    expect(button).toBeEnabled()

    // Click send
    fireEvent.click(button)

    // Button should show sending state and be disabled
    expect(screen.getByText('Sending...')).toBeInTheDocument()
    const sendButton = screen.getByRole('button', { name: /sending/i })
    expect(sendButton).toBeDisabled()

    // Wait for fetch to complete and state to revert
    await waitFor(() => {
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument()
    })

    // Button should be back to "Send"
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('sends message on Enter key press', async () => {
    render(<AIChatPage />)

    const input = screen.getByLabelText('Message input')

    // Type message
    fireEvent.change(input, { target: { value: 'Hello AI' } })

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    // Should show sending state
    expect(screen.getByText('Sending...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument()
    })
  })

  it('does not send message on Shift+Enter', async () => {
    render(<AIChatPage />)

    const input = screen.getByLabelText('Message input')

    // Type message
    fireEvent.change(input, { target: { value: 'Hello AI' } })

    // Press Shift+Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true })

    // Should NOT show sending state (button still says "Send")
    expect(screen.queryByText('Sending...')).not.toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('focuses input on Ctrl+K/Cmd+K', () => {
    render(<AIChatPage />)
    const input = screen.getByLabelText('Message input')

    // Initial check: not focused
    expect(input).not.toHaveFocus()

    // Press Ctrl+K
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(input).toHaveFocus()

    // Blur
    input.blur()
    expect(input).not.toHaveFocus()

    // Press Cmd+K (Meta+K)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(input).toHaveFocus()
  })
})
