import { describe, it, expect } from 'vitest'
import { createTicketSchema } from '@/app/lib/validators/tickets'

describe('Ticket Validators', () => {
  describe('createTicketSchema', () => {
    it('should validate correct ticket data', () => {
      const validData = {
        title: 'Valid ticket title',
        description: 'This is a valid description for the ticket',
        categoryId: 'cat-123',
        subcategoryId: 'sub-456',
      }

      const result = createTicketSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject title shorter than 5 characters', () => {
      const invalidData = {
        title: 'Test',
        description: 'Valid description',
        categoryId: 'cat-123',
        subcategoryId: 'sub-456',
      }

      const result = createTicketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject description longer than 300 characters', () => {
      const invalidData = {
        title: 'Valid title',
        description: 'a'.repeat(301),
        categoryId: 'cat-123',
        subcategoryId: 'sub-456',
      }

      const result = createTicketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing categoryId', () => {
      const invalidData = {
        title: 'Valid title',
        description: 'Valid description',
        subcategoryId: 'sub-456',
      }

      const result = createTicketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing subcategoryId', () => {
      const invalidData = {
        title: 'Valid title',
        description: 'Valid description',
        categoryId: 'cat-123',
      }

      const result = createTicketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from title and description', () => {
      const dataWithWhitespace = {
        title: '  Valid ticket title  ',
        description: '  This is a valid description  ',
        categoryId: 'cat-123',
        subcategoryId: 'sub-456',
      }

      const result = createTicketSchema.safeParse(dataWithWhitespace)
      
      if (result.success) {
        expect(result.data.title).toBe('Valid ticket title')
        expect(result.data.description).toBe('This is a valid description')
      } else {
        throw new Error('Expected validation to succeed')
      }
    })
  })
})

