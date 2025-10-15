import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthService } from '@/app/lib/services/auth'
import type { LoginCommand, ChangePasswordCommand } from '@/src/types'

// Mock dependencies
vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn()
}))

vi.mock('jose', () => ({
  SignJWT: vi.fn(),
  jwtVerify: vi.fn()
}))

vi.mock('@/app/lib/supabase-server', () => ({
  supabaseServer: {
    from: vi.fn()
  }
}))

import { compare, hash } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { supabaseServer } from '@/app/lib/supabase-server'

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests'
  })

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@firma.pl',
      name: 'Test User',
      role: 'USER',
      password: '$2a$10$hashedpassword',
      force_password_change: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    it('should successfully login with valid credentials', async () => {
      const command: LoginCommand = {
        email: 'test@firma.pl',
        password: 'Test123!'
      }

      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      // Mock bcrypt compare
      vi.mocked(compare).mockResolvedValue(true as never)

      // Mock JWT sign
      const mockToken = 'mock-jwt-token'
      const mockSign = vi.fn().mockResolvedValue(mockToken)
      const mockSetExpirationTime = vi.fn().mockReturnValue({ sign: mockSign })
      const mockSetIssuedAt = vi.fn().mockReturnValue({ setExpirationTime: mockSetExpirationTime })
      const mockSetProtectedHeader = vi.fn().mockReturnValue({ setIssuedAt: mockSetIssuedAt })
      
      vi.mocked(SignJWT).mockImplementation(() => ({
        setProtectedHeader: mockSetProtectedHeader
      } as any))

      const result = await AuthService.login(command)

      // Verify result structure
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('session')
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        passwordResetRequired: false
      })
      expect(result.session.token).toBe(mockToken)
      expect(result.session.expiresAt).toBeDefined()

      // Verify calls
      expect(supabaseServer.from).toHaveBeenCalledWith('users')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('email', command.email)
      expect(compare).toHaveBeenCalledWith(command.password, mockUser.password)
    })

    it('should throw error when user not found', async () => {
      const command: LoginCommand = {
        email: 'nonexistent@firma.pl',
        password: 'Test123!'
      }

      // Mock Supabase query - user not found
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      await expect(AuthService.login(command)).rejects.toThrow('Nieprawidłowy email lub hasło')
    })

    it('should throw error when password is incorrect', async () => {
      const command: LoginCommand = {
        email: 'test@firma.pl',
        password: 'WrongPassword123!'
      }

      // Mock Supabase query - user found
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      // Mock bcrypt compare - password doesn't match
      vi.mocked(compare).mockResolvedValue(false as never)

      await expect(AuthService.login(command)).rejects.toThrow('Nieprawidłowy email lub hasło')
      
      expect(compare).toHaveBeenCalledWith(command.password, mockUser.password)
    })

    it('should include passwordResetRequired when force_password_change is true', async () => {
      const command: LoginCommand = {
        email: 'test@firma.pl',
        password: 'Test123!'
      }

      const userWithPasswordReset = {
        ...mockUser,
        force_password_change: true
      }

      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: userWithPasswordReset, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      vi.mocked(compare).mockResolvedValue(true as never)

      const mockToken = 'mock-jwt-token'
      const mockSign = vi.fn().mockResolvedValue(mockToken)
      const mockSetExpirationTime = vi.fn().mockReturnValue({ sign: mockSign })
      const mockSetIssuedAt = vi.fn().mockReturnValue({ setExpirationTime: mockSetExpirationTime })
      const mockSetProtectedHeader = vi.fn().mockReturnValue({ setIssuedAt: mockSetIssuedAt })
      
      vi.mocked(SignJWT).mockImplementation(() => ({
        setProtectedHeader: mockSetProtectedHeader
      } as any))

      const result = await AuthService.login(command)

      expect(result.user.passwordResetRequired).toBe(true)
    })

    it('should generate JWT with correct payload', async () => {
      const command: LoginCommand = {
        email: 'test@firma.pl',
        password: 'Test123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      vi.mocked(compare).mockResolvedValue(true as never)

      const mockToken = 'mock-jwt-token'
      const mockSign = vi.fn().mockResolvedValue(mockToken)
      const mockSetExpirationTime = vi.fn().mockReturnValue({ sign: mockSign })
      const mockSetIssuedAt = vi.fn().mockReturnValue({ setExpirationTime: mockSetExpirationTime })
      const mockSetProtectedHeader = vi.fn().mockReturnValue({ setIssuedAt: mockSetIssuedAt })
      
      let capturedPayload: any
      vi.mocked(SignJWT).mockImplementation((payload) => {
        capturedPayload = payload
        return {
          setProtectedHeader: mockSetProtectedHeader
        } as any
      })

      await AuthService.login(command)

      // Verify JWT payload
      expect(capturedPayload).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      })

      // Verify JWT configuration
      expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' })
      expect(mockSetExpirationTime).toHaveBeenCalledWith('7d')
    })

    it('should set expiration date to 7 days from now', async () => {
      const command: LoginCommand = {
        email: 'test@firma.pl',
        password: 'Test123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      vi.mocked(compare).mockResolvedValue(true as never)

      const mockToken = 'mock-jwt-token'
      const mockSign = vi.fn().mockResolvedValue(mockToken)
      const mockSetExpirationTime = vi.fn().mockReturnValue({ sign: mockSign })
      const mockSetIssuedAt = vi.fn().mockReturnValue({ setExpirationTime: mockSetExpirationTime })
      const mockSetProtectedHeader = vi.fn().mockReturnValue({ setIssuedAt: mockSetIssuedAt })
      
      vi.mocked(SignJWT).mockImplementation(() => ({
        setProtectedHeader: mockSetProtectedHeader
      } as any))

      const beforeLogin = new Date()
      const result = await AuthService.login(command)
      const afterLogin = new Date()

      const expiresAt = new Date(result.session.expiresAt)
      const expectedMin = new Date(beforeLogin)
      expectedMin.setDate(expectedMin.getDate() + 7)
      const expectedMax = new Date(afterLogin)
      expectedMax.setDate(expectedMax.getDate() + 7)

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000) // 1s tolerance
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000)
    })

    it('should handle database errors gracefully', async () => {
      const command: LoginCommand = {
        email: 'test@firma.pl',
        password: 'Test123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      await expect(AuthService.login(command)).rejects.toThrow('AUTHENTICATION_ERROR')
    })
  })

  describe('changePassword', () => {
    const userId = 'user-123'
    const mockUser = {
      id: userId,
      email: 'test@firma.pl',
      name: 'Test User',
      role: 'USER',
      password: '$2a$10$currenthashedpassword',
      force_password_change: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    it('should successfully change password with valid current password', async () => {
      const command: ChangePasswordCommand = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      // Mock Supabase select query
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      // Mock Supabase update query
      const mockUpdate = vi.fn().mockReturnThis()
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })

      let callCount = 0
      vi.mocked(supabaseServer.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: select user
          return {
            select: mockSelect,
            eq: mockEq,
            single: mockSingle
          } as any
        } else {
          // Second call: update password
          return {
            update: mockUpdate,
            eq: mockUpdateEq
          } as any
        }
      })

      // Mock bcrypt
      vi.mocked(compare).mockResolvedValue(true as never)
      vi.mocked(hash).mockResolvedValue('$2a$10$newhashedpassword' as never)

      const result = await AuthService.changePassword(userId, command)

      expect(result.message).toContain('pomyślnie')
      expect(result.passwordResetRequired).toBe(false)

      // Verify calls
      expect(compare).toHaveBeenCalledWith(command.currentPassword, mockUser.password)
      expect(hash).toHaveBeenCalledWith(command.newPassword, 10)
      expect(mockUpdate).toHaveBeenCalledWith({
        password: '$2a$10$newhashedpassword',
        force_password_change: false
      })
    })

    it('should throw error when user not found', async () => {
      const command: ChangePasswordCommand = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      await expect(AuthService.changePassword('nonexistent-user', command))
        .rejects.toThrow('Użytkownik nie został znaleziony')
    })

    it('should throw error when current password is incorrect', async () => {
      const command: ChangePasswordCommand = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      vi.mocked(compare).mockResolvedValue(false as never)

      await expect(AuthService.changePassword(userId, command))
        .rejects.toThrow('Aktualne hasło jest nieprawidłowe')
      
      expect(compare).toHaveBeenCalledWith(command.currentPassword, mockUser.password)
    })

    it('should set force_password_change to false after successful password change', async () => {
      const command: ChangePasswordCommand = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      const mockUpdate = vi.fn().mockReturnThis()
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })

      let callCount = 0
      vi.mocked(supabaseServer.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return { select: mockSelect, eq: mockEq, single: mockSingle } as any
        } else {
          return { update: mockUpdate, eq: mockUpdateEq } as any
        }
      })

      vi.mocked(compare).mockResolvedValue(true as never)
      vi.mocked(hash).mockResolvedValue('$2a$10$newhashedpassword' as never)

      await AuthService.changePassword(userId, command)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          force_password_change: false
        })
      )
    })

    it('should use BCRYPT_ROUNDS constant (10) for hashing', async () => {
      const command: ChangePasswordCommand = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      const mockUpdate = vi.fn().mockReturnThis()
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })

      let callCount = 0
      vi.mocked(supabaseServer.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return { select: mockSelect, eq: mockEq, single: mockSingle } as any
        } else {
          return { update: mockUpdate, eq: mockUpdateEq } as any
        }
      })

      vi.mocked(compare).mockResolvedValue(true as never)
      vi.mocked(hash).mockResolvedValue('$2a$10$newhashedpassword' as never)

      await AuthService.changePassword(userId, command)

      expect(hash).toHaveBeenCalledWith(command.newPassword, 10)
    })

    it('should throw error when database update fails', async () => {
      const command: ChangePasswordCommand = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      const mockUpdate = vi.fn().mockReturnThis()
      const mockUpdateEq = vi.fn().mockResolvedValue({ 
        error: { message: 'Update failed' } 
      })

      let callCount = 0
      vi.mocked(supabaseServer.from).mockImplementation((table: string) => {
        callCount++
        if (callCount === 1) {
          // First call: select user - return the full chain
          return { 
            select: mockSelect, 
            eq: mockEq, 
            single: mockSingle 
          } as any
        } else {
          // Second call: update password - return the full chain
          return { 
            update: mockUpdate, 
            eq: mockUpdateEq 
          } as any
        }
      })

      vi.mocked(compare).mockResolvedValue(true as never)
      vi.mocked(hash).mockResolvedValue('$2a$10$newhashedpassword' as never)

      await expect(AuthService.changePassword(userId, command))
        .rejects.toThrow('INTERNAL_ERROR')
    })
  })

  describe('getSession', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@firma.pl',
      name: 'Test User',
      role: 'USER',
      password: '$2a$10$hashedpassword',
      force_password_change: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    it('should return session for valid token', async () => {
      const token = 'valid-jwt-token'

      // Mock jwtVerify
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        },
        protectedHeader: { alg: 'HS256' }
      } as any)

      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      const result = await AuthService.getSession(token)

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        passwordResetRequired: false
      })

      expect(jwtVerify).toHaveBeenCalledWith(token, expect.anything())
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id)
    })

    it('should throw error for invalid token', async () => {
      const token = 'invalid-jwt-token'

      vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid token'))

      await expect(AuthService.getSession(token))
        .rejects.toThrow('Token jest nieprawidłowy lub wygasł')
    })

    it('should throw error when user from token not found in database', async () => {
      const token = 'valid-token-but-user-deleted'

      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          userId: 'deleted-user-id',
          email: 'deleted@firma.pl',
          role: 'USER'
        },
        protectedHeader: { alg: 'HS256' }
      } as any)

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      await expect(AuthService.getSession(token))
        .rejects.toThrow('Sesja użytkownika jest nieprawidłowa')
    })

    it('should return current user data from database, not from token', async () => {
      const token = 'valid-jwt-token'

      // Token has old name
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        },
        protectedHeader: { alg: 'HS256' }
      } as any)

      // Database has updated name
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedUser, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      const result = await AuthService.getSession(token)

      expect(result.user.name).toBe('Updated Name')
    })

    it('should include passwordResetRequired from database', async () => {
      const token = 'valid-jwt-token'

      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        },
        protectedHeader: { alg: 'HS256' }
      } as any)

      const userWithPasswordReset = {
        ...mockUser,
        force_password_change: true
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: userWithPasswordReset, error: null })
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      const result = await AuthService.getSession(token)

      expect(result.user.passwordResetRequired).toBe(true)
    })

    it('should re-throw AUTHENTICATION_ERROR as-is', async () => {
      const token = 'valid-token'

      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          userId: 'user-123',
          email: 'test@firma.pl',
          role: 'USER'
        },
        protectedHeader: { alg: 'HS256' }
      } as any)

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockRejectedValue(
        new Error('AUTHENTICATION_ERROR:Custom auth error')
      )
      
      vi.mocked(supabaseServer.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      } as any)

      await expect(AuthService.getSession(token))
        .rejects.toThrow('AUTHENTICATION_ERROR:Custom auth error')
    })
  })

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await AuthService.logout()

      expect(result.message).toContain('wylogowano')
    })

    it('should be stateless (no database operations)', async () => {
      await AuthService.logout()

      // Verify no database calls were made
      expect(supabaseServer.from).not.toHaveBeenCalled()
    })
  })
})

