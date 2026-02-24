import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StoragePage from '@/app/dashboard/storage/page'

// Mock fetch
global.fetch = vi.fn()

describe('StoragePage UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    })
  })

  it('renders accessible provider filter buttons', async () => {
    render(<StoragePage />)

    // Check for group role
    // This will fail initially because the group role is missing
    const group = screen.getByRole('group', { name: /filter by provider/i })
    expect(group).toBeInTheDocument()

    const allButton = screen.getByRole('button', { name: /all files/i })
    const gdriveButton = screen.getByRole('button', { name: /google drive/i })

    // Check for aria-pressed
    // This will fail initially because aria-pressed is missing
    expect(allButton).toHaveAttribute('aria-pressed', 'true')
    expect(gdriveButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(gdriveButton)

    await waitFor(() => {
      expect(allButton).toHaveAttribute('aria-pressed', 'false')
      expect(gdriveButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('renders loading spinner instead of text when searching', async () => {
    // Mock a slow response
    ;(global.fetch as any).mockImplementation(() => new Promise(() => {}))

    render(<StoragePage />)

    // The initial load triggers a fetch, so it should be loading
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /searching/i })
      // Check if spinner is present
      // This will fail initially because there is no spinner
      // We expect an SVG with class 'animate-spin'
      const svg = button.querySelector('svg.animate-spin')
      expect(svg).toBeInTheDocument()
    })
  })

  it('renders empty state with icon', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    })

    render(<StoragePage />)

    await waitFor(() => {
        // Check for empty state message
        const emptyStateText = screen.getByText(/no files found/i)
        expect(emptyStateText).toBeInTheDocument()

        // Check for the icon
        // This will fail initially because the icon is missing
        // We look for the FolderOpen icon (or any SVG really in that container)
        // Since we don't have a reliable way to select the container yet without implementation details,
        // we can look for the SVG that is NOT inside the search button or header.
        // Or simply check if there's a large icon.

        // Let's assume the icon will be near the text.
        const container = emptyStateText.closest('div')
        const svg = container?.querySelector('svg')
        expect(svg).toBeInTheDocument()
        // We can check if it has a specific class or size to distinguish it
        expect(svg).toHaveClass('w-8 h-8')
    })
  })
})
