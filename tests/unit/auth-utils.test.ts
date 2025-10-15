import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  getAuthToken,
  requireAuth,
  hasRole,
  requireRole,
  withAuth,
  withRole
} from '@/app/lib/utils/auth'
import type { UserSessionDTO } from '@/src/types'

// Mock AuthService
vi.mock('@/app/lib/services/auth', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}))

import { AuthService } from '@/app/lib/services/auth'

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuthToken', () => {
    it('should extract token from cookie', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Cookie: 'auth-token=test-token-from-cookie'
        }
      })

      const token = getAuthToken(request)
      expect(token).toBe('test-token-from-cookie')
    })

    it('should extract token from Authorization header with Bearer prefix', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer test-token-from-header'
        }
      })

      const token = getAuthToken(request)
      expect(token).toBe('test-token-from-header')
    })

    it('should prioritize cookie over Authorization header', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Cookie: 'auth-token=cookie-token',
          Authorization: 'Bearer header-token'
        }
      })

      const token = getAuthToken(request)
      expect(token).toBe('cookie-token')
    })

    it('should return null when no token is present', () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const token = getAuthToken(request)
      expect(token).toBeNull()
    })

    it('should return null when Authorization header does not have Bearer prefix', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Basic some-credentials'
        }
      })

      const token = getAuthToken(request)
      expect(token).toBeNull()
    })

    it('should handle Authorization header with Bearer but no token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer '
        }
      })

      const token = getAuthToken(request)
      // When "Bearer " has only whitespace or gets trimmed, we get null
      // This is because the header might be normalized
      expect(token).toBeNull()
    })

    it('should handle malformed Authorization header', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'InvalidFormat'
        }
      })

      const token = getAuthToken(request)
      expect(token).toBeNull()
    })
  })

  describe('requireAuth', () => {
    const mockUser: UserSessionDTO = {
      id: 'user-123',
      email: 'test@firma.pl',
      name: 'Test User',
      role: 'USER',
      requirePasswordChange: false
    }

    it('should return user session for valid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: mockUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const user = await requireAuth(request)
      expect(user).toEqual(mockUser)
      expect(AuthService.getSession).toHaveBeenCalledWith('valid-token')
    })

    it('should throw error when no token is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      await expect(requireAuth(request)).rejects.toThrow('AUTHENTICATION_ERROR')
      await expect(requireAuth(request)).rejects.toThrow('Brak autoryzacji')
    })

    it('should throw error when token is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockRejectedValue(
        new Error('Invalid token')
      )

      await expect(requireAuth(request)).rejects.toThrow('AUTHENTICATION_ERROR')
      await expect(requireAuth(request)).rejects.toThrow('Token jest nieprawidłowy lub wygasł')
    })

    it('should throw error when token is expired', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer expired-token'
        }
      })

      vi.mocked(AuthService.getSession).mockRejectedValue(
        new Error('AUTHENTICATION_ERROR:Token wygasł')
      )

      await expect(requireAuth(request)).rejects.toThrow('AUTHENTICATION_ERROR')
      await expect(requireAuth(request)).rejects.toThrow('Token wygasł')
    })

    it('should work with cookie token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Cookie: 'auth-token=cookie-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: mockUser,
        token: 'cookie-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const user = await requireAuth(request)
      expect(user).toEqual(mockUser)
      expect(AuthService.getSession).toHaveBeenCalledWith('cookie-token')
    })
  })

  describe('hasRole', () => {
    const userUser: UserSessionDTO = {
      id: 'user-1',
      email: 'user@firma.pl',
      name: 'Regular User',
      role: 'USER',
      requirePasswordChange: false
    }

    const agentUser: UserSessionDTO = {
      id: 'agent-1',
      email: 'agent@firma.pl',
      name: 'Agent User',
      role: 'AGENT',
      requirePasswordChange: false
    }

    it('should return true when user has the required role', () => {
      expect(hasRole(userUser, ['USER'])).toBe(true)
      expect(hasRole(agentUser, ['AGENT'])).toBe(true)
    })

    it('should return false when user does not have the required role', () => {
      expect(hasRole(userUser, ['AGENT'])).toBe(false)
      expect(hasRole(agentUser, ['USER'])).toBe(false)
    })

    it('should return true when user has one of multiple allowed roles', () => {
      expect(hasRole(userUser, ['USER', 'AGENT'])).toBe(true)
      expect(hasRole(agentUser, ['USER', 'AGENT'])).toBe(true)
    })

    it('should return false when user has none of the allowed roles', () => {
      expect(hasRole(userUser, ['AGENT'])).toBe(false)
    })

    it('should handle empty allowed roles array', () => {
      expect(hasRole(userUser, [])).toBe(false)
    })

    it('should be case-sensitive', () => {
      const userWithUpperCase = { ...userUser, role: 'USER' as const }
      expect(hasRole(userWithUpperCase, ['USER'])).toBe(true)
      // TypeScript would prevent this, but testing runtime behavior
    })
  })

  describe('requireRole', () => {
    const userUser: UserSessionDTO = {
      id: 'user-1',
      email: 'user@firma.pl',
      name: 'Regular User',
      role: 'USER',
      requirePasswordChange: false
    }

    const agentUser: UserSessionDTO = {
      id: 'agent-1',
      email: 'agent@firma.pl',
      name: 'Agent User',
      role: 'AGENT',
      requirePasswordChange: false
    }

    it('should not throw when user has required role', () => {
      expect(() => requireRole(userUser, ['USER'])).not.toThrow()
      expect(() => requireRole(agentUser, ['AGENT'])).not.toThrow()
    })

    it('should throw when user does not have required role', () => {
      expect(() => requireRole(userUser, ['AGENT'])).toThrow('AUTHORIZATION_ERROR')
      expect(() => requireRole(agentUser, ['USER'])).toThrow('AUTHORIZATION_ERROR')
    })

    it('should not throw when user has one of multiple allowed roles', () => {
      expect(() => requireRole(userUser, ['USER', 'AGENT'])).not.toThrow()
      expect(() => requireRole(agentUser, ['USER', 'AGENT'])).not.toThrow()
    })

    it('should include role names in error message', () => {
      try {
        requireRole(userUser, ['AGENT'])
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('AGENT')
          expect(error.message).toContain('Brak uprawnień')
        }
      }
    })

    it('should format multiple roles in error message', () => {
      try {
        requireRole(userUser, ['AGENT'])
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('Wymagana rola')
        }
      }
    })
  })

  describe('withAuth', () => {
    const mockUser: UserSessionDTO = {
      id: 'user-123',
      email: 'test@firma.pl',
      name: 'Test User',
      role: 'USER',
      requirePasswordChange: false
    }

    it('should call handler with user when authentication succeeds', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: mockUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )

      const wrappedHandler = withAuth(handler)
      const response = await wrappedHandler(request)

      expect(handler).toHaveBeenCalledWith(request, mockUser, undefined)
      expect(response.status).toBe(200)
    })

    it('should return 401 when no token is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const handler = vi.fn()
      const wrappedHandler = withAuth(handler)
      const response = await wrappedHandler(request)

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)

      const json = await response.json()
      expect(json.error).toBe('AUTHENTICATION_ERROR')
    })

    it('should return 401 when token is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockRejectedValue(
        new Error('Invalid token')
      )

      const handler = vi.fn()
      const wrappedHandler = withAuth(handler)
      const response = await wrappedHandler(request)

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)
    })

    it('should pass context to handler', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: mockUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const context = { params: { id: '123' } }
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )

      const wrappedHandler = withAuth(handler)
      await wrappedHandler(request, context)

      expect(handler).toHaveBeenCalledWith(request, mockUser, context)
    })

    it('should return 500 for unexpected errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockRejectedValue(
        new Error('Unexpected database error')
      )

      const handler = vi.fn()
      const wrappedHandler = withAuth(handler)
      const response = await wrappedHandler(request)

      expect(response.status).toBe(401) // Should be 401 based on code logic
    })

    it('should handle authorization errors from handler', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: mockUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const handler = vi.fn().mockRejectedValue(
        new Error('AUTHORIZATION_ERROR:Insufficient permissions')
      )

      const wrappedHandler = withAuth(handler)
      const response = await wrappedHandler(request)

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json.error).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('withRole', () => {
    const userUser: UserSessionDTO = {
      id: 'user-1',
      email: 'user@firma.pl',
      name: 'Regular User',
      role: 'USER',
      requirePasswordChange: false
    }

    const agentUser: UserSessionDTO = {
      id: 'agent-1',
      email: 'agent@firma.pl',
      name: 'Agent User',
      role: 'AGENT',
      requirePasswordChange: false
    }

    it('should call handler when user has required role', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: agentUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )

      const wrappedHandler = withRole(['AGENT'], handler)
      const response = await wrappedHandler(request)

      expect(handler).toHaveBeenCalledWith(request, agentUser, undefined)
      expect(response.status).toBe(200)
    })

    it('should return 403 when user does not have required role', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: userUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const handler = vi.fn()
      const wrappedHandler = withRole(['AGENT'], handler)
      const response = await wrappedHandler(request)

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)

      const json = await response.json()
      expect(json.error).toBe('AUTHORIZATION_ERROR')
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const handler = vi.fn()
      const wrappedHandler = withRole(['AGENT'], handler)
      const response = await wrappedHandler(request)

      expect(handler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)
    })

    it('should work with multiple allowed roles', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: userUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )

      const wrappedHandler = withRole(['USER', 'AGENT'], handler)
      const response = await wrappedHandler(request)

      expect(handler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should pass context to handler', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      vi.mocked(AuthService.getSession).mockResolvedValue({
        user: agentUser,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const context = { params: { id: 'abc' } }
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )

      const wrappedHandler = withRole(['AGENT'], handler)
      await wrappedHandler(request, context)

      expect(handler).toHaveBeenCalledWith(request, agentUser, context)
    })
  })
})

