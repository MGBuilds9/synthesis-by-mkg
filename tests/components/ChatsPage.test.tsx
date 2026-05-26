import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChatsPage from '@/app/dashboard/chats/page'

// Mock next/link to avoid rendering issues in tests
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

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
    // Text is split between a link and a text node
    expect(screen.getByText('Connect your accounts')).toBeInTheDocument()
    expect(screen.getByText('to get started')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<ChatsPage />)

    const searchInput = screen.getByPlaceholderText(/Search chats.../)
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'text')
  })

  describe('Accessibility', () => {
    it('search input has accessible label', () => {
      render(<ChatsPage />)
      const searchInput = screen.getByPlaceholderText(/Search chats.../)
      expect(searchInput).toHaveAttribute('aria-label', 'Search chats')
    })

    it('filter button has accessible label and expanded state', () => {
      render(<ChatsPage />)
      const filterButton = screen.getByLabelText('Toggle filters')
      expect(filterButton).toBeInTheDocument()
      expect(filterButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('filter button aria-controls points to filter panel when expanded', () => {
      render(<ChatsPage />)
      const filterButton = screen.getByLabelText('Toggle filters')

      // Select discord platform so the filter panel actually renders when opened
      const discordButton = screen.getByRole('button', { name: /discord/i })
      fireEvent.click(discordButton)

      // Initially no panel, so no aria-controls
      expect(filterButton).not.toHaveAttribute('aria-controls')

      // Expand filters
      fireEvent.click(filterButton)

      // Now aria-controls should point to the panel
      expect(filterButton).toHaveAttribute('aria-controls', 'chats-filter-panel')
    })

    it('platform filter buttons use aria-pressed for selection state', () => {
      render(<ChatsPage />)

      const allButton = screen.getByRole('button', { name: /all/i })
      expect(allButton).toHaveAttribute('aria-pressed', 'true')

      const discordButton = screen.getByRole('button', { name: /discord/i })
      expect(discordButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('empty state contains a link to settings', () => {
      render(<ChatsPage />)

      const settingsLink = screen.getByRole('link', { name: /connect your accounts/i })
      expect(settingsLink).toBeInTheDocument()
      expect(settingsLink).toHaveAttribute('href', '/dashboard/settings')
    })
  })
})
