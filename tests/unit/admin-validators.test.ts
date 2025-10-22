import { describe, it, expect } from 'vitest'
import { 
  updateCategorySchema, 
  updateSubcategorySchema 
} from '@/app/lib/validators/categories'
import { 
  createUserSchema, 
  updateUserSchema, 
  forcePasswordResetSchema 
} from '@/app/lib/validators/users'
import { getAuditLogsSchema } from '@/app/lib/validators/audit-logs'

describe('Admin Validators', () => {
  describe('updateCategorySchema', () => {
    it('should validate valid description', () => {
      const validData = {
        description: 'Valid category description'
      }

      const result = updateCategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('Valid category description')
      }
    })

    it('should allow null description', () => {
      const validData = {
        description: null
      }

      const result = updateCategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBeNull()
      }
    })

    it('should allow missing description', () => {
      const validData = {}

      const result = updateCategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject description longer than 500 characters', () => {
      const validData = {
        description: 'a'.repeat(501)
      }

      const result = updateCategorySchema.safeParse(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('500')
      }
    })

    it('should accept description with exactly 500 characters', () => {
      const validData = {
        description: 'a'.repeat(500)
      }

      const result = updateCategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateSubcategorySchema', () => {
    it('should validate name and description', () => {
      const validData = {
        name: 'Updated Subcategory',
        description: 'Updated description'
      }

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Subcategory')
        expect(result.data.description).toBe('Updated description')
      }
    })

    it('should reject name shorter than 2 characters', () => {
      const validData = {
        name: 'A'
      }

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('minimum 2')
      }
    })

    it('should reject name longer than 100 characters', () => {
      const validData = {
        name: 'a'.repeat(101)
      }

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('100')
      }
    })

    it('should reject description longer than 500 characters', () => {
      const validData = {
        description: 'a'.repeat(501)
      }

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(false)
    })

    it('should allow null description', () => {
      const validData = {
        name: 'Valid Name',
        description: null
      }

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBeNull()
      }
    })

    it('should allow partial updates (only name)', () => {
      const validData = {
        name: 'Updated Name'
      }

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates (only description)', () => {
      const validData = {
        description: 'Updated description'
      }

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const validData = {}

      const result = updateSubcategorySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'SecurePass123!'
      }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'New User',
        role: 'USER',
        password: 'SecurePass123!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'A',
        role: 'USER',
        password: 'SecurePass123!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'a'.repeat(101),
        role: 'USER',
        password: 'SecurePass123!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'New User',
        role: 'INVALID_ROLE',
        password: 'SecurePass123!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept ADMIN, AGENT, and USER roles', () => {
      const roles = ['ADMIN', 'AGENT', 'USER']

      roles.forEach(role => {
        const validData = {
          email: 'user@firma.pl',
          name: 'New User',
          role,
          password: 'SecurePass123!'
        }

        const result = createUserSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'Pass1!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('minimum 8')
      }
    })

    it('should reject password without lowercase letter', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'PASSWORD123!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('małą literę')
      }
    })

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'password123!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('dużą literę')
      }
    })

    it('should reject password without digit', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'Password!'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('cyfrę')
      }
    })

    it('should reject password without special character', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'Password123'
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('znak specjalny')
      }
    })

    it('should reject password longer than 100 characters', () => {
      const invalidData = {
        email: 'user@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'Pass123!' + 'a'.repeat(100)
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const testCases = [
        { name: 'New User', role: 'USER', password: 'Pass123!' }, // missing email
        { email: 'user@firma.pl', role: 'USER', password: 'Pass123!' }, // missing name
        { email: 'user@firma.pl', name: 'New User', password: 'Pass123!' }, // missing role
        { email: 'user@firma.pl', name: 'New User', role: 'USER' }, // missing password
      ]

      testCases.forEach(testCase => {
        const result = createUserSchema.safeParse(testCase)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('updateUserSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        name: 'Updated Name',
        role: 'AGENT',
        forcePasswordChange: true
      }

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates (only name)', () => {
      const validData = {
        name: 'Updated Name'
      }

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates (only role)', () => {
      const validData = {
        role: 'ADMIN'
      }

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates (only forcePasswordChange)', () => {
      const validData = {
        forcePasswordChange: false
      }

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const validData = {}

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        role: 'INVALID'
      }

      const result = updateUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'A'
      }

      const result = updateUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        name: 'a'.repeat(101)
      }

      const result = updateUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('forcePasswordResetSchema', () => {
    it('should validate valid UUID', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = forcePasswordResetSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidData = {
        userId: 'not-a-uuid'
      }

      const result = forcePasswordResetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toBeDefined()
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues[0].message).toContain('Nieprawidłowy format ID')
      }
    })

    it('should reject missing userId', () => {
      const invalidData = {}

      const result = forcePasswordResetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('getAuditLogsSchema', () => {
    it('should validate with no parameters (defaults)', () => {
      const validData = {}

      const result = getAuditLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should validate with all parameters', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'USER_LOGIN',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        page: '2',
        limit: '25'
      }

      const result = getAuditLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe('123e4567-e89b-12d3-a456-426614174000')
        expect(result.data.action).toBe('USER_LOGIN')
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(25)
      }
    })

    it('should coerce string page to number', () => {
      const validData = {
        page: '5'
      }

      const result = getAuditLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(5)
      }
    })

    it('should coerce string limit to number', () => {
      const validData = {
        limit: '100'
      }

      const result = getAuditLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100)
      }
    })

    it('should reject invalid userId (not UUID)', () => {
      const invalidData = {
        userId: 'not-a-uuid'
      }

      const result = getAuditLogsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid action', () => {
      const invalidData = {
        action: 'INVALID_ACTION'
      }

      const result = getAuditLogsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept all valid action types', () => {
      const actions = [
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_PASSWORD_RESET',
        'CATEGORY_UPDATED',
        'SUBCATEGORY_UPDATED'
      ]

      actions.forEach(action => {
        const validData = { action }
        const result = getAuditLogsSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid datetime format', () => {
      const invalidData = {
        startDate: '2025-01-01'
      }

      const result = getAuditLogsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject page less than 1', () => {
      const invalidData = {
        page: '0'
      }

      const result = getAuditLogsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject limit less than 1', () => {
      const invalidData = {
        limit: '0'
      }

      const result = getAuditLogsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject limit greater than 100', () => {
      const invalidData = {
        limit: '101'
      }

      const result = getAuditLogsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept limit of exactly 100', () => {
      const validData = {
        limit: '100'
      }

      const result = getAuditLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

