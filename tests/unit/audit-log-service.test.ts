import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditLogService } from '@/app/lib/services/audit-log/audit-log.service'
import type { CreateAuditLogCommand, GetAuditLogsParams } from '@/src/types'

// Mock Supabase
vi.mock('@/app/lib/utils/supabase-auth', () => ({
  createSupabaseAdmin: vi.fn()
}))

import { createSupabaseAdmin } from '@/app/lib/utils/supabase-auth'

describe('AuditLogService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn()
    }

    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase)
  })

  describe('createLog', () => {
    it('should create audit log successfully', async () => {
      const command: CreateAuditLogCommand = {
        userId: 'user-123',
        action: 'USER_LOGIN',
        resourceType: 'user',
        resourceId: 'user-123',
        details: { email: 'test@firma.pl' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      }

      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      await AuditLogService.createLog(command)

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        action: 'USER_LOGIN',
        resource_type: 'user',
        resource_id: 'user-123',
        details: { email: 'test@firma.pl' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0'
      })
    })

    it('should handle null optional fields', async () => {
      const command: CreateAuditLogCommand = {
        action: 'USER_LOGOUT'
      }

      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      await AuditLogService.createLog(command)

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: 'USER_LOGOUT',
        resource_type: null,
        resource_id: null,
        details: null,
        ip_address: null,
        user_agent: null
      })
    })

    it('should not throw error when insert fails (graceful degradation)', async () => {
      const command: CreateAuditLogCommand = {
        userId: 'user-123',
        action: 'USER_LOGIN'
      }

      const mockInsert = vi.fn().mockResolvedValue({ 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      // Should not throw - audit logging should not block operations
      await expect(AuditLogService.createLog(command)).resolves.toBeUndefined()
    })

    it('should log error to console when insert fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const command: CreateAuditLogCommand = {
        userId: 'user-123',
        action: 'USER_LOGIN'
      }

      const mockInsert = vi.fn().mockResolvedValue({ 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      await AuditLogService.createLog(command)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AuditLog] Failed to create log:',
        expect.objectContaining({ message: 'Database error' })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getLogs', () => {
    const mockLogs = [
      {
        id: 'log-1',
        user_id: 'user-123',
        action: 'USER_LOGIN',
        resource_type: 'user',
        resource_id: 'user-123',
        details: { email: 'test@firma.pl' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2025-01-22T10:00:00Z',
        user: { name: 'Test User' }
      },
      {
        id: 'log-2',
        user_id: 'user-456',
        action: 'USER_CREATED',
        resource_type: 'user',
        resource_id: 'user-789',
        details: { email: 'new@firma.pl', role: 'USER' },
        ip_address: '192.168.1.2',
        user_agent: 'Chrome/100',
        created_at: '2025-01-22T11:00:00Z',
        user: { name: 'Admin User' }
      }
    ]

    it('should get logs with default pagination', async () => {
      const params: GetAuditLogsParams = {}

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: mockLogs, 
        error: null,
        count: 2
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('user:users!audit_logs_user_id_fkey(name)'),
        { count: 'exact' }
      )
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockRange).toHaveBeenCalledWith(0, 49) // default page 1, limit 50

      expect(result.logs).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
        hasMore: false
      })
    })

    it('should filter by userId', async () => {
      const params: GetAuditLogsParams = {
        userId: 'user-123'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: [mockLogs[0]], 
        error: null,
        count: 1
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result.logs).toHaveLength(1)
    })

    it('should filter by action', async () => {
      const params: GetAuditLogsParams = {
        action: 'USER_LOGIN'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: [mockLogs[0]], 
        error: null,
        count: 1
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(mockEq).toHaveBeenCalledWith('action', 'USER_LOGIN')
      expect(result.logs).toHaveLength(1)
    })

    it('should filter by date range', async () => {
      const params: GetAuditLogsParams = {
        startDate: '2025-01-22T00:00:00Z',
        endDate: '2025-01-22T23:59:59Z'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockGte = vi.fn().mockReturnThis()
      const mockLte = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: mockLogs, 
        error: null,
        count: 2
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        gte: mockGte,
        lte: mockLte,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(mockGte).toHaveBeenCalledWith('created_at', '2025-01-22T00:00:00Z')
      expect(mockLte).toHaveBeenCalledWith('created_at', '2025-01-22T23:59:59Z')
      expect(result.logs).toHaveLength(2)
    })

    it('should handle pagination correctly', async () => {
      const params: GetAuditLogsParams = {
        page: 2,
        limit: 10
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: mockLogs, 
        error: null,
        count: 25
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(mockRange).toHaveBeenCalledWith(10, 19) // page 2: from 10 to 19
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasMore: true
      })
    })

    it('should map database fields to DTO correctly', async () => {
      const params: GetAuditLogsParams = {}

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: mockLogs, 
        error: null,
        count: 2
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(result.logs[0]).toEqual({
        id: 'log-1',
        userId: 'user-123',
        userName: 'Test User',
        action: 'USER_LOGIN',
        resourceType: 'user',
        resourceId: 'user-123',
        details: { email: 'test@firma.pl' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: '2025-01-22T10:00:00Z'
      })
    })

    it('should handle null user (system actions)', async () => {
      const mockSystemLog = {
        ...mockLogs[0],
        user_id: null,
        user: null
      }

      const params: GetAuditLogsParams = {}

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: [mockSystemLog], 
        error: null,
        count: 1
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(result.logs[0].userId).toBeNull()
      expect(result.logs[0].userName).toBeNull()
    })

    it('should handle empty logs', async () => {
      const params: GetAuditLogsParams = {}

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: [], 
        error: null,
        count: 0
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange
      })

      const result = await AuditLogService.getLogs(params)

      expect(result.logs).toEqual([])
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })

    it('should throw error when database query fails', async () => {
      const params: GetAuditLogsParams = {}

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockRange = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' },
        count: null
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        range: mockRange
      })

      await expect(AuditLogService.getLogs(params)).rejects.toThrow('DATABASE_ERROR')
      await expect(AuditLogService.getLogs(params)).rejects.toThrow('Database error')
    })
  })

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1'
        }
      })

      const ip = AuditLogService.getClientIp(request)

      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is missing', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.1'
        }
      })

      const ip = AuditLogService.getClientIp(request)

      expect(ip).toBe('192.168.1.1')
    })

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1'
        }
      })

      const ip = AuditLogService.getClientIp(request)

      expect(ip).toBe('192.168.1.1')
    })

    it('should return null when no IP headers present', () => {
      const request = new Request('http://localhost')

      const ip = AuditLogService.getClientIp(request)

      expect(ip).toBeNull()
    })

    it('should handle multiple IPs in x-forwarded-for (get first one)', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  ,  10.0.0.1  ,  172.16.0.1  '
        }
      })

      const ip = AuditLogService.getClientIp(request)

      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('getUserAgent', () => {
    it('should extract user agent from header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      })

      const userAgent = AuditLogService.getUserAgent(request)

      expect(userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    })

    it('should return null when user-agent header is missing', () => {
      const request = new Request('http://localhost')

      const userAgent = AuditLogService.getUserAgent(request)

      expect(userAgent).toBeNull()
    })
  })
})

