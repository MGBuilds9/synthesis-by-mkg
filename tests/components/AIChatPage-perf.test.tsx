import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AIChatPage from '@/app/dashboard/ai-assistant/page'

// We need to use vi.hoisted to declare the mock function outside vi.mock
const { mockedMessageList } = vi.hoisted(() => {
  const innerFn = vi.fn()
  return { mockedMessageList: innerFn }
})

vi.mock('@/app/dashboard/ai-assistant/components/MessageList', async () => {
  const React = await import('react')
  const MockMessageList = React.memo((props: { loading: boolean }) => {
    mockedMessageList(props)
    return <div data-testid="message-list">Message List</div>
  })
  MockMessageList.displayName = 'MockMessageList'
  return {
    default: MockMessageList
  }
})

// Mock fetch
global.fetch = vi.fn()

describe('AIChatPage Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'AI response', sources: [] }),
    })
  })

  it('does not re-render MessageList when typing in the input', () => {
    render(<AIChatPage />)

    // Initial render
    expect(mockedMessageList).toHaveBeenCalledTimes(1)

    const input = screen.getByLabelText('Message input')

    // Type into input
    fireEvent.change(input, { target: { value: 'H' } })
    fireEvent.change(input, { target: { value: 'He' } })
    fireEvent.change(input, { target: { value: 'Hel' } })
    fireEvent.change(input, { target: { value: 'Hell' } })
    fireEvent.change(input, { target: { value: 'Hello' } })

    // Check render count
    // Without optimization, this will be > 1 because sendMessage prop changes on every render
    // We expect this to fail initially (showing the problem), and pass after optimization
    expect(mockedMessageList).toHaveBeenCalledTimes(1)
  })
})
