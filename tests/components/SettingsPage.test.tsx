import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SettingsPage from '@/app/dashboard/settings/page'

describe('SettingsPage', () => {
  it('renders "Settings" heading', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows "Connected Accounts" section', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Connected Accounts')).toBeInTheDocument()
  })

  it('shows provider connection buttons', () => {
    render(<SettingsPage />)

    expect(screen.getByText('+ Gmail')).toBeInTheDocument()
    expect(screen.getByText('+ Outlook')).toBeInTheDocument()
    expect(screen.getByText('+ Google Drive')).toBeInTheDocument()
    expect(screen.getByText('+ OneDrive')).toBeInTheDocument()
    expect(screen.getByText('+ Discord')).toBeInTheDocument()
    expect(screen.getByText('+ Notion')).toBeInTheDocument()

    expect(screen.getAllByText('Connect email', { selector: 'div' }).length).toBe(2)
    expect(screen.getAllByText('Connect storage', { selector: 'div' }).length).toBe(2)
    expect(screen.getByText('Connect bot', { selector: 'div' })).toBeInTheDocument()
    expect(screen.getByText('Connect workspace', { selector: 'div' })).toBeInTheDocument()
  })

  it('shows "AI Preferences" section with provider dropdown', () => {
    render(<SettingsPage />)

    expect(screen.getByText('AI Preferences')).toBeInTheDocument()
    expect(screen.getByText('Default AI Provider')).toBeInTheDocument()

    const providerSelect = screen.getByDisplayValue('OpenAI')
    expect(providerSelect).toBeInTheDocument()
    expect(providerSelect.tagName).toBe('SELECT')

    const options = screen.getAllByRole('option')
    const optionTexts = options.map((opt) => opt.textContent)
    expect(optionTexts).toContain('OpenAI')
    expect(optionTexts).toContain('Google Gemini')
    expect(optionTexts).toContain('Anthropic Claude')
  })

  it('shows "Provider Health" section', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Provider Health')).toBeInTheDocument()
    expect(
      screen.getByText('Monitor the health and sync status of your connected providers.')
    ).toBeInTheDocument()
    expect(screen.getByText('All Systems')).toBeInTheDocument()
    expect(screen.getByText('● Operational')).toBeInTheDocument()
  })
})
