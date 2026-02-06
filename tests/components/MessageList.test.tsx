import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MessageList, { Message } from '@/app/dashboard/ai-assistant/components/MessageList'
import { memo } from 'react'

describe('MessageList', () => {
  it('shows empty state when no messages', () => {
    render(<MessageList messages={[]} loading={false} />)

    expect(screen.getByText('Start a conversation with AI')).toBeInTheDocument()
    expect(
      screen.getByText('Ask questions about your emails, chats, files, and Notion pages')
    ).toBeInTheDocument()
  })

  it('renders user messages with correct styling', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello AI' },
    ]

    render(<MessageList messages={messages} loading={false} />)

    const userMessage = screen.getByText('Hello AI')
    expect(userMessage).toBeInTheDocument()

    const messageDiv = userMessage.closest('div')
    expect(messageDiv).toHaveClass('bg-indigo-600', 'text-white')
  })

  it('renders assistant messages with correct styling', () => {
    const messages: Message[] = [
      { role: 'assistant', content: 'Hello human' },
    ]

    render(<MessageList messages={messages} loading={false} />)

    const assistantMessage = screen.getByText('Hello human')
    expect(assistantMessage).toBeInTheDocument()

    const messageDiv = assistantMessage.closest('div')
    expect(messageDiv).toHaveClass('bg-white', 'text-gray-900', 'shadow')
  })

  it('shows loading indicator when loading=true', () => {
    render(<MessageList messages={[]} loading={true} />)

    const loadingDots = document.querySelectorAll('.animate-bounce')
    expect(loadingDots).toHaveLength(3)
  })

  it('hides loading indicator when loading=false', () => {
    render(<MessageList messages={[]} loading={false} />)

    const loadingDots = document.querySelectorAll('.animate-bounce')
    expect(loadingDots).toHaveLength(0)
  })

  it('renders sources when present on assistant messages', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: 'Here is the information',
        sources: [
          { title: 'Email from John', excerpt: 'Meeting at 3pm' },
          { title: 'Notion Page', excerpt: 'Project details' },
        ],
      },
    ]

    render(<MessageList messages={messages} loading={false} />)

    expect(screen.getByText('Sources Used:')).toBeInTheDocument()
    expect(screen.getByText('Email from John')).toBeInTheDocument()
    expect(screen.getByText('Meeting at 3pm')).toBeInTheDocument()
    expect(screen.getByText('Notion Page')).toBeInTheDocument()
    expect(screen.getByText('Project details')).toBeInTheDocument()
  })

  it('is memoized', () => {
    expect(MessageList.$$typeof.toString()).toBe('Symbol(react.memo)')
  })
})
