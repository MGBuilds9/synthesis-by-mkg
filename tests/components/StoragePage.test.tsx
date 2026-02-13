import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StoragePage from '@/app/dashboard/storage/page'

// Mock fetch
global.fetch = vi.fn()

describe('StoragePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    })
  })

  it('renders search input and button', async () => {
    render(<StoragePage />)
    expect(screen.getByLabelText('Search files')).toBeInTheDocument()
    // Initially searching on load because of useEffect
    expect(screen.getByText('Searching...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })
  })

  it('shows loading state when searching', async () => {
    render(<StoragePage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Search files')
    const button = screen.getByText('Search')

    // Type search query
    fireEvent.change(input, { target: { value: 'report' } })

    // Click search
    fireEvent.click(button)

    // Should show loading state
    expect(screen.getByText('Searching...')).toBeInTheDocument()

    // Use getByRole to find the button, dealing with the fact that text content changes
    // "Searching..." is inside the button now
    const searchButton = screen.getByRole('button', { name: /searching/i })
    expect(searchButton).toBeDisabled()
    expect(searchButton).toHaveAttribute('aria-busy', 'true')

    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Search')).toBeInTheDocument()
    const searchButtonAfter = screen.getByRole('button', { name: 'Search' })
    expect(searchButtonAfter).not.toHaveAttribute('aria-busy', 'true')
    // Or aria-busy="false" depending on implementation, usually false if not present or explicitly false
    // React might render aria-busy="false" if passed false
  })
})
