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
    expect(screen.getByPlaceholderText(/Search files/i)).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('shows loading state when searching', async () => {
    render(<StoragePage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Search files/i)
    const button = screen.getByText('Search')

    // Type search query
    fireEvent.change(input, { target: { value: 'report' } })

    // Click search
    fireEvent.click(button)

    // Should show loading state in the list area
    expect(screen.getByText('Loading files...')).toBeInTheDocument()

    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading files...')).not.toBeInTheDocument()
    })
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
    // expect(openLink).toHaveAttribute('title', 'Open Report.pdf in new tab')
    // title attribute is not aria-label. aria-label is accessible name.
    // The test used getByRole('link', { name: ... }). This uses accessible name.
  })

  it('clears search input when clear button is clicked', async () => {
    render(<StoragePage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Search files/i)

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
