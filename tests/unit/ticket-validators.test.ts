import { describe, it, expect } from 'vitest'
import { createTicketSchema } from '@/app/lib/validators/tickets'

describe('Ticket Validators', () => {
  describe('createTicketSchema', () => {
    it('should validate correct ticket data', () => {
      const validData = {
        title: 'Valid ticket title',
        description: 'This is a valid description for the ticket',
        subcategoryId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = createTicketSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject title shorter than 3 characters', () => {
      const invalidData = {
        title: 'Te',
        description: 'Valid description',
        subcategoryId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = createTicketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject description longer than 2000 characters', () => {
      const invalidData = {
        title: 'Valid title',
        description: 'a'.repeat(2001),
        subcategoryId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = createTicketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept optional categoryId', () => {
      const validData = {
        title: 'Valid title',
        description: 'Valid description',
        subcategoryId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = createTicketSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing subcategoryId', () => {
      const invalidData = {
        title: 'Valid title',
        description: 'Valid description',
      }

      const result = createTicketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from title and description', () => {
      const dataWithWhitespace = {
        title: '  Valid ticket title  ',
        description: '  This is a valid description  ',
        subcategoryId: '123e4567-e89b-12d3-a456-426614174000',
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

