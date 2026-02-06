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

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('Outlook')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<InboxPage />)

    const searchInput = screen.getByPlaceholderText('Search emails...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'text')
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

    const filterButton = screen.getByRole('button', { name: '' }).closest('button')
    if (filterButton) {
      await user.click(filterButton)
    }

    expect(screen.getByText('Email Account:')).toBeInTheDocument()
    expect(screen.getByText('Date Range:')).toBeInTheDocument()
  })
})
