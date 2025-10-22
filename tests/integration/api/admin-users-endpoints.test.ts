import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getUsersGET, POST as createUserPOST } from '@/app/api/admin/users/route'
import { PATCH as updateUserPATCH } from '@/app/api/admin/users/[userId]/route'
import { POST as forceResetPOST } from '@/app/api/admin/users/[userId]/force-password-reset/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/app/lib/middleware/auth-middleware', () => ({
  withRole: (roles: string[], handler: any) => handler
}))

vi.mock('@/app/lib/services/users/user-admin.service', () => ({
  UserAdminService: {
    getAllUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    forcePasswordReset: vi.fn()
  }
}))

// Helper to create mock NextRequest
function createMockRequest(body?: any, params?: any): NextRequest {
  return {
    json: async () => body || {},
    headers: new Headers(),
    method: 'POST',
    url: 'http://localhost:3000/api/admin/users',
  } as NextRequest
}

// Mock admin user
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@firma.pl',
  name: 'Admin User',
  role: 'ADMIN'
}

describe('Admin Users Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/users', () => {
    it('should return list of users successfully', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@firma.pl',
          name: 'User One',
          role: 'USER',
          forcePasswordChange: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          ticketsCreatedCount: 5,
          ticketsAssignedCount: 0
        },
        {
          id: 'agent-1',
          email: 'agent1@firma.pl',
          name: 'Agent One',
          role: 'AGENT',
          forcePasswordChange: false,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
          ticketsCreatedCount: 2,
          ticketsAssignedCount: 10
        }
      ]

      vi.mocked(UserAdminService.getAllUsers).mockResolvedValue(mockUsers)

      const req = createMockRequest()
      const response = await getUsersGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.users).toHaveLength(2)
      expect(data.data.users[0].email).toBe('user1@firma.pl')
      expect(UserAdminService.getAllUsers).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.getAllUsers).mockRejectedValue(
        new Error('DATABASE_ERROR:Connection failed')
      )

      const req = createMockRequest()
      const response = await getUsersGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DATABASE_ERROR')
    })
  })

  describe('POST /api/admin/users', () => {
    it('should create user successfully', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      const newUser = {
        id: 'new-user-id',
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        forcePasswordChange: true,
        createdAt: '2025-01-22T00:00:00Z',
        updatedAt: '2025-01-22T00:00:00Z',
        ticketsCreatedCount: 0,
        ticketsAssignedCount: 0
      }

      vi.mocked(UserAdminService.createUser).mockResolvedValue(newUser)

      const req = createMockRequest({
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'SecurePass123!'
      })

      const response = await createUserPOST(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('newuser@firma.pl')
      expect(data.data.user.forcePasswordChange).toBe(true)
      expect(UserAdminService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@firma.pl',
          name: 'New User',
          role: 'USER',
          password: 'SecurePass123!'
        }),
        mockAdminUser.id
      )
    })

    it('should validate request body', async () => {
      const req = createMockRequest({
        email: 'invalid-email',
        name: 'A', // too short
        role: 'USER',
        password: 'weak' // too weak
      })

      const response = await createUserPOST(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should handle duplicate email error', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.createUser).mockRejectedValue(
        new Error('VALIDATION_ERROR:Użytkownik z tym emailem już istnieje')
      )

      const req = createMockRequest({
        email: 'existing@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'SecurePass123!'
      })

      const response = await createUserPOST(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
      expect(data.message).toContain('już istnieje')
    })
  })

  describe('PATCH /api/admin/users/:userId', () => {
    it('should update user successfully', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.updateUser).mockResolvedValue(undefined)

      const req = createMockRequest({
        name: 'Updated Name',
        role: 'AGENT'
      })

      const context = {
        params: Promise.resolve({ userId: 'user-123' })
      }

      const response = await updateUserPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toContain('zaktualizowany')
      expect(UserAdminService.updateUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          name: 'Updated Name',
          role: 'AGENT'
        }),
        mockAdminUser.id
      )
    })

    it('should validate request body', async () => {
      const req = createMockRequest({
        name: 'A', // too short
        role: 'INVALID_ROLE'
      })

      const context = {
        params: Promise.resolve({ userId: 'user-123' })
      }

      const response = await updateUserPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should handle NOT_FOUND error', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.updateUser).mockRejectedValue(
        new Error('NOT_FOUND:Użytkownik nie istnieje')
      )

      const req = createMockRequest({
        name: 'Updated Name'
      })

      const context = {
        params: Promise.resolve({ userId: 'nonexistent-user' })
      }

      const response = await updateUserPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NOT_FOUND')
    })

    it('should handle FORBIDDEN error (self-modification)', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.updateUser).mockRejectedValue(
        new Error('FORBIDDEN:Nie możesz zmienić własnej roli')
      )

      const req = createMockRequest({
        role: 'USER'
      })

      const context = {
        params: Promise.resolve({ userId: mockAdminUser.id })
      }

      const response = await updateUserPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('FORBIDDEN')
    })
  })

  describe('POST /api/admin/users/:userId/force-password-reset', () => {
    it('should force password reset successfully', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.forcePasswordReset).mockResolvedValue(undefined)

      const req = createMockRequest()

      const context = {
        params: Promise.resolve({ userId: 'user-123' })
      }

      const response = await forceResetPOST(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toContain('wymuszono')
      expect(UserAdminService.forcePasswordReset).toHaveBeenCalledWith(
        'user-123',
        mockAdminUser.id
      )
    })

    it('should handle NOT_FOUND error', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.forcePasswordReset).mockRejectedValue(
        new Error('NOT_FOUND:Użytkownik nie istnieje')
      )

      const req = createMockRequest()

      const context = {
        params: Promise.resolve({ userId: 'nonexistent-user' })
      }

      const response = await forceResetPOST(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NOT_FOUND')
    })

    it('should handle database errors', async () => {
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(UserAdminService.forcePasswordReset).mockRejectedValue(
        new Error('DATABASE_ERROR:Connection failed')
      )

      const req = createMockRequest()

      const context = {
        params: Promise.resolve({ userId: 'user-123' })
      }

      const response = await forceResetPOST(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DATABASE_ERROR')
    })
  })
})

