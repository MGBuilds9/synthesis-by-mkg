import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SignInPage from '@/app/auth/signin/page'

describe('SignInPage', () => {
  it('renders sign in heading', () => {
    render(<SignInPage />)
    expect(screen.getByText('Sign In to Unified Console')).toBeInTheDocument()
  })

  it('has accessible email input field', () => {
    render(<SignInPage />)
    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toBeRequired()
  })

  it('has accessible password input field', () => {
    render(<SignInPage />)
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toBeRequired()
  })

  it('has submit button "Sign In"', () => {
    render(<SignInPage />)
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('shows loading state on submit', async () => {
    render(<SignInPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    // Fill in the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Submit
    fireEvent.click(submitButton)

    // Check for loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
  })
})
