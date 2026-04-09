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
})
