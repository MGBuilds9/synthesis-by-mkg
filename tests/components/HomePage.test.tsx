import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '@/app/page'

describe('HomePage', () => {
  it('renders heading "Unified Console"', () => {
    render(<Home />)

    const heading = screen.getByText('Unified Console')
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H1')
  })

  it('renders description text', () => {
    render(<Home />)

    expect(screen.getByText('Your personal hub for messages, files, and AI')).toBeInTheDocument()
  })

  it('has Sign In link pointing to /auth/signin', () => {
    render(<Home />)

    const signInLink = screen.getByText('Sign In')
    expect(signInLink).toBeInTheDocument()
    expect(signInLink.tagName).toBe('A')
    expect(signInLink).toHaveAttribute('href', '/auth/signin')
  })

  it('has Dashboard link pointing to /dashboard', () => {
    render(<Home />)

    const dashboardLink = screen.getByText('Dashboard')
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink.tagName).toBe('A')
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })
})
