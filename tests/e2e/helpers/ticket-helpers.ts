import { type Page, expect } from '@playwright/test'

/**
 * Ticket test data interface
 */
export interface TicketData {
  title: string
  description: string
  categoryIndex?: number
  subcategoryIndex?: number
}

/**
 * Generate unique ticket title for testing
 * @param prefix - Prefix for the ticket title
 * @returns Unique ticket title with timestamp
 */
export function generateTicketTitle(prefix: string = 'Test Ticket'): string {
  return `${prefix} ${Date.now()}`
}

/**
 * Create a new ticket
 * @param page - Playwright page object
 * @param data - Ticket data
 */
export async function createTicket(page: Page, data: TicketData) {
  // Click create ticket button
  await page.getByRole('button', { name: /nowe zgłoszenie|utwórz zgłoszenie/i }).click()
  
  // Wait for form to appear
  await expect(page.getByLabel(/tytuł/i)).toBeVisible({ timeout: 5000 })
  
  // Fill title
  await page.getByLabel(/tytuł/i).fill(data.title)
  
  // Fill description
  await page.getByLabel(/opis/i).fill(data.description)
  
  // Select category
  const categorySelect = page.getByLabel(/kategoria/i)
  await categorySelect.click()
  
  // Select category by index (default: first option)
  const categoryIndex = data.categoryIndex || 1
  for (let i = 0; i < categoryIndex; i++) {
    await page.keyboard.press('ArrowDown')
  }
  await page.keyboard.press('Enter')
  
  // Wait for category to be selected
  await page.waitForTimeout(500)
  
  // Select subcategory if available
  if (data.subcategoryIndex !== undefined) {
    const subcategorySelect = page.getByLabel(/podkategoria|subcategory/i)
    const isSubcategoryVisible = await subcategorySelect.isVisible().catch(() => false)
    
    if (isSubcategoryVisible) {
      await subcategorySelect.click()
      
      for (let i = 0; i < data.subcategoryIndex; i++) {
        await page.keyboard.press('ArrowDown')
      }
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(500)
    }
  }
  
  // Submit form
  await page.getByRole('button', { name: /wyślij|utwórz|zapisz/i }).click()
  
  // Wait for success message
  await expect(
    page.locator('text=/zgłoszenie.*utworzone|ticket.*created|sukces/i').first()
  ).toBeVisible({ timeout: 10000 })
}

/**
 * Open ticket details dialog/page
 * @param page - Playwright page object
 * @param ticketTitle - Title of the ticket to open (optional - opens first if not provided)
 */
export async function openTicketDetails(page: Page, ticketTitle?: string) {
  if (ticketTitle) {
    // Find and click specific ticket
    const ticket = page.locator(`text="${ticketTitle}"`).first()
    await ticket.click()
  } else {
    // Click first ticket
    const firstTicket = page.getByTestId('ticket-card').first()
    await firstTicket.click()
  }
  
  // Wait for details to load
  await page.waitForTimeout(1000)
}

/**
 * Assign ticket to self (agent only)
 * @param page - Playwright page object
 */
export async function assignTicketToSelf(page: Page) {
  const assignButton = page.getByRole('button', { name: /przypisz.*mnie|assign.*me|przejmij/i })
  
  await expect(assignButton).toBeVisible({ timeout: 5000 })
  await assignButton.click()
  
  // Wait for success message
  await expect(
    page.locator('text=/przypisano|assigned|sukces/i').first()
  ).toBeVisible({ timeout: 10000 })
}

/**
 * Change ticket status
 * @param page - Playwright page object
 * @param status - New status (OPEN, IN_PROGRESS, CLOSED, etc.)
 */
export async function changeTicketStatus(page: Page, status: string) {
  const statusSelect = page.getByLabel(/status/i).first()
  
  await expect(statusSelect).toBeVisible({ timeout: 5000 })
  await statusSelect.selectOption(status)
  
  // Look for save button
  const saveButton = page.getByRole('button', { name: /zapisz|save|aktualizuj/i })
  const isSaveVisible = await saveButton.isVisible().catch(() => false)
  
  if (isSaveVisible) {
    await saveButton.click()
    
    // Wait for success message
    await expect(
      page.locator('text=/zaktualizowano|updated|sukces/i').first()
    ).toBeVisible({ timeout: 10000 })
  }
}

/**
 * Close ticket
 * @param page - Playwright page object
 */
export async function closeTicket(page: Page) {
  const closeButton = page.getByRole('button', { name: /zamknij|close|rozwiąż/i })
  
  await expect(closeButton).toBeVisible({ timeout: 5000 })
  await closeButton.click()
  
  // Handle confirmation dialog if present
  const confirmButton = page.getByRole('button', { name: /potwierdź|confirm|tak|yes/i })
  const isConfirmVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)
  
  if (isConfirmVisible) {
    await confirmButton.click()
  }
  
  // Wait for success message
  await expect(
    page.locator('text=/zamknięto|closed|sukces/i').first()
  ).toBeVisible({ timeout: 10000 })
}

/**
 * Add comment to ticket
 * @param page - Playwright page object
 * @param comment - Comment text
 */
export async function addComment(page: Page, comment: string) {
  const commentInput = page.locator('[placeholder*="komentarz"]')
    .or(page.locator('[placeholder*="comment"]')).first()
  
  await expect(commentInput).toBeVisible({ timeout: 5000 })
  await commentInput.fill(comment)
  
  const addButton = page.getByRole('button', { name: /dodaj.*komentarz|add.*comment/i })
  await addButton.click()
  
  // Wait for success
  await expect(
    page.locator('text=/komentarz.*dodany|comment.*added/i').first()
  ).toBeVisible({ timeout: 10000 })
}

/**
 * Filter tickets by status
 * @param page - Playwright page object
 * @param status - Status to filter by
 */
export async function filterByStatus(page: Page, status: string) {
  const statusFilter = page.getByLabel(/status/i)
    .or(page.locator('select').filter({ hasText: /status|wszystkie/i })).first()
  
  await statusFilter.selectOption(status)
  
  // Wait for filter to apply
  await page.waitForTimeout(1000)
}

/**
 * Search tickets by query
 * @param page - Playwright page object
 * @param query - Search query
 */
export async function searchTickets(page: Page, query: string) {
  const searchInput = page.locator('[placeholder*="Szukaj"]')
    .or(page.locator('[placeholder*="Search"]')).first()
  
  await searchInput.fill(query)
  
  // Wait for search to apply
  await page.waitForTimeout(1000)
}

/**
 * Get ticket count on current page
 * @param page - Playwright page object
 * @returns Number of visible tickets
 */
export async function getTicketCount(page: Page): Promise<number> {
  const tickets = page.getByTestId('ticket-card')
  return await tickets.count()
}

/**
 * Wait for ticket list to load
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds
 */
export async function waitForTicketsToLoad(page: Page, timeout: number = 5000) {
  // Wait for either tickets to appear or empty state
  await Promise.race([
    page.waitForSelector('[data-testid="ticket-card"]', { timeout }),
    page.waitForSelector('text=/brak zgłoszeń|no tickets/i', { timeout }),
  ]).catch(() => {
    // Timeout is acceptable - might be loading
  })
}

/**
 * Get AI suggestion for ticket categorization
 * @param page - Playwright page object
 */
export async function getAiSuggestion(page: Page) {
  const aiButton = page.getByRole('button', { name: /sugestia ai|ai|sztuczna inteligencja/i })
  
  await expect(aiButton).toBeVisible({ timeout: 5000 })
  await aiButton.click()
  
  // Wait for AI response (may take a few seconds)
  await page.waitForTimeout(3000)
}

/**
 * Verify ticket exists in list
 * @param page - Playwright page object
 * @param ticketTitle - Title of the ticket
 * @returns Boolean indicating if ticket exists
 */
export async function verifyTicketExists(
  page: Page,
  ticketTitle: string
): Promise<boolean> {
  const ticket = page.locator(`text="${ticketTitle}"`).first()
  return await ticket.isVisible({ timeout: 5000 }).catch(() => false)
}

/**
 * Wait for real-time update to propagate
 * @param timeout - Timeout in milliseconds (default: 3000)
 */
export async function waitForRealtimeUpdate(timeout: number = 3000) {
  // Supabase Realtime typically updates within 1-3 seconds
  await new Promise(resolve => setTimeout(resolve, timeout))
}

