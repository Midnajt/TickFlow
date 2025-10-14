import { test, expect } from '@playwright/test'

test.describe('Ticket Management - User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('user@firma.pl')
    await page.getByLabel(/hasło/i).fill('UserPass123!')
    await page.getByRole('button', { name: /zaloguj/i }).click()
    
    await expect(page).toHaveURL('/tickets')
  })

  test('should display user tickets list', async ({ page }) => {
    await expect(page.getByText(/moje zgłoszenia/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /nowe zgłoszenie/i })).toBeVisible()
  })

  test('should create new ticket with AI suggestion', async ({ page }) => {
    // Click new ticket button
    await page.getByRole('button', { name: /nowe zgłoszenie/i }).click()

    // Fill description
    const description = 'Mój komputer nie włącza się, nie ma żadnych sygnałów świetlnych'
    await page.getByLabel(/opis problemu/i).fill(description)

    // Click AI suggestion button
    await page.getByRole('button', { name: /sugestia ai/i }).click()

    // Wait for AI response and check if category is filled
    await expect(page.getByLabel(/kategoria/i)).toHaveValue(/.+/)

    // Fill title
    await page.getByLabel(/tytuł/i).fill('Komputer się nie włącza')

    // Submit form
    await page.getByRole('button', { name: /wyślij zgłoszenie/i }).click()

    // Verify success
    await expect(page.getByText(/zgłoszenie zostało utworzone/i)).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /nowe zgłoszenie/i }).click()
    await page.getByRole('button', { name: /wyślij zgłoszenie/i }).click()

    await expect(page.getByText(/tytuł jest wymagany/i)).toBeVisible()
    await expect(page.getByText(/opis jest wymagany/i)).toBeVisible()
  })

  test('should filter tickets by status', async ({ page }) => {
    // Select status filter
    await page.getByLabel(/status/i).selectOption('OPEN')

    // Verify only open tickets are visible
    const tickets = await page.getByTestId('ticket-card').all()
    for (const ticket of tickets) {
      await expect(ticket.getByText(/otwarty/i)).toBeVisible()
    }
  })
})

test.describe('Ticket Management - Agent Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agent
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('jan.kowalski@firma.pl')
    await page.getByLabel(/hasło/i).fill('AgentPass123!')
    await page.getByRole('button', { name: /zaloguj/i }).click()
    
    await expect(page).toHaveURL('/tickets')
  })

  test('should display tickets from assigned categories', async ({ page }) => {
    await expect(page.getByText(/dostępne zgłoszenia/i)).toBeVisible()
    
    // Agent should see tickets from their categories
    const tickets = await page.getByTestId('ticket-card').all()
    expect(tickets.length).toBeGreaterThan(0)
  })

  test('should assign ticket to self', async ({ page }) => {
    // Click on first unassigned ticket
    const firstTicket = page.getByTestId('ticket-card').first()
    await firstTicket.click()

    // Assign to self
    await page.getByRole('button', { name: /przypisz do mnie/i }).click()

    // Verify assignment
    await expect(page.getByText(/zgłoszenie zostało przypisane/i)).toBeVisible()
  })

  test('should change ticket status', async ({ page }) => {
    // Navigate to assigned tickets
    await page.getByRole('link', { name: /moje zgłoszenia/i }).click()

    // Click on first assigned ticket
    const firstTicket = page.getByTestId('ticket-card').first()
    await firstTicket.click()

    // Change status to IN_PROGRESS
    await page.getByLabel(/status/i).selectOption('IN_PROGRESS')
    await page.getByRole('button', { name: /zapisz/i }).click()

    await expect(page.getByText(/status został zmieniony/i)).toBeVisible()
  })

  test('should close resolved ticket', async ({ page }) => {
    // Navigate to assigned tickets
    await page.getByRole('link', { name: /moje zgłoszenia/i }).click()

    // Click on first ticket
    const firstTicket = page.getByTestId('ticket-card').first()
    await firstTicket.click()

    // Close ticket
    await page.getByRole('button', { name: /zamknij zgłoszenie/i }).click()
    await page.getByRole('button', { name: /potwierdź/i }).click()

    await expect(page.getByText(/zgłoszenie zostało zamknięte/i)).toBeVisible()
  })
})

