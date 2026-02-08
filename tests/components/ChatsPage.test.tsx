import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ChatsPage from '@/app/dashboard/chats/page'

describe('ChatsPage', () => {
  it('renders "Chats" heading', () => {
    render(<ChatsPage />)

    expect(screen.getByText('Chats')).toBeInTheDocument()
  })

  it('renders all platform filter buttons', () => {
    render(<ChatsPage />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Telegram')).toBeInTheDocument()
  })

  it('has accessible platform filter buttons', () => {
    render(<ChatsPage />)

    expect(screen.getByLabelText('Show all chats')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by Discord')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by WhatsApp')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by Slack')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by Teams')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by Telegram')).toBeInTheDocument()
  })

  it('shows empty state with "No chats yet" and connect link', () => {
    render(<ChatsPage />)

    expect(screen.getByText('No chats yet')).toBeInTheDocument()
    expect(
      screen.getByText('Connect your Discord, WhatsApp, Slack, Teams, or Telegram to get started')
    ).toBeInTheDocument()

    const connectLink = screen.getByRole('link', { name: /Connect Account/i })
    expect(connectLink).toBeInTheDocument()
    expect(connectLink).toHaveAttribute('href', '/dashboard/settings')
  })

  it('renders search input with accessibility label', () => {
    render(<ChatsPage />)

    const searchInput = screen.getByPlaceholderText('Search chats...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'text')
    expect(searchInput).toHaveAttribute('aria-label', 'Search chats')
  })

  it('renders filter button with accessibility label', () => {
    render(<ChatsPage />)
    expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument()
  })
})
