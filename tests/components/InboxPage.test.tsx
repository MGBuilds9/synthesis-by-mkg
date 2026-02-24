import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import InboxPage from '@/app/dashboard/inbox/page'

describe('InboxPage', () => {
  it('renders "Inbox" heading', () => {
    render(<InboxPage />)

    expect(screen.getByText('Inbox')).toBeInTheDocument()
  })

  it('renders provider filter buttons (All, Gmail, Outlook)', () => {
    render(<InboxPage />)

    const group = screen.getByRole('group', { name: /filter by provider/i })
    expect(group).toBeInTheDocument()

    const allButton = screen.getByRole('button', { name: /all/i })
    expect(allButton).toBeInTheDocument()
    expect(allButton).toHaveAttribute('aria-pressed', 'true')

    const gmailButton = screen.getByRole('button', { name: /gmail/i })
    expect(gmailButton).toBeInTheDocument()
    expect(gmailButton).toHaveAttribute('aria-pressed', 'false')

    expect(screen.getByRole('button', { name: /outlook/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<InboxPage />)

    const searchInput = screen.getByRole('textbox', { name: /search emails/i })
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search emails...'))
  })

  it('shows empty state with "No emails yet"', () => {
    render(<InboxPage />)

    expect(screen.getByText('No emails yet')).toBeInTheDocument()
    expect(
      screen.getByText('Connect your Gmail or Outlook account to get started')
    ).toBeInTheDocument()
  })

  it('has Compose button', () => {
    render(<InboxPage />)

    expect(screen.getByText('Compose')).toBeInTheDocument()
  })

  it('filter panel toggles on button click', async () => {
    const user = userEvent.setup()
    render(<InboxPage />)

    expect(screen.queryByText('Email Account:')).not.toBeInTheDocument()

    const filterButton = screen.getByRole('button', { name: /toggle filters/i })
    expect(filterButton).toBeInTheDocument()
    expect(filterButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(filterButton)

    expect(filterButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Email Account:')).toBeInTheDocument()
    expect(screen.getByText('Date Range:')).toBeInTheDocument()
  })

  it('focuses search input on shortcut key', async () => {
    const user = userEvent.setup()
    render(<InboxPage />)

    const searchInput = screen.getByRole('textbox', { name: /search emails/i })
    expect(searchInput).not.toHaveFocus()

    // Test both Ctrl+K and Meta+K since platform detection might vary
    await user.keyboard('{Control>}k{/Control}')
    // Depending on the mock environment, one of these should work if the component logic is correct
    // But since we can't easily mock navigator.platform in JSDOM reliably without setup,
    // we'll try to trigger the event that the component listens to.
    // The component listens to both metaKey and ctrlKey.

    expect(searchInput).toHaveFocus()
  })

  it('shows clear button when search has text', async () => {
    const user = userEvent.setup()
    render(<InboxPage />)

    const searchInput = screen.getByRole('textbox', { name: /search emails/i })

    // Type something
    await user.type(searchInput, 'hello')

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()

    // Click clear
    await user.click(clearButton)

    expect(searchInput).toHaveValue('')
    expect(searchInput).toHaveFocus()
    expect(clearButton).not.toBeInTheDocument()
  })
})
