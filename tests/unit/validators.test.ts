import { describe, it, expect } from 'vitest'
import { loginSchema, changePasswordSchema } from '@/app/lib/validators/auth'

describe('Auth Validators', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        email: 'test@firma.pl',
        password: 'Test123!',
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Test123!',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@firma.pl',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate correct password change', () => {
      const validData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      }

      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject password without special character', () => {
      const invalidData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        currentPassword: 'OldPass123!',
        newPassword: 'Test1!',
        confirmPassword: 'Test1!',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject when passwords do not match', () => {
      const invalidData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject when new password is same as current', () => {
      const invalidData = {
        currentPassword: 'SamePass123!',
        newPassword: 'SamePass123!',
        confirmPassword: 'SamePass123!',
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

