import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import MessageList, { Message } from '@/app/dashboard/ai-assistant/components/MessageList'

// Mock scrollIntoView
const scrollIntoViewMock = vi.fn()
window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

describe('MessageList UX', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders accessible loading text for screen readers', () => {
    render(<MessageList messages={[]} loading={true} />)

    // Check for visually hidden text "AI is thinking..."
    // We look for text that might be hidden but accessible
    const loadingText = screen.getByText(/AI is thinking/i)
    expect(loadingText).toBeInTheDocument()
    expect(loadingText).toHaveClass('sr-only')

    // Check for role="status" on the container
    // We expect the loading indicator container to have role="status"
    // Since the text is inside it, we can find the closest role="status"
    const statusRegion = screen.getByRole('status')
    expect(statusRegion).toBeInTheDocument()
    expect(statusRegion).toContainElement(loadingText)
  })

  it('auto-scrolls to bottom when new messages arrive', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' }
    ]

    const { rerender } = render(<MessageList messages={messages} loading={false} />)

    // Initial render should trigger scroll
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })

    // Add a new message
    const newMessages: Message[] = [
      ...messages,
      { role: 'assistant', content: 'Hi there' }
    ]

    rerender(<MessageList messages={newMessages} loading={false} />)

    // Should trigger scroll again
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2)
  })

  it('auto-scrolls to bottom when loading state changes', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' }
    ]

    const { rerender } = render(<MessageList messages={messages} loading={false} />)
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1)

    // Set loading to true
    rerender(<MessageList messages={messages} loading={true} />)
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2)
  })
})
