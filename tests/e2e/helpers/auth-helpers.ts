import { type Page, expect } from '@playwright/test'

/**
 * Test user credentials
 * Ensure these users exist in your test database
 */


export const TEST_USERS = {
  userWithPasswordReset: {
    email: 'newuser@tickflow.com',
    password: 'Agent123!@#',
    role: 'USER',
  },
  normalUser: {
    email: 'user@tickflow.com',
    password: 'User123!@#',
    role: 'USER',
  },
  agent: {
    email: 'agent@tickflow.com',
    password: 'Agent123!@#',
    role: 'AGENT',
  },
} as const

export type TestUser = keyof typeof TEST_USERS

/**
 * Login helper function
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 * @param expectRedirect - Expected redirect URL after login (default: '/')
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
  expectRedirect: string = '/'
) {
  await page.goto('/login')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // Fill credentials
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/hasło/i).fill(password)
  
  // Wait for network response
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/auth/login') && response.status() === 200
  )
  
  // Submit form
  await page.getByRole('button', { name: /zaloguj/i }).click()
  
  // Wait for API response
  await responsePromise
  
  // Verify cookie was set
  const cookies = await page.context().cookies()
  const authCookie = cookies.find(c => c.name === 'auth-token')
  
  if (!authCookie) {
    throw new Error('Auth cookie was not set after login')
  }
  
  // Wait for redirect with longer timeout
  await expect(page).toHaveURL(expectRedirect, { timeout: 15000 })
  
  // Verify we're actually authenticated
  await page.waitForLoadState('networkidle')
}

/**
 * Login with predefined test user
 * @param page - Playwright page object
 * @param userKey - Key from TEST_USERS object
 * @param expectRedirect - Expected redirect URL after login
 */
export async function loginAsUser(
  page: Page,
  userKey: TestUser,
  expectRedirect?: string
) {
  const user = TEST_USERS[userKey]
  await loginUser(page, user.email, user.password, expectRedirect)
}

/**
 * Logout helper function
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: /wyloguj/i })
  
  // Verify logout button exists
  await expect(logoutButton).toBeVisible({ timeout: 5000 })
  
  // Click logout
  await logoutButton.click()
  
  // Wait for redirect to login page
  await expect(page).toHaveURL('/login', { timeout: 10000 })
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 * @returns boolean indicating if user is logged in
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for logout button (indicator of authenticated state)
    const logoutButton = page.getByRole('button', { name: /wyloguj/i })
    return await logoutButton.isVisible({ timeout: 2000 })
  } catch {
    return false
  }
}

/**
 * Change password helper
 * @param page - Playwright page object
 * @param newPassword - New password to set
 * @param confirmPassword - Confirmation of new password
 */
export async function changePassword(
  page: Page,
  newPassword: string,
  confirmPassword: string = newPassword
) {
  // Should be on change-password page
  await expect(page).toHaveURL('/change-password')
  
  // Fill new password form
  await page.getByLabel(/nowe hasło/i).fill(newPassword)
  await page.getByLabel(/powtórz hasło|potwierdź hasło/i).fill(confirmPassword)
  
  // Submit
  await page.getByRole('button', { name: /zmień hasło/i }).click()
  
  // Wait for success or error
  await page.waitForTimeout(2000)
}

/**
 * Verify user has specific role
 * @param page - Playwright page object
 * @param role - Expected role (USER or AGENT)
 * @returns boolean indicating if user has the role
 */
export async function verifyUserRole(
  page: Page,
  role: 'USER' | 'AGENT'
): Promise<boolean> {
  if (role === 'AGENT') {
    // Agents see agent-specific UI elements
    const agentIndicator = page.locator('text=/dostępne zgłoszenia|przypisz|assign/i').first()
    return await agentIndicator.isVisible({ timeout: 5000 }).catch(() => false)
  } else {
    // Users see user-specific UI elements
    const userIndicator = page.getByRole('button', { name: /nowe zgłoszenie|create.*ticket/i })
    return await userIndicator.isVisible({ timeout: 5000 }).catch(() => false)
  }
}

/**
 * Clear browser storage (cookies, localStorage, sessionStorage)
 * Useful for ensuring clean test state
 * @param page - Playwright page object
 */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Setup authenticated session for tests
 * @param page - Playwright page object
 * @param userKey - User to login as
 */
export async function setupAuthenticatedSession(
  page: Page,
  userKey: TestUser = 'normalUser'
) {
  await clearAuthState(page)
  await loginAsUser(page, userKey)
  
  // Verify authentication succeeded
  const authenticated = await isAuthenticated(page)
  if (!authenticated) {
    throw new Error(`Failed to authenticate as ${userKey}`)
  }
}

/**
 * Wait for authentication redirect
 * Useful when testing protected routes
 * @param page - Playwright page object
 * @param expectedUrl - URL to expect after redirect
 */
export async function waitForAuthRedirect(
  page: Page,
  expectedUrl: string = '/login'
) {
  await page.waitForURL(expectedUrl, { timeout: 10000 })
}

/**
 * Navigate to protected route and handle auth redirect
 * @param page - Playwright page object
 * @param route - Route to navigate to
 * @param shouldRedirect - Whether redirect to login is expected
 */
export async function navigateToProtectedRoute(
  page: Page,
  route: string,
  shouldRedirect: boolean = true
) {
  await page.goto(route)
  
  if (shouldRedirect) {
    await waitForAuthRedirect(page, '/login')
  } else {
    await expect(page).toHaveURL(route)
  }
}

