import { test, expect, type Page } from '@playwright/test'

/**
 * E2E Tests for Authentication Flow
 * 
 * Based on test-plan.md scenarios:
 * 1. Login → forced password change → dashboard
 * 2. Successful login with valid credentials
 * 3. Logout flow
 * 4. Error handling for invalid credentials
 * 5. Password change validation
 */

// Test users configuration (ensure these exist in your test database)
const TEST_USERS = {
  userWithPasswordReset: {
    email: 'newuser@tickflow.com',
    password: 'Agent123!@#',
  },
  normalUser: {
    email: 'user@tickflow.com',
    password: 'User123!@#',
  },
  agent: {
    email: 'agent@tickflow.com',
    password: 'Agent123!@#',
  },
}

/**
 * Helper function to login user
 */
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/hasło/i).fill(password)
  await page.getByRole('button', { name: /zaloguj/i }).click()
}

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
      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/hasło/i).fill('Test123!')
      await page.getByRole('button', { name: /zaloguj/i }).click()

      // Zod validator returns "Nieprawidłowy format adresu email"
      await expect(page.locator('text=/nieprawidłowy format adresu email/i').first()).toBeVisible({ timeout: 5000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.getByLabel(/email/i).fill('user@tickflow.com')
      await page.getByLabel(/hasło/i).fill('wrongpassword')
      await page.getByRole('button', { name: /zaloguj/i }).click()

      // Wait for error message - API returns "Nieprawidłowy email lub hasło" 
      // The error appears in the ErrorAlert component
      await expect(page.locator('text=/nieprawidłowy email lub hasło/i')).toBeVisible({
        timeout: 10000,
      })
    })

    test('should show error for non-existent user', async ({ page }) => {
      await page.getByLabel(/email/i).fill('nonexistent@tickflow.com')
      await page.getByLabel(/hasło/i).fill('Test123!')
      await page.getByRole('button', { name: /zaloguj/i }).click()

      // API returns same error for both invalid credentials and non-existent user for security
      await expect(page.locator('text=/nieprawidłowy email lub hasło/i')).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Password Reset Flow', () => {
    test('should redirect to password change on first login', async ({ page }) => {
      // Login with user that requires password reset
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_USERS.userWithPasswordReset.email)
      await page.getByLabel(/hasło/i).fill(TEST_USERS.userWithPasswordReset.password)
      await page.getByRole('button', { name: /zaloguj/i }).click()

      // Should redirect to change-password page
      await expect(page).toHaveURL('/change-password', { timeout: 10000 })
      // Check for the password change warning message - component shows "Wymagana zmiana hasła"
      await expect(page.locator('text=/wymagana zmiana hasła/i')).toBeVisible()
    })

    test('should complete password change flow successfully', async ({ page }) => {
      // Login with user that requires password reset
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_USERS.userWithPasswordReset.email)
      await page.getByLabel(/hasło/i).fill(TEST_USERS.userWithPasswordReset.password)
      await page.getByRole('button', { name: /zaloguj/i }).click()
      
      await expect(page).toHaveURL('/change-password', { timeout: 10000 })

      // Fill new password form - use current password in currentPassword field
      const newPassword = 'NewSecure123!@#'
      await page.getByLabel(/aktualne hasło/i).fill(TEST_USERS.userWithPasswordReset.password)
      await page.getByLabel(/nowe hasło/i).first().fill(newPassword)
      await page.getByLabel(/potwierdź nowe hasło/i).fill(newPassword)
      await page.getByRole('button', { name: /zmień hasło/i }).click()

      // Wait for success message - component shows "Sukces!" and "Hasło zostało pomyślnie zmienione"
      await expect(page.locator('text=/sukces/i')).toBeVisible({ timeout: 10000 })
    })

    test('should show validation error for mismatched passwords', async ({ page }) => {
      // Login first to access change-password page
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_USERS.normalUser.email)
      await page.getByLabel(/hasło/i).fill(TEST_USERS.normalUser.password)
      await page.getByRole('button', { name: /zaloguj/i }).click()
      
      await expect(page).toHaveURL('/', { timeout: 10000 })
      
      // Navigate to change-password page
      await page.goto('/change-password')
      await expect(page).toHaveURL('/change-password')

      await page.getByLabel(/aktualne hasło/i).fill(TEST_USERS.normalUser.password)
      await page.getByLabel(/nowe hasło/i).first().fill('NewSecure123!@#')
      await page.getByLabel(/potwierdź nowe hasło/i).fill('DifferentPassword123!@#')
      await page.getByRole('button', { name: /zmień hasło/i }).click()

      // Zod schema returns "Hasła muszą być identyczne"
      await expect(page.locator('text=/hasła muszą być identyczne/i')).toBeVisible({ timeout: 5000 })
    })

    test('should show validation error for weak password', async ({ page }) => {
      // Login first to access change-password page
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_USERS.normalUser.email)
      await page.getByLabel(/hasło/i).fill(TEST_USERS.normalUser.password)
      await page.getByRole('button', { name: /zaloguj/i }).click()
      
      await expect(page).toHaveURL('/', { timeout: 10000 })
      
      // Navigate to change-password page
      await page.goto('/change-password')
      await expect(page).toHaveURL('/change-password')

      const weakPassword = '123'
      await page.getByLabel(/aktualne hasło/i).fill(TEST_USERS.normalUser.password)
      await page.getByLabel(/nowe hasło/i).first().fill(weakPassword)
      await page.getByLabel(/potwierdź nowe hasło/i).fill(weakPassword)
      await page.getByRole('button', { name: /zmień hasło/i }).click()

      // Zod schema returns "Hasło musi mieć minimum 8 znaków"
      await expect(page.locator('text=/hasło musi mieć minimum 8 znaków/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Successful Login', () => {
    test('should successfully login and redirect to dashboard', async ({ page }) => {
      await loginUser(page, TEST_USERS.normalUser.email, TEST_USERS.normalUser.password)

      // Should redirect to root page (dashboard)
      await expect(page).toHaveURL('/', { timeout: 10000 })
      
      // Verify user is logged in by checking for logout button
      await expect(page.getByRole('button', { name: /wyloguj/i })).toBeVisible()
    })

    test('should successfully login as agent', async ({ page }) => {
      await loginUser(page, TEST_USERS.agent.email, TEST_USERS.agent.password)

      await expect(page).toHaveURL('/', { timeout: 10000 })
      
      // Agent should see dashboard content
      await expect(page.getByRole('button', { name: /wyloguj/i })).toBeVisible()
    })

    test('should persist session after page reload', async ({ page }) => {
      await loginUser(page, TEST_USERS.normalUser.email, TEST_USERS.normalUser.password)
      await expect(page).toHaveURL('/')

      // Reload page
      await page.reload()

      // Should still be logged in
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('button', { name: /wyloguj/i })).toBeVisible()
    })

    test('should redirect to root when accessing login while authenticated', async ({ page }) => {
      await loginUser(page, TEST_USERS.normalUser.email, TEST_USERS.normalUser.password)
      await expect(page).toHaveURL('/')

      // Try to access login page
      await page.goto('/login')

      // Should redirect back to root page
      await expect(page).toHaveURL('/', { timeout: 5000 })
    })
  })

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await loginUser(page, TEST_USERS.normalUser.email, TEST_USERS.normalUser.password)
      await expect(page).toHaveURL('/')

      // Logout
      await page.getByRole('button', { name: /wyloguj/i }).click()

      // Should redirect to login page
      await expect(page).toHaveURL('/login', { timeout: 10000 })
      
      // Should not be able to access protected routes
      await page.goto('/tickets')
      await expect(page).toHaveURL('/login')
    })

    test('should clear session after logout', async ({ page }) => {
      await loginUser(page, TEST_USERS.normalUser.email, TEST_USERS.normalUser.password)
      await expect(page).toHaveURL('/')

      // Logout
      await page.getByRole('button', { name: /wyloguj/i }).click()
      await expect(page).toHaveURL('/login')

      // Try to go back
      await page.goBack()

      // Should redirect to login
      await expect(page).toHaveURL('/login')
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

