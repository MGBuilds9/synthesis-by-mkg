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

  it('clears search input when clear button is clicked', async () => {
    render(<StoragePage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Search files')

    // Type search query
    fireEvent.change(input, { target: { value: 'report' } })

    // Verify clear button appears
    const clearButton = screen.getByRole('button', { name: 'Clear search' })
    expect(clearButton).toBeInTheDocument()

    // Click clear button
    fireEvent.click(clearButton)

    // Verify input is empty
    expect(input).toHaveValue('')

    // Verify clear button is gone
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    // Verify fetch was called with empty search (or initial fetch)
    // fetchFiles('') -> /api/files/list
    expect(global.fetch).toHaveBeenCalledWith('/api/files/list', expect.anything())

    // Wait for any state updates to complete to avoid "act" warnings
    await waitFor(() => {
      // We can wait for the loading state to be settled (even if it was already false, the async function touches it)
      // Or just wait for the loop to clear
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    })
  })

  it('fetches files with provider filter when provider is selected', async () => {
    render(<StoragePage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    // Click Google Drive filter
    const gdriveButton = screen.getByRole('button', { name: 'Google Drive' })
    fireEvent.click(gdriveButton)

    // Verify fetch was called with provider=GDRIVE
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/files/list?provider=GDRIVE', expect.anything())
    })

    // Click All filter
    const allButton = screen.getByRole('button', { name: 'All Files' })
    fireEvent.click(allButton)

    // Verify fetch was called with no provider (or provider=ALL logic, which is just base URL)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/files/list', expect.anything())
    })
  })
})
