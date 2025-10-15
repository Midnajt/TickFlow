/**
 * Vitest Setup File
 * 
 * Global configuration and mocks for all tests.
 * This file runs before any test suite.
 */

import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup React Testing Library after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks() // Clear all mock call history
})

// Mock environment variables
// Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Auth & JWT
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'

// External APIs
process.env.OPENROUTER_API_KEY = 'test-openrouter-key'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, ...rest } = props
    return { type: 'img', props: { src, alt, ...rest } }
  },
}))

// Global test utilities
global.fetch = vi.fn()

