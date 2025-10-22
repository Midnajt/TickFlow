import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getUsersGET } from '@/app/api/admin/users/route'
import { GET as getCategoriesGET } from '@/app/api/admin/categories/route'
import { GET as getAuditLogsGET } from '@/app/api/admin/audit-logs/route'
import { NextRequest } from 'next/server'

// Mock AuthService
vi.mock('@/app/lib/services/auth', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}))

// Mock services (to avoid database calls)
vi.mock('@/app/lib/services/users/user-admin.service', () => ({
  UserAdminService: {
    getAllUsers: vi.fn().mockResolvedValue([])
  }
}))

vi.mock('@/app/lib/services/categories/category-admin.service', () => ({
  CategoryAdminService: {
    getCategoriesWithAgents: vi.fn().mockResolvedValue([])
  }
}))

vi.mock('@/app/lib/services/audit-log/audit-log.service', () => ({
  AuditLogService: {
    getLogs: vi.fn().mockResolvedValue({ logs: [], pagination: {} })
  }
}))

// Helper to create mock NextRequest
function createMockRequest(token?: string): NextRequest {
  const headers = new Headers()
  if (token) {
    headers.set('Cookie', `auth-token=${token}`)
  }

  return {
    headers,
    method: 'GET',
    url: 'http://localhost:3000/api/admin/users',
    cookies: {
      get: (name: string) => token && name === 'auth-token' ? { value: token } : undefined
    }
  } as any as NextRequest
}

describe('Admin Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ADMIN role access', () => {
    it('should allow ADMIN user to access /api/admin/users', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@firma.pl',
          name: 'Admin User',
          role: 'ADMIN',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-admin-token')
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should allow ADMIN user to access /api/admin/categories', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@firma.pl',
          name: 'Admin User',
          role: 'ADMIN',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-admin-token')
      const response = await getCategoriesGET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should allow ADMIN user to access /api/admin/audit-logs', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@firma.pl',
          name: 'Admin User',
          role: 'ADMIN',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-admin-token')
      const response = await getAuditLogsGET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('USER role access (FORBIDDEN)', () => {
    it('should return 403 for USER trying to access /api/admin/users', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@firma.pl',
          name: 'Regular User',
          role: 'USER',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-user-token')
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('AUTHORIZATION_ERROR')
      expect(data.message).toContain('Brak uprawnień')
    })

    it('should return 403 for USER trying to access /api/admin/categories', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@firma.pl',
          name: 'Regular User',
          role: 'USER',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-user-token')
      const response = await getCategoriesGET(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('AUTHORIZATION_ERROR')
    })

    it('should return 403 for USER trying to access /api/admin/audit-logs', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@firma.pl',
          name: 'Regular User',
          role: 'USER',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-user-token')
      const response = await getAuditLogsGET(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('AGENT role access (FORBIDDEN)', () => {
    it('should return 403 for AGENT trying to access /api/admin/users', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'agent-123',
          email: 'agent@firma.pl',
          name: 'Agent User',
          role: 'AGENT',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-agent-token')
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('AUTHORIZATION_ERROR')
    })

    it('should return 403 for AGENT trying to access /api/admin/categories', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'agent-123',
          email: 'agent@firma.pl',
          name: 'Agent User',
          role: 'AGENT',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-agent-token')
      const response = await getCategoriesGET(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('AUTHORIZATION_ERROR')
    })

    it('should return 403 for AGENT trying to access /api/admin/audit-logs', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'agent-123',
          email: 'agent@firma.pl',
          name: 'Agent User',
          role: 'AGENT',
          passwordResetRequired: false
        }
      })

      const req = createMockRequest('valid-agent-token')
      const response = await getAuditLogsGET(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('Unauthenticated access (no token)', () => {
    it('should return 401 when no token provided for /api/admin/users', async () => {
      const req = createMockRequest() // no token
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('AUTHENTICATION_ERROR')
      expect(data.message).toContain('zalogowany')
    })

    it('should return 401 when no token provided for /api/admin/categories', async () => {
      const req = createMockRequest() // no token
      const response = await getCategoriesGET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('AUTHENTICATION_ERROR')
    })

    it('should return 401 when no token provided for /api/admin/audit-logs', async () => {
      const req = createMockRequest() // no token
      const response = await getAuditLogsGET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('Invalid token', () => {
    it('should return 401 when token is invalid', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockRejectedValue(
        new Error('AUTHENTICATION_ERROR:Token jest nieprawidłowy lub wygasł')
      )

      const req = createMockRequest('invalid-token')
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('AUTHENTICATION_ERROR')
    })

    it('should return 401 when token is expired', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockRejectedValue(
        new Error('AUTHENTICATION_ERROR:Token wygasł')
      )

      const req = createMockRequest('expired-token')
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('Role hierarchy', () => {
    it('should respect role hierarchy - ADMIN > AGENT > USER', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      // Test that only ADMIN can access admin endpoints
      const roles = [
        { role: 'ADMIN', shouldHaveAccess: true },
        { role: 'AGENT', shouldHaveAccess: false },
        { role: 'USER', shouldHaveAccess: false }
      ]

      for (const { role, shouldHaveAccess } of roles) {
        vi.clearAllMocks()

        vi.mocked(AuthService.getSession).mockResolvedValue({
          user: {
            id: `${role.toLowerCase()}-123`,
            email: `${role.toLowerCase()}@firma.pl`,
            name: `${role} User`,
            role: role as any,
            passwordResetRequired: false
          }
        })

        const req = createMockRequest(`valid-${role.toLowerCase()}-token`)
        const response = await getUsersGET(req)

        if (shouldHaveAccess) {
          expect(response.status).toBe(200)
        } else {
          expect(response.status).toBe(403)
        }
      }
    })
  })

  describe('Error handling', () => {
    it('should handle internal errors gracefully', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      
      vi.mocked(AuthService.getSession).mockRejectedValue(
        new Error('Unexpected error')
      )

      const req = createMockRequest('some-token')
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('AUTHENTICATION_ERROR')
    })

    it('should handle database errors after successful auth', async () => {
      const { AuthService } = await import('@/app/lib/services/auth')
      const { UserAdminService } = await import('@/app/lib/services/users/user-admin.service')
      
      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@firma.pl',
          name: 'Admin User',
          role: 'ADMIN',
          passwordResetRequired: false
        }
      })

      // Simulate database error after auth
      vi.mocked(UserAdminService.getAllUsers).mockRejectedValue(
        new Error('DATABASE_ERROR:Connection failed')
      )

      const req = createMockRequest('valid-admin-token')
      const response = await getUsersGET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DATABASE_ERROR')
    })
  })
})

