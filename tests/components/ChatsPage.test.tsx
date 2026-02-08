import { render, screen, fireEvent } from '@testing-library/react'
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

  it('shows empty state with "No chats yet"', () => {
    render(<ChatsPage />)

    expect(screen.getByText('No chats yet')).toBeInTheDocument()
    expect(
      screen.getByText('Connect your Discord, WhatsApp, Slack, Teams, or Telegram to get started')
    ).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<ChatsPage />)

    const searchInput = screen.getByPlaceholderText('Search chats...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'text')
  })

  it('has accessible search input', () => {
    render(<ChatsPage />)
    expect(screen.getByLabelText('Search chats')).toBeInTheDocument()
  })

  it('handles filter button interactions', () => {
    render(<ChatsPage />)

    // Initially disabled (All selected)
    const filterButton = screen.getByLabelText('Toggle filters')
    expect(filterButton).toBeDisabled()
    expect(filterButton).toHaveAttribute('aria-expanded', 'false')
    expect(filterButton).toHaveAttribute('aria-controls', 'chat-filters')

    // Select Discord (filters available)
    fireEvent.click(screen.getByText('Discord'))
    expect(filterButton).not.toBeDisabled()

    // Toggle filters
    fireEvent.click(filterButton)
    expect(filterButton).toHaveAttribute('aria-expanded', 'true')

    // Filter region should appear with correct role/label
    const region = screen.getByRole('region', { name: 'Filter options' })
    expect(region).toBeInTheDocument()
    expect(region).toHaveAttribute('id', 'chat-filters')
  })
})
