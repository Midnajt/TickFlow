import { describe, it, expect } from 'vitest'
import { NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse
} from '@/app/lib/utils/api-response'

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should return success response with data and default status 200', async () => {
      const data = { message: 'Success', id: 123 }
      const response = successResponse(data)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual(data)
    })

    it('should return success response with custom status code', async () => {
      const data = { id: 'new-resource' }
      const response = successResponse(data, 201)

      expect(response.status).toBe(201)

      const json = await response.json()
      expect(json).toEqual(data)
    })

    it('should handle empty object', async () => {
      const response = successResponse({})

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({})
    })

    it('should handle array data', async () => {
      const data = [1, 2, 3, 4, 5]
      const response = successResponse(data)

      const json = await response.json()
      expect(json).toEqual(data)
    })

    it('should handle string data', async () => {
      const data = 'Simple string'
      const response = successResponse(data)

      const json = await response.json()
      expect(json).toEqual(data)
    })

    it('should handle null data', async () => {
      const response = successResponse(null)

      const json = await response.json()
      expect(json).toBeNull()
    })
  })

  describe('errorResponse', () => {
    it('should return error response with correct structure', async () => {
      const response = errorResponse('Something went wrong', 'GENERIC_ERROR', 400)

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json).toEqual({
        error: 'GENERIC_ERROR',
        message: 'Something went wrong'
      })
    })

    it('should handle different status codes', async () => {
      const testCases = [
        { status: 400, code: 'BAD_REQUEST' },
        { status: 401, code: 'UNAUTHORIZED' },
        { status: 403, code: 'FORBIDDEN' },
        { status: 404, code: 'NOT_FOUND' },
        { status: 500, code: 'INTERNAL_ERROR' }
      ]

      for (const { status, code } of testCases) {
        const response = errorResponse('Error message', code, status)
        expect(response.status).toBe(status)

        const json = await response.json()
        expect(json.error).toBe(code)
      }
    })
  })

  describe('validationErrorResponse', () => {
    it('should format ZodError with field-level errors', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      })

      try {
        schema.parse({
          email: 'invalid-email',
          age: 15
        })
      } catch (error) {
        if (error instanceof ZodError) {
          const response = validationErrorResponse(error)

          expect(response.status).toBe(400)

          const json = await response.json()
          expect(json.error).toBe('VALIDATION_ERROR')
          expect(json.message).toBe('Błąd walidacji danych')
          expect(json.errors).toBeDefined()
          expect(Array.isArray(json.errors)).toBe(true)
          expect(json.errors.length).toBeGreaterThan(0)

          // Check structure of error items
          json.errors.forEach((err: any) => {
            expect(err).toHaveProperty('field')
            expect(err).toHaveProperty('message')
          })
        }
      }
    })

    it('should format nested field errors correctly', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1)
          })
        })
      })

      try {
        schema.parse({
          user: {
            profile: {
              name: ''
            }
          }
        })
      } catch (error) {
        if (error instanceof ZodError) {
          const response = validationErrorResponse(error)
          const json = await response.json()

          const nameError = json.errors.find((e: any) => e.field === 'user.profile.name')
          expect(nameError).toBeDefined()
        }
      }
    })

    it('should handle array field errors', async () => {
      const schema = z.object({
        tags: z.array(z.string().min(1))
      })

      try {
        schema.parse({
          tags: ['valid', '', 'also-valid']
        })
      } catch (error) {
        if (error instanceof ZodError) {
          const response = validationErrorResponse(error)
          const json = await response.json()

          const arrayError = json.errors.find((e: any) => e.field.startsWith('tags.'))
          expect(arrayError).toBeDefined()
        }
      }
    })

    it('should handle multiple validation errors', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        username: z.string().min(3)
      })

      try {
        schema.parse({
          email: 'bad',
          password: 'short',
          username: 'ab'
        })
      } catch (error) {
        if (error instanceof ZodError) {
          const response = validationErrorResponse(error)
          const json = await response.json()

          expect(json.errors.length).toBe(3)

          const fields = json.errors.map((e: any) => e.field)
          expect(fields).toContain('email')
          expect(fields).toContain('password')
          expect(fields).toContain('username')
        }
      }
    })
  })

  describe('notFoundResponse', () => {
    it('should return 404 with resource name', async () => {
      const response = notFoundResponse('Ticket')

      expect(response.status).toBe(404)

      const json = await response.json()
      expect(json.error).toBe('NOT_FOUND')
      expect(json.message).toContain('Ticket')
      expect(json.message).toContain('nie został znaleziony')
    })

    it('should handle different resource names', async () => {
      const resources = ['User', 'Category', 'Subcategory', 'Agent']

      for (const resource of resources) {
        const response = notFoundResponse(resource)
        const json = await response.json()

        expect(json.message).toContain(resource)
      }
    })
  })

  describe('unauthorizedResponse', () => {
    it('should return 401 with default message', async () => {
      const response = unauthorizedResponse()

      expect(response.status).toBe(401)

      const json = await response.json()
      expect(json.error).toBe('UNAUTHORIZED')
      expect(json.message).toBe('Brak autoryzacji')
    })

    it('should return 401 with custom message', async () => {
      const customMessage = 'Token wygasł'
      const response = unauthorizedResponse(customMessage)

      expect(response.status).toBe(401)

      const json = await response.json()
      expect(json.error).toBe('UNAUTHORIZED')
      expect(json.message).toBe(customMessage)
    })
  })

  describe('forbiddenResponse', () => {
    it('should return 403 with default message', async () => {
      const response = forbiddenResponse()

      expect(response.status).toBe(403)

      const json = await response.json()
      expect(json.error).toBe('FORBIDDEN')
      expect(json.message).toBe('Brak uprawnień')
    })

    it('should return 403 with custom message', async () => {
      const customMessage = 'Wymagana rola AGENT'
      const response = forbiddenResponse(customMessage)

      expect(response.status).toBe(403)

      const json = await response.json()
      expect(json.error).toBe('FORBIDDEN')
      expect(json.message).toBe(customMessage)
    })
  })

  describe('internalErrorResponse', () => {
    it('should return 500 with default message', async () => {
      const response = internalErrorResponse()

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.error).toBe('INTERNAL_ERROR')
      expect(json.message).toBe('Wystąpił błąd serwera')
    })

    it('should return 500 with custom message', async () => {
      const customMessage = 'Błąd połączenia z bazą danych'
      const response = internalErrorResponse(customMessage)

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.error).toBe('INTERNAL_ERROR')
      expect(json.message).toBe(customMessage)
    })
  })

  describe('Response consistency', () => {
    it('should have Content-Type application/json for all responses', async () => {
      const responses = [
        successResponse({ test: true }),
        errorResponse('Error', 'CODE', 400),
        notFoundResponse('Resource'),
        unauthorizedResponse(),
        forbiddenResponse(),
        internalErrorResponse()
      ]

      for (const response of responses) {
        const contentType = response.headers.get('Content-Type')
        expect(contentType).toContain('application/json')
      }
    })

    it('should return valid JSON for all error responses', async () => {
      const errorResponses = [
        errorResponse('Test error', 'TEST', 400),
        notFoundResponse('Test'),
        unauthorizedResponse('Test'),
        forbiddenResponse('Test'),
        internalErrorResponse('Test')
      ]

      for (const response of errorResponses) {
        const json = await response.json()

        expect(json).toHaveProperty('error')
        expect(json).toHaveProperty('message')
        expect(typeof json.error).toBe('string')
        expect(typeof json.message).toBe('string')
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle very long error messages', async () => {
      const longMessage = 'A'.repeat(1000)
      const response = errorResponse(longMessage, 'LONG_ERROR', 400)

      const json = await response.json()
      expect(json.message).toBe(longMessage)
      expect(json.message.length).toBe(1000)
    })

    it('should handle special characters in messages', async () => {
      const specialMessage = 'Error: <script>alert("xss")</script> & "quotes"'
      const response = errorResponse(specialMessage, 'SPECIAL', 400)

      const json = await response.json()
      expect(json.message).toBe(specialMessage)
    })

    it('should handle unicode in messages', async () => {
      const unicodeMessage = 'Błąd: użytkownik 👤 nie został znaleziony 🔍'
      const response = errorResponse(unicodeMessage, 'UNICODE', 400)

      const json = await response.json()
      expect(json.message).toBe(unicodeMessage)
    })
  })
})

