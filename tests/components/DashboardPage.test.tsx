import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardPage from '@/app/dashboard/page'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}))

describe('DashboardPage', () => {
  it('renders "Command Center" heading', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Command Center')).toBeInTheDocument()
  })

  it('renders Today stats section', async () => {
    render(<DashboardPage />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('New Emails')).toBeInTheDocument()
    expect(screen.getByText('New Chat Messages')).toBeInTheDocument()
    expect(screen.getByText('Recent Files')).toBeInTheDocument()
    expect(screen.getByText('Recent Notion Pages')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('renders Quick Navigation with 5 nav items', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Quick Navigation')).toBeInTheDocument()

    const quickNavItems = screen.getAllByText('Inbox')
    expect(quickNavItems.length).toBeGreaterThanOrEqual(1)

    expect(screen.getAllByText('Chats').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Storage').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Notion').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
  })

  it('renders Connected Accounts section with 7 providers', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Connected Accounts')).toBeInTheDocument()

    expect(screen.getByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
    expect(screen.getByText('Google Drive')).toBeInTheDocument()
    expect(screen.getAllByText('Notion')[0]).toBeInTheDocument()
    expect(screen.getByText('Outlook')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
  })

  it('shows status icons for connected/needs_attention/not_connected', () => {
    const { container } = render(<DashboardPage />)

    const checkCircleIcons = container.querySelectorAll('svg[class*="text-green-500"]')
    expect(checkCircleIcons.length).toBeGreaterThan(0)

    const alertCircleIcons = container.querySelectorAll('svg[class*="text-yellow-500"]')
    expect(alertCircleIcons.length).toBeGreaterThan(0)

    const plusCircleIcons = container.querySelectorAll('svg[class*="text-gray-400"]')
    expect(plusCircleIcons.length).toBeGreaterThan(0)
  })
})
