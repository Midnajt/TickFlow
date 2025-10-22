import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies BEFORE imports
vi.mock('@/app/lib/services/auth', () => ({
  AuthService: {
    login: vi.fn(),
    getSession: vi.fn(),
  },
}))

vi.mock('@/app/lib/services/audit-log/audit-log.service', () => ({
  AuditLogService: {
    createLog: vi.fn().mockResolvedValue(undefined),
    getClientIp: vi.fn(() => '192.168.1.1'),
    getUserAgent: vi.fn(() => 'Mozilla/5.0'),
  }
}))

vi.mock('@/app/lib/supabase-server', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/app/lib/middleware/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => null),
  addRateLimitHeaders: vi.fn(),
}))

// Import after mocks
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { NextRequest } from 'next/server'
import { AuthService } from '@/app/lib/services/auth'
import { AuditLogService } from '@/app/lib/services/audit-log/audit-log.service'
import { getServerSession } from '@/app/lib/supabase-server'

// Helper to create mock NextRequest
function createMockRequest(body?: any): NextRequest {
  return {
    json: async () => body || {},
    headers: new Headers({
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0'
    }),
    method: 'POST',
    url: 'http://localhost:3000/api/auth/login',
    cookies: {
      get: (name: string) => name === 'auth-token' ? { value: 'test-token' } : undefined
    }
  } as any as NextRequest
}

describe('Audit Logging in Auth Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/login - Audit Logging', () => {
    it('should create audit log on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@firma.pl',
        name: 'Test User',
        role: 'USER' as const,
        passwordResetRequired: false
      }

      const mockSession = {
        set: vi.fn()
      }

      vi.mocked(AuthService.login).mockResolvedValue({
        user: mockUser,
        token: 'test-token'
      })

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

      const req = createMockRequest({
        email: 'test@firma.pl',
        password: 'SecurePass123!'
      })

      const response = await loginPOST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify audit log was created
      expect(AuditLogService.createLog).toHaveBeenCalledWith({
        userId: mockUser.id,
        action: 'USER_LOGIN',
        details: { email: mockUser.email },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })
    })


    it('should NOT create audit log on failed login (wrong credentials)', async () => {
      vi.mocked(AuthService.login).mockRejectedValue(
        new Error('AUTHENTICATION_ERROR:Nieprawidłowy email lub hasło')
      )

      const req = createMockRequest({
        email: 'test@firma.pl',
        password: 'wrongpassword'
      })

      await loginPOST(req)

      // Audit log should NOT be created for failed login
      expect(AuditLogService.createLog).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/auth/logout - Audit Logging', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@firma.pl',
        name: 'Test User',
        role: 'USER' as const,
        passwordResetRequired: false
      }
    }

    it('should create audit log on logout', async () => {
      const mockSet = vi.fn()
      const mockSessionReturn = {
        set: mockSet
      }
      
      vi.mocked(getServerSession).mockResolvedValue(mockSessionReturn as any)

      const req = createMockRequest()

      await logoutPOST(req, mockSession)

      // Verify audit log was created
      expect(AuditLogService.createLog).toHaveBeenCalledWith({
        userId: mockSession.user.id,
        action: 'USER_LOGOUT',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })

      expect(mockSet).toHaveBeenCalledWith(null)
    })
  })
})

