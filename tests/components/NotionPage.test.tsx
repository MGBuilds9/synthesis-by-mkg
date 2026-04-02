import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import NotionPage from '@/app/dashboard/notion/page'

describe('NotionPage', () => {
  it('renders heading', () => {
    render(<NotionPage />)
    expect(screen.getByText('Notion')).toBeInTheDocument()
  })

  it('renders search input and clear button', async () => {
    const user = userEvent.setup()
    render(<NotionPage />)

    const searchInput = screen.getByRole('textbox', { name: /search notion pages/i })
    expect(searchInput).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()

    await user.type(searchInput, 'test query')

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()

    await user.click(clearButton)

    expect(searchInput).toHaveValue('')
    expect(searchInput).toHaveFocus()
  })
})
