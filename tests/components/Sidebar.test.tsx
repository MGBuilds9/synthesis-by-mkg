import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Sidebar from '@/app/components/Sidebar'

const mockUsePathname = vi.fn()

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
  })

  it('renders all navigation items', () => {
    render(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Inbox')).toBeInTheDocument()
    expect(screen.getByText('Chats')).toBeInTheDocument()
    expect(screen.getByText('Storage')).toBeInTheDocument()
    expect(screen.getByText('Notion')).toBeInTheDocument()
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('each nav item is a link with correct href', () => {
    render(<Sidebar />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')

    const inboxLink = screen.getByText('Inbox').closest('a')
    expect(inboxLink).toHaveAttribute('href', '/dashboard/inbox')

    const chatsLink = screen.getByText('Chats').closest('a')
    expect(chatsLink).toHaveAttribute('href', '/dashboard/chats')

    const storageLink = screen.getByText('Storage').closest('a')
    expect(storageLink).toHaveAttribute('href', '/dashboard/storage')

    const notionLink = screen.getByText('Notion').closest('a')
    expect(notionLink).toHaveAttribute('href', '/dashboard/notion')

    const aiLink = screen.getByText('AI Assistant').closest('a')
    expect(aiLink).toHaveAttribute('href', '/dashboard/ai-assistant')

    const settingsLink = screen.getByText('Settings').closest('a')
    expect(settingsLink).toHaveAttribute('href', '/dashboard/settings')
  })

  it('active item has indigo styling and aria-current attribute', () => {
    mockUsePathname.mockReturnValue('/dashboard/inbox')

    render(<Sidebar />)

    const inboxLink = screen.getByText('Inbox').closest('a')
    expect(inboxLink).toHaveClass('bg-indigo-50', 'text-indigo-600')
    expect(inboxLink).toHaveAttribute('aria-current', 'page')

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).not.toHaveClass('bg-indigo-50')
    expect(dashboardLink).toHaveClass('text-gray-600')
    expect(dashboardLink).not.toHaveAttribute('aria-current')
  })

  it('links have focus-visible styles for accessibility', () => {
    render(<Sidebar />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-indigo-500')
  })

  it('icons are hidden from screen readers', () => {
    const { container } = render(<Sidebar />)

    // Lucide icons render as svgs. We check if all svgs in the navigation have aria-hidden="true"
    const icons = container.querySelectorAll('nav svg')
    expect(icons.length).toBeGreaterThan(0)
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('renders brand name "Unified Console"', () => {
    render(<Sidebar />)

    const brandName = screen.getByText('Unified Console')
    expect(brandName).toBeInTheDocument()
    expect(brandName).toHaveClass('text-xl', 'font-bold', 'text-indigo-600')
  })
})
