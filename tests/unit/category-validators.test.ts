import { describe, it, expect } from 'vitest'
import { getCategoriesQuerySchema } from '@/app/lib/validators/categories'

describe('Category Validators', () => {
  describe('getCategoriesQuerySchema', () => {
    it('should validate with includeSubcategories as "true" string', () => {
      const validData = {
        includeSubcategories: 'true'
      }

      const result = getCategoriesQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includeSubcategories).toBe(true)
      }
    })

    it('should validate with includeSubcategories as "false" string', () => {
      const validData = {
        includeSubcategories: 'false'
      }

      const result = getCategoriesQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includeSubcategories).toBe(false)
      }
    })

    it('should default to "true" when includeSubcategories is not provided', () => {
      const validData = {}

      const result = getCategoriesQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includeSubcategories).toBe(true)
      }
    })

    it('should default to "true" when includeSubcategories is undefined', () => {
      const validData = {
        includeSubcategories: undefined
      }

      const result = getCategoriesQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includeSubcategories).toBe(true)
      }
    })

    it('should transform any non-"true" string to false', () => {
      const testCases = ['false', '0', 'no', 'False', 'TRUE', '1', 'yes']

      testCases.forEach((value) => {
        const result = getCategoriesQuerySchema.safeParse({
          includeSubcategories: value
        })
        expect(result.success).toBe(true)
        if (result.success) {
          if (value === 'true') {
            expect(result.data.includeSubcategories).toBe(true)
          } else {
            expect(result.data.includeSubcategories).toBe(false)
          }
        }
      })
    })

    it('should handle empty object', () => {
      const result = getCategoriesQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includeSubcategories).toBe(true)
      }
    })
  })
})

