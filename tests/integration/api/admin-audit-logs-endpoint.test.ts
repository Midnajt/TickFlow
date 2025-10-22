import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getAuditLogsGET } from '@/app/api/admin/audit-logs/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/app/lib/middleware/auth-middleware', () => ({
  withRole: (roles: string[], handler: any) => handler
}))

vi.mock('@/app/lib/services/audit-log/audit-log.service', () => ({
  AuditLogService: {
    getLogs: vi.fn()
  }
}))

// Helper to create mock NextRequest with query params
function createMockRequest(queryParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/admin/audit-logs')
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return {
    url: url.toString(),
    headers: new Headers(),
    method: 'GET',
  } as NextRequest
}

// Mock admin user
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@firma.pl',
  name: 'Admin User',
  role: 'ADMIN'
}

describe('Admin Audit Logs Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/audit-logs', () => {
    const mockLogs = [
      {
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
      },
      {
        id: 'log-2',
        userId: 'admin-123',
        userName: 'Admin User',
        action: 'USER_CREATED',
        resourceType: 'user',
        resourceId: 'new-user-id',
        details: { email: 'new@firma.pl', role: 'USER' },
        ipAddress: '192.168.1.2',
        userAgent: 'Chrome/100',
        createdAt: '2025-01-22T11:00:00Z'
      }
    ]

    const mockPagination = {
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
      hasMore: false
    }

    it('should return audit logs with default pagination', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: mockLogs,
        pagination: mockPagination
      })

      const req = createMockRequest()
      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.logs).toHaveLength(2)
      expect(data.data.pagination).toEqual(mockPagination)
      expect(AuditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 50
        })
      )
    })

    it('should filter by userId', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: [mockLogs[0]],
        pagination: { ...mockPagination, total: 1 }
      })

      const req = createMockRequest({
        userId: 'user-123'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.logs).toHaveLength(1)
      expect(AuditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123'
        })
      )
    })

    it('should filter by action', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: [mockLogs[0]],
        pagination: { ...mockPagination, total: 1 }
      })

      const req = createMockRequest({
        action: 'USER_LOGIN'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AuditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_LOGIN'
        })
      )
    })

    it('should filter by date range', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: mockLogs,
        pagination: mockPagination
      })

      const req = createMockRequest({
        startDate: '2025-01-22T00:00:00Z',
        endDate: '2025-01-22T23:59:59Z'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AuditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-01-22T00:00:00Z',
          endDate: '2025-01-22T23:59:59Z'
        })
      )
    })

    it('should handle custom pagination', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: mockLogs,
        pagination: {
          page: 2,
          limit: 25,
          total: 50,
          totalPages: 2,
          hasMore: false
        }
      })

      const req = createMockRequest({
        page: '2',
        limit: '25'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AuditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 25
        })
      )
    })

    it('should combine multiple filters', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: [mockLogs[0]],
        pagination: { ...mockPagination, total: 1 }
      })

      const req = createMockRequest({
        userId: 'user-123',
        action: 'USER_LOGIN',
        startDate: '2025-01-22T00:00:00Z',
        endDate: '2025-01-22T23:59:59Z',
        page: '1',
        limit: '10'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AuditLogService.getLogs).toHaveBeenCalledWith({
        userId: 'user-123',
        action: 'USER_LOGIN',
        startDate: '2025-01-22T00:00:00Z',
        endDate: '2025-01-22T23:59:59Z',
        page: 1,
        limit: 10
      })
    })

    it('should validate invalid userId (not UUID)', async () => {
      const req = createMockRequest({
        userId: 'not-a-uuid'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should validate invalid action', async () => {
      const req = createMockRequest({
        action: 'INVALID_ACTION'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should validate invalid datetime format', async () => {
      const req = createMockRequest({
        startDate: '2025-01-22' // missing time
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should validate page less than 1', async () => {
      const req = createMockRequest({
        page: '0'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should validate limit greater than 100', async () => {
      const req = createMockRequest({
        limit: '101'
      })

      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should handle empty logs', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      })

      const req = createMockRequest()
      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.logs).toEqual([])
      expect(data.data.pagination.total).toBe(0)
    })

    it('should handle database errors', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockRejectedValue(
        new Error('DATABASE_ERROR:Connection failed')
      )

      const req = createMockRequest()
      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DATABASE_ERROR')
    })

    it('should handle undefined query parameters gracefully', async () => {
      const { AuditLogService } = await import('@/app/lib/services/audit-log/audit-log.service')
      
      vi.mocked(AuditLogService.getLogs).mockResolvedValue({
        logs: mockLogs,
        pagination: mockPagination
      })

      const req = createMockRequest()
      const response = await getAuditLogsGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AuditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 50
        })
      )
    })
  })
})

