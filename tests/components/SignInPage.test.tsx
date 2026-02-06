import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SignInPage from '@/app/auth/signin/page'

describe('SignInPage', () => {
  it('renders sign in heading', () => {
    render(<SignInPage />)

    expect(screen.getByText('Sign In to Unified Console')).toBeInTheDocument()
  })

  it('has email input field', () => {
    render(<SignInPage />)

    const emailInput = screen.getByRole('textbox')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('has password input field', () => {
    render(<SignInPage />)

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    expect(passwordInputs.length).toBeGreaterThan(0)
    const passwordInput = passwordInputs[0]
    expect(passwordInput).toBeInTheDocument()
  })

  it('has submit button "Sign In"', () => {
    render(<SignInPage />)

    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('has Google sign in button', () => {
    render(<SignInPage />)

    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  it('form fields are required', () => {
    render(<SignInPage />)

    const emailInput = screen.getByRole('textbox')
    expect(emailInput).toBeRequired()

    const passwordInput = document.querySelector('input[type="password"]')
    expect(passwordInput).toHaveAttribute('required')
  })
})
