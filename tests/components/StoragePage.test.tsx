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

  it('renders file list with accessible open link', async () => {
    const mockFiles = [
      {
        id: '1',
        name: 'Report.pdf',
        provider: 'GDRIVE',
        size: '1048576',
        modifiedTime: '2023-01-01T12:00:00Z',
        webViewLink: 'https://example.com/report.pdf',
      },
    ]

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ files: mockFiles }),
    })

    render(<StoragePage />)

    // Wait for loading to finish and files to be displayed
    await waitFor(() => {
      expect(screen.getByText('Report.pdf')).toBeInTheDocument()
    })

    // Check for the "Open" link
    const openLink = screen.getByRole('link', { name: /Open Report.pdf in new tab/i })
    expect(openLink).toBeInTheDocument()
    expect(openLink).toHaveAttribute('href', 'https://example.com/report.pdf')
    expect(openLink).toHaveAttribute('target', '_blank')
    expect(openLink).toHaveAttribute('title', 'Open Report.pdf in new tab')

    // Check for "Back to Dashboard" link
    const backLink = screen.getByRole('link', { name: /Back to Dashboard/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/dashboard')
  })

  it('handles clear search functionality', async () => {
    render(<StoragePage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Search files')

    // Initial state: clear button should not be visible
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()

    // Type search query
    fireEvent.change(input, { target: { value: 'test' } })

    // Clear button should now be visible
    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeInTheDocument()

    // Click clear
    fireEvent.click(clearButton)

    // Input should be empty
    expect(input).toHaveValue('')

    // Should trigger fetch with empty string (loading state)
    expect(screen.getByText('Searching...')).toBeInTheDocument()
    // The last fetch call should be without search param
    expect(global.fetch).toHaveBeenLastCalledWith('/api/files/list')

    // Wait for reload
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument()
    })

    // Clear button should disappear
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
  })
})
