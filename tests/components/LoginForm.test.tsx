import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/app/components/LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks()
    
    // Mock fetch globally for each test
    global.fetch = vi.fn()
  })

  it('should render login form with email and password fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zaloguj/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    
    // Type something and then clear to trigger validation
    await user.type(emailInput, 'test')
    await user.clear(emailInput)
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/Email jest wymagany/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    
    // Blur to trigger onBlur validation
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowy format adresu email/i)).toBeInTheDocument()
    })
  })

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/hasło/i)
    const submitButton = screen.getByRole('button', { name: /zaloguj/i })

    await user.type(emailInput, 'test@firma.pl')
    await user.type(passwordInput, 'Test123!')

    expect(submitButton).not.toBeDisabled()
  })
})

