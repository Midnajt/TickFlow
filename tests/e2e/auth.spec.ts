import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Authentication Flow
 * 
 * Covered scenarios:
 * 1. Login form elements display
 * 2. Form validation (empty fields, invalid email)
 * 3. Protected routes authorization
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login')
  })

  test.describe('Login Page', () => {
    test('should display all login form elements', async ({ page }) => {
      // Verify form structure
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/hasło/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /zaloguj/i })).toBeVisible()

      // Verify inputs are empty by default
      await expect(page.getByLabel(/email/i)).toHaveValue('')
      await expect(page.getByLabel(/hasło/i)).toHaveValue('')
    })

    test('should show validation error for empty form submission', async ({ page }) => {
      await page.getByRole('button', { name: /zaloguj/i }).click()

      // Wait for validation errors - looking for actual Zod error messages
      await expect(page.locator('text=/email jest wymagany/i').first()).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=/hasło jest wymagane|hasło nie może być puste/i').first()).toBeVisible()
    })

    test('should show validation error for invalid email format', async ({ page }) => {
      // Fill the form with invalid email
      const emailInput = page.getByLabel(/email/i)
      await emailInput.fill('invalid-email')
      await page.getByLabel(/hasło/i).fill('Test123!')
      
      // Trigger form submission programmatically to bypass HTML5 validation
      // This allows us to test the Zod validation layer
      await emailInput.evaluate((el: HTMLInputElement) => {
        el.type = 'text' // Temporarily change type to bypass HTML5 validation
      })
      
      await page.getByRole('button', { name: /zaloguj/i }).click()

      // Zod validator returns "Nieprawidłowy format adresu email"
      // The error is displayed in the #email-error element (role="alert") below the email input
      await expect(page.locator('#email-error')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('#email-error')).toHaveText(/nieprawidłowy format adresu email/i)
    })
  })

  test.describe('Authorization', () => {
    test('should protect tickets page from unauthenticated access', async ({ page }) => {
      await page.goto('/tickets')
      
      // Should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })

    test('should protect change-password page from unauthenticated access', async ({ page }) => {
      await page.goto('/change-password')
      
      // Should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 5000 })
    })
  })
})

