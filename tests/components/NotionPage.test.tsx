import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import NotionPage from '@/app/dashboard/notion/page'

describe('NotionPage', () => {
  it('renders "Notion" heading', () => {
    render(<NotionPage />)
    expect(screen.getByRole('heading', { name: /notion/i })).toBeInTheDocument()
  })

  it('renders search input with accessibility attributes', () => {
    render(<NotionPage />)
    const searchInput = screen.getByRole('textbox', { name: /search notion pages/i })
    expect(searchInput).toBeInTheDocument()
    expect(searchInput.getAttribute('placeholder')).toEqual(expect.stringContaining('Search Notion pages...'))
  })

  it('shows empty state with "No Notion pages synced yet"', () => {
    render(<NotionPage />)
    expect(screen.getByText('No Notion pages synced yet')).toBeInTheDocument()
    expect(screen.getByText('Connect your Notion workspace to get started')).toBeInTheDocument()
  })

  it('clears search and focuses input when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<NotionPage />)

    const searchInput = screen.getByRole('textbox', { name: /search notion pages/i })
    await user.type(searchInput, 'test query')
    expect(searchInput).toHaveValue('test query')

    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    expect(clearBtn).toBeInTheDocument()

    await user.click(clearBtn)
    expect(searchInput).toHaveValue('')
    expect(searchInput).toHaveFocus()
  })
})
