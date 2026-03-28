import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import InboxPage from '@/app/dashboard/inbox/page'

describe('InboxPage UX Enhancements', () => {
  it('clears search and focuses input when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<InboxPage />)

    const searchInput = screen.getByRole('textbox', { name: /search emails/i })

    // Clear button shouldn't be visible initially
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()

    // Type something
    await user.type(searchInput, 'important')

    // Clear button should appear
    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()

    // Click clear button
    await user.click(clearButton)

    // Input should be cleared and focused
    expect(searchInput).toHaveValue('')
    expect(searchInput).toHaveFocus()

    // Clear button should disappear
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
  })

  it('focuses search input on shortcut key press', async () => {
    const user = userEvent.setup()
    render(<InboxPage />)

    const searchInput = screen.getByRole('textbox', { name: /search emails/i })
    expect(searchInput).not.toHaveFocus()

    // Simulate Cmd+K or Ctrl+K
    // Note: userEvent.keyboard might have issues with meta/ctrl combinations in jsdom
    // so we can directly dispatch the event
    await act(async () => {
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
      window.dispatchEvent(event)
    })

    expect(searchInput).toHaveFocus()
  })
})
