import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/hasło/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /zaloguj/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@firma.pl')
    await page.getByLabel(/hasło/i).fill('wrongpassword')
    await page.getByRole('button', { name: /zaloguj/i }).click()

    await expect(page.getByText(/nieprawidłowe dane logowania/i)).toBeVisible()
  })

  test('should redirect to password change on first login', async ({ page }) => {
    // This test assumes you have a test user with passwordResetRequired = true
    await page.getByLabel(/email/i).fill('user@firma.pl')
    await page.getByLabel(/hasło/i).fill('Start!125')
    await page.getByRole('button', { name: /zaloguj/i }).click()

    await expect(page).toHaveURL('/change-password')
    await expect(page.getByText(/musisz zmienić hasło/i)).toBeVisible()
  })

  test('should successfully login and redirect to dashboard', async ({ page }) => {
    // This test assumes you have a test user with passwordResetRequired = false
    await page.getByLabel(/email/i).fill('test@firma.pl')
    await page.getByLabel(/hasło/i).fill('Test123!')
    await page.getByRole('button', { name: /zaloguj/i }).click()

    await expect(page).toHaveURL('/tickets')
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('test@firma.pl')
    await page.getByLabel(/hasło/i).fill('Test123!')
    await page.getByRole('button', { name: /zaloguj/i }).click()

    await expect(page).toHaveURL('/tickets')

    // Logout
    await page.getByRole('button', { name: /wyloguj/i }).click()

    await expect(page).toHaveURL('/login')
  })
})

