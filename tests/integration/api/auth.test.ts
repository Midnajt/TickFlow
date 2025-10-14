import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

// Mock AuthService
vi.mock('@/app/lib/services/auth', () => ({
  AuthService: {
    login: vi.fn(),
  },
}))

// Mock rate limiter
vi.mock('@/app/lib/middleware/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => null),
  addRateLimitHeaders: vi.fn(),
}))

// Helper function to create mock NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: new Headers(),
    method: 'POST',
    url: 'http://localhost:3000/api/auth/login',
  } as NextRequest
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 for invalid request body', async () => {
    const req = createMockRequest({
      email: 'invalid-email',
      password: '',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should return 401 for invalid credentials', async () => {
    const { AuthService } = await import('@/app/lib/services/auth')
    
    // Mock AuthService to throw authentication error
    vi.mocked(AuthService.login).mockRejectedValue(
      new Error('AUTHENTICATION_ERROR:Nieprawidłowy email lub hasło')
    )

    const req = createMockRequest({
      email: 'test@firma.pl',
      password: 'wrongpassword',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('AUTHENTICATION_ERROR')
    expect(AuthService.login).toHaveBeenCalledWith({
      email: 'test@firma.pl',
      password: 'wrongpassword',
    })
  })
})

