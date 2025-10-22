import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserAdminService } from '@/app/lib/services/users/user-admin.service'
import type { CreateUserCommand, UpdateUserCommand } from '@/src/types'

// Mock dependencies
vi.mock('@/app/lib/utils/supabase-auth', () => ({
  createSupabaseAdmin: vi.fn()
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}))

vi.mock('@/app/lib/services/audit-log/audit-log.service', () => ({
  AuditLogService: {
    createLog: vi.fn().mockResolvedValue(undefined)
  }
}))

import { createSupabaseAdmin } from '@/app/lib/utils/supabase-auth'
import bcrypt from 'bcryptjs'
import { AuditLogService } from '@/app/lib/services/audit-log/audit-log.service'

describe('UserAdminService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn()
    }

    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase)
  })

  describe('getAllUsers', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@firma.pl',
        name: 'User One',
        role: 'USER',
        force_password_change: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        ticketsCreated: [{ count: 5 }],
        ticketsAssigned: [{ count: 0 }]
      },
      {
        id: 'agent-1',
        email: 'agent1@firma.pl',
        name: 'Agent One',
        role: 'AGENT',
        force_password_change: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        ticketsCreated: [{ count: 2 }],
        ticketsAssigned: [{ count: 10 }]
      }
    ]

    it('should get all users with statistics', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockUsers, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await UserAdminService.getAllUsers()

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('ticketsCreated'))
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('ticketsAssigned'))
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })

      expect(result).toHaveLength(2)
      expect(result[0].ticketsCreatedCount).toBe(5)
      expect(result[0].ticketsAssignedCount).toBe(0)
      expect(result[1].ticketsCreatedCount).toBe(2)
      expect(result[1].ticketsAssignedCount).toBe(10)
    })

    it('should map database fields to DTO correctly', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockUsers, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await UserAdminService.getAllUsers()

      expect(result[0]).toEqual({
        id: 'user-1',
        email: 'user1@firma.pl',
        name: 'User One',
        role: 'USER',
        forcePasswordChange: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ticketsCreatedCount: 5,
        ticketsAssignedCount: 0
      })
    })

    it('should handle users with no tickets (count 0)', async () => {
      const mockUsersNoTickets = [
        {
          ...mockUsers[0],
          ticketsCreated: [],
          ticketsAssigned: []
        }
      ]

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockUsersNoTickets, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await UserAdminService.getAllUsers()

      expect(result[0].ticketsCreatedCount).toBe(0)
      expect(result[0].ticketsAssignedCount).toBe(0)
    })

    it('should handle empty users list', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await UserAdminService.getAllUsers()

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      await expect(UserAdminService.getAllUsers()).rejects.toThrow('DATABASE_ERROR')
      await expect(UserAdminService.getAllUsers()).rejects.toThrow('Database error')
    })
  })

  describe('createUser', () => {
    const adminUserId = 'admin-123'

    it('should create user successfully', async () => {
      const command: CreateUserCommand = {
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'SecurePass123!'
      }

      const mockNewUser = {
        id: 'new-user-id',
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        force_password_change: true,
        created_at: '2025-01-22T00:00:00Z',
        updated_at: '2025-01-22T00:00:00Z'
      }

      // Mock email check (no existing user)
      const mockSelectExisting = vi.fn().mockReturnThis()
      const mockEqExisting = vi.fn().mockReturnThis()
      const mockSingleExisting = vi.fn().mockResolvedValue({ data: null, error: null })

      // Mock insert new user
      const mockInsert = vi.fn().mockReturnThis()
      const mockSelectNew = vi.fn().mockReturnThis()
      const mockSingleNew = vi.fn().mockResolvedValue({ data: mockNewUser, error: null })

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: check existing email
          return {
            select: mockSelectExisting,
            eq: mockEqExisting,
            single: mockSingleExisting
          }
        } else {
          // Second call: insert new user
          return {
            insert: mockInsert,
            select: mockSelectNew,
            single: mockSingleNew
          }
        }
      })

      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedpassword' as any)

      const result = await UserAdminService.createUser(command, adminUserId)

      // Verify bcrypt was called
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10)

      // Verify insert was called with correct data
      expect(mockInsert).toHaveBeenCalledWith({
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        password: '$2a$10$hashedpassword',
        force_password_change: true
      })

      // Verify audit log was created WITHOUT password
      expect(AuditLogService.createLog).toHaveBeenCalledWith({
        userId: adminUserId,
        action: 'USER_CREATED',
        resourceType: 'user',
        resourceId: 'new-user-id',
        details: {
          email: 'newuser@firma.pl',
          name: 'New User',
          role: 'USER'
          // ❌ NO password field!
        }
      })

      // Verify result
      expect(result).toEqual({
        id: 'new-user-id',
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        forcePasswordChange: true,
        createdAt: '2025-01-22T00:00:00Z',
        updatedAt: '2025-01-22T00:00:00Z',
        ticketsCreatedCount: 0,
        ticketsAssignedCount: 0
      })
    })

    it('should throw VALIDATION_ERROR when email already exists', async () => {
      const command: CreateUserCommand = {
        email: 'existing@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'SecurePass123!'
      }

      const mockSelectExisting = vi.fn().mockReturnThis()
      const mockEqExisting = vi.fn().mockReturnThis()
      const mockSingleExisting = vi.fn().mockResolvedValue({ 
        data: { id: 'existing-user' }, 
        error: null 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelectExisting,
        eq: mockEqExisting,
        single: mockSingleExisting
      })

      await expect(UserAdminService.createUser(command, adminUserId)).rejects.toThrow('VALIDATION_ERROR')
      await expect(UserAdminService.createUser(command, adminUserId)).rejects.toThrow('już istnieje')

      // Should not hash password or create user
      expect(bcrypt.hash).not.toHaveBeenCalled()
      expect(AuditLogService.createLog).not.toHaveBeenCalled()
    })

    it('should always set force_password_change to true for new users', async () => {
      const command: CreateUserCommand = {
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'ADMIN',
        password: 'AdminPass123!'
      }

      const mockNewUser = {
        id: 'new-admin-id',
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'ADMIN',
        force_password_change: true,
        created_at: '2025-01-22T00:00:00Z',
        updated_at: '2025-01-22T00:00:00Z'
      }

      // Mock: no existing user
      const mockSelectExisting = vi.fn().mockReturnThis()
      const mockEqExisting = vi.fn().mockReturnThis()
      const mockSingleExisting = vi.fn().mockResolvedValue({ data: null, error: null })

      // Mock: insert new user
      const mockInsert = vi.fn().mockReturnThis()
      const mockSelectNew = vi.fn().mockReturnThis()
      const mockSingleNew = vi.fn().mockResolvedValue({ data: mockNewUser, error: null })

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return { select: mockSelectExisting, eq: mockEqExisting, single: mockSingleExisting }
        } else {
          return { insert: mockInsert, select: mockSelectNew, single: mockSingleNew }
        }
      })

      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedpassword' as any)

      const result = await UserAdminService.createUser(command, adminUserId)

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          force_password_change: true
        })
      )
      expect(result.forcePasswordChange).toBe(true)
    })

    it('should throw DATABASE_ERROR when insert fails', async () => {
      const command: CreateUserCommand = {
        email: 'newuser@firma.pl',
        name: 'New User',
        role: 'USER',
        password: 'SecurePass123!'
      }

      // Mock: no existing user (first call)
      const mockSelectExisting = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })

      // Mock: insert fails (second call)
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Insert failed' } 
          })
        })
      })

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        if (callCount % 2 === 1) {
          // Odd calls: email check
          return { select: mockSelectExisting }
        } else {
          // Even calls: insert
          return { insert: mockInsert }
        }
      })

      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedpassword' as any)

      await expect(UserAdminService.createUser(command, adminUserId)).rejects.toThrow('DATABASE_ERROR')
    })
  })

  describe('updateUser', () => {
    const userId = 'user-123'
    const adminUserId = 'admin-456'

    it('should update user successfully', async () => {
      const command: UpdateUserCommand = {
        name: 'Updated Name',
        role: 'AGENT',
        forcePasswordChange: true
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await UserAdminService.updateUser(userId, command, adminUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Name',
        role: 'AGENT',
        force_password_change: true
      })
      expect(mockEq).toHaveBeenCalledWith('id', userId)

      // Verify audit log
      expect(AuditLogService.createLog).toHaveBeenCalledWith({
        userId: adminUserId,
        action: 'USER_UPDATED',
        resourceType: 'user',
        resourceId: userId,
        details: {
          name: 'Updated Name',
          role: 'AGENT',
          force_password_change: true
        }
      })
    })

    it('should update only provided fields', async () => {
      const command: UpdateUserCommand = {
        name: 'Updated Name'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await UserAdminService.updateUser(userId, command, adminUserId)

      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Name'
      })
    })

    it('should throw FORBIDDEN when admin tries to change own role', async () => {
      const command: UpdateUserCommand = {
        role: 'USER'
      }

      await expect(
        UserAdminService.updateUser(adminUserId, command, adminUserId)
      ).rejects.toThrow('FORBIDDEN')
      await expect(
        UserAdminService.updateUser(adminUserId, command, adminUserId)
      ).rejects.toThrow('Nie możesz zmienić własnej roli')

      // Should not update database
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should allow admin to change own name (not role)', async () => {
      const command: UpdateUserCommand = {
        name: 'Updated Admin Name'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await UserAdminService.updateUser(adminUserId, command, adminUserId)

      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Admin Name'
      })
    })

    it('should throw VALIDATION_ERROR when no data to update', async () => {
      const command: UpdateUserCommand = {}

      await expect(
        UserAdminService.updateUser(userId, command, adminUserId)
      ).rejects.toThrow('VALIDATION_ERROR')
      await expect(
        UserAdminService.updateUser(userId, command, adminUserId)
      ).rejects.toThrow('Brak danych do aktualizacji')

      // Should not call database
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      const command: UpdateUserCommand = {
        name: 'Updated Name'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ 
        error: { code: 'PGRST116', message: 'Not found' } 
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await expect(
        UserAdminService.updateUser(userId, command, adminUserId)
      ).rejects.toThrow('NOT_FOUND')
      await expect(
        UserAdminService.updateUser(userId, command, adminUserId)
      ).rejects.toThrow('Użytkownik nie istnieje')
    })

    it('should throw DATABASE_ERROR for other database errors', async () => {
      const command: UpdateUserCommand = {
        name: 'Updated Name'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ 
        error: { message: 'Connection failed' } 
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await expect(
        UserAdminService.updateUser(userId, command, adminUserId)
      ).rejects.toThrow('DATABASE_ERROR')
      await expect(
        UserAdminService.updateUser(userId, command, adminUserId)
      ).rejects.toThrow('Connection failed')
    })
  })

  describe('forcePasswordReset', () => {
    const userId = 'user-123'
    const adminUserId = 'admin-456'

    it('should force password reset successfully', async () => {
      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await UserAdminService.forcePasswordReset(userId, adminUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockUpdate).toHaveBeenCalledWith({ force_password_change: true })
      expect(mockEq).toHaveBeenCalledWith('id', userId)

      // Verify audit log
      expect(AuditLogService.createLog).toHaveBeenCalledWith({
        userId: adminUserId,
        action: 'USER_PASSWORD_RESET',
        resourceType: 'user',
        resourceId: userId
      })
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ 
        error: { code: 'PGRST116', message: 'Not found' } 
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await expect(
        UserAdminService.forcePasswordReset(userId, adminUserId)
      ).rejects.toThrow('NOT_FOUND')
      await expect(
        UserAdminService.forcePasswordReset(userId, adminUserId)
      ).rejects.toThrow('Użytkownik nie istnieje')
    })

    it('should throw DATABASE_ERROR for other database errors', async () => {
      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ 
        error: { message: 'Connection failed' } 
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await expect(
        UserAdminService.forcePasswordReset(userId, adminUserId)
      ).rejects.toThrow('DATABASE_ERROR')
      await expect(
        UserAdminService.forcePasswordReset(userId, adminUserId)
      ).rejects.toThrow('Connection failed')
    })
  })
})

