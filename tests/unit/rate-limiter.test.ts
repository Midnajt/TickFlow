import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { checkRateLimit, addRateLimitHeaders } from '@/app/lib/middleware/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow first request from IP', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const result = checkRateLimit(request)
      expect(result).toBeNull() // null means allowed
    })

    it('should allow multiple requests under the limit', () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.1.2'
          }
        })

      // Should allow up to 5 requests (MAX_REQUESTS = 5)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(createRequest())
        expect(result).toBeNull()
      }
    })

    it('should block requests exceeding the limit', async () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.1.3'
          }
        })

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(createRequest())
      }

      // 6th request should be blocked
      const result = checkRateLimit(createRequest())
      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)

      const json = await result?.json()
      expect(json.error).toBe('RATE_LIMIT_EXCEEDED')
      expect(json.message).toContain('Zbyt wiele prób')
    })

    it('should include retry-after header when rate limited', async () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.1.4'
          }
        })

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(createRequest())
      }

      const result = checkRateLimit(createRequest())
      expect(result).not.toBeNull()

      const retryAfter = result?.headers.get('Retry-After')
      expect(retryAfter).toBeDefined()
      expect(parseInt(retryAfter || '0')).toBeGreaterThan(0)
    })

    it('should include rate limit headers when blocked', async () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.1.5'
          }
        })

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(createRequest())
      }

      const result = checkRateLimit(createRequest())
      expect(result).not.toBeNull()

      expect(result?.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(result?.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should reset limit after time window', () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.1.6'
          }
        })

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(createRequest())
      }

      // Should be blocked
      let result = checkRateLimit(createRequest())
      expect(result).not.toBeNull()

      // Advance time by 61 seconds (> 60 second window)
      vi.advanceTimersByTime(61 * 1000)

      // Should be allowed again
      result = checkRateLimit(createRequest())
      expect(result).toBeNull()
    })

    it('should track different IPs separately', () => {
      const request1 = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.7'
        }
      })

      const request2 = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.8'
        }
      })

      // Exhaust limit for IP 1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(request1)
      }

      // IP 1 should be blocked
      expect(checkRateLimit(request1)).not.toBeNull()

      // IP 2 should still be allowed
      expect(checkRateLimit(request2)).toBeNull()
    })

    it('should handle x-real-ip header when x-forwarded-for is not present', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-real-ip': '10.0.0.1'
        }
      })

      const result = checkRateLimit(request)
      expect(result).toBeNull()
    })

    it('should use first IP from x-forwarded-for when multiple IPs present', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.10, 192.168.1.11, 192.168.1.12'
        }
      })

      // Should use first IP (192.168.1.10)
      const result = checkRateLimit(request)
      expect(result).toBeNull()

      // Make multiple requests to verify same IP is tracked
      for (let i = 0; i < 4; i++) {
        checkRateLimit(request)
      }

      // 6th request should be blocked (same IP)
      const blocked = checkRateLimit(request)
      expect(blocked).not.toBeNull()
    })

    it('should fallback to localhost when no IP headers present', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login')

      const result = checkRateLimit(request)
      expect(result).toBeNull()
    })

    it('should handle concurrent requests from same IP', () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.1.20'
          }
        })

      // Simulate concurrent requests
      const results = []
      for (let i = 0; i < 7; i++) {
        results.push(checkRateLimit(createRequest()))
      }

      // First 5 should be allowed
      expect(results.slice(0, 5).every(r => r === null)).toBe(true)

      // Last 2 should be blocked
      expect(results.slice(5).every(r => r !== null)).toBe(true)
    })

    it('should calculate correct retry-after time', async () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.1.21'
          }
        })

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(createRequest())
      }

      const result = checkRateLimit(createRequest())
      const json = await result?.json()

      expect(json.retryAfter).toBeDefined()
      expect(json.retryAfter).toBeGreaterThan(0)
      expect(json.retryAfter).toBeLessThanOrEqual(60) // Should be within the 60s window
    })

    it('should handle trimmed IP addresses from x-forwarded-for', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '  192.168.1.22  , 192.168.1.23  '
        }
      })

      const result = checkRateLimit(request)
      expect(result).toBeNull()

      // Make more requests to verify IP is correctly trimmed and tracked
      for (let i = 0; i < 4; i++) {
        checkRateLimit(request)
      }

      const blocked = checkRateLimit(request)
      expect(blocked).not.toBeNull()
    })
  })

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.2.1'
        }
      })

      // Make a request to create an entry
      checkRateLimit(request)

      const response = new Response(JSON.stringify({ success: true }), {
        status: 200
      })
      const nextResponse = new Response(response.body, response)

      const result = addRateLimitHeaders(
        nextResponse as any,
        request
      )

      expect(result.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(result.headers.get('X-RateLimit-Remaining')).toBe('4') // 5 - 1 = 4
      expect(result.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should show decreasing remaining count', () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.2.2'
          }
        })

      const createResponse = () =>
        new Response(JSON.stringify({ success: true }), { status: 200 })

      // First request
      let request = createRequest()
      checkRateLimit(request)
      let response = addRateLimitHeaders(createResponse() as any, request)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')

      // Second request
      request = createRequest()
      checkRateLimit(request)
      response = addRateLimitHeaders(createResponse() as any, request)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('3')

      // Third request
      request = createRequest()
      checkRateLimit(request)
      response = addRateLimitHeaders(createResponse() as any, request)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('2')
    })

    it('should not have negative remaining count', () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.2.3'
          }
        })

      const createResponse = () =>
        new Response(JSON.stringify({ success: true }), { status: 200 })

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        checkRateLimit(createRequest())
      }

      const request = createRequest()
      const response = addRateLimitHeaders(createResponse() as any, request)

      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
      expect(remaining).toBeGreaterThanOrEqual(0)
    })

    it('should handle response for IP with no rate limit entry', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.2.100'
        }
      })

      const response = new Response(JSON.stringify({ success: true }), {
        status: 200
      })

      const result = addRateLimitHeaders(response as any, request)

      // Should not crash, headers might not be set
      expect(result).toBeDefined()
    })

    it('should preserve existing response headers', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.2.4'
        }
      })

      checkRateLimit(request)

      const response = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value'
        }
      })

      const result = addRateLimitHeaders(response as any, request)

      expect(result.headers.get('Content-Type')).toBe('application/json')
      expect(result.headers.get('X-Custom-Header')).toBe('custom-value')
      expect(result.headers.get('X-RateLimit-Limit')).toBe('5')
    })

    it('should format reset time as ISO string', () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.2.5'
        }
      })

      checkRateLimit(request)

      const response = new Response(JSON.stringify({ success: true }), {
        status: 200
      })

      const result = addRateLimitHeaders(response as any, request)

      const resetHeader = result.headers.get('X-RateLimit-Reset')
      expect(resetHeader).toBeDefined()

      // Should be a valid ISO date string
      const resetDate = new Date(resetHeader!)
      expect(resetDate.toString()).not.toBe('Invalid Date')
      expect(resetDate.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete flow: requests -> block -> wait -> reset', async () => {
      const createRequest = () =>
        new NextRequest('http://localhost:3000/api/auth/login', {
          headers: {
            'x-forwarded-for': '192.168.3.1'
          }
        })

      // Phase 1: Make requests up to limit
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(createRequest())
        expect(result).toBeNull()
      }

      // Phase 2: Get blocked
      const blocked = checkRateLimit(createRequest())
      expect(blocked).not.toBeNull()
      expect(blocked?.status).toBe(429)

      // Phase 3: Wait for reset
      vi.advanceTimersByTime(61 * 1000)

      // Phase 4: Should work again
      const afterReset = checkRateLimit(createRequest())
      expect(afterReset).toBeNull()
    })

    it('should handle multiple IPs with different usage patterns', () => {
      const ip1Requests = Array(3)
        .fill(null)
        .map(() =>
          new NextRequest('http://localhost:3000/api/auth/login', {
            headers: { 'x-forwarded-for': '192.168.3.10' }
          })
        )

      const ip2Requests = Array(5)
        .fill(null)
        .map(() =>
          new NextRequest('http://localhost:3000/api/auth/login', {
            headers: { 'x-forwarded-for': '192.168.3.11' }
          })
        )

      // IP1: 3 requests (under limit)
      ip1Requests.forEach(req => {
        expect(checkRateLimit(req)).toBeNull()
      })

      // IP2: 5 requests (at limit)
      ip2Requests.forEach(req => {
        expect(checkRateLimit(req)).toBeNull()
      })

      // IP1: Still has room
      expect(checkRateLimit(ip1Requests[0])).toBeNull()

      // IP2: Should be blocked
      expect(checkRateLimit(ip2Requests[0])).not.toBeNull()
    })
  })
})

