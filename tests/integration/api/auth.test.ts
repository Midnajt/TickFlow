import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { createMocks } from 'node-mocks-http'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 for invalid request body', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: '',
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should return 401 for invalid credentials', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@firma.pl',
        password: 'wrongpassword',
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid credentials')
  })
})

