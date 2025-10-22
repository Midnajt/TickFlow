import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CategoryAdminService } from '@/app/lib/services/categories/category-admin.service'
import type { UpdateCategoryCommand, UpdateSubcategoryCommand } from '@/src/types'

// Mock dependencies
vi.mock('@/app/lib/utils/supabase-auth', () => ({
  createSupabaseAdmin: vi.fn()
}))

vi.mock('@/app/lib/services/audit-log/audit-log.service', () => ({
  AuditLogService: {
    createLog: vi.fn().mockResolvedValue(undefined)
  }
}))

import { createSupabaseAdmin } from '@/app/lib/utils/supabase-auth'
import { AuditLogService } from '@/app/lib/services/audit-log/audit-log.service'

describe('CategoryAdminService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn()
    }

    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase)
  })

  describe('getCategoriesWithAgents', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Hardware',
        description: 'Hardware issues',
        created_at: '2025-01-01T00:00:00Z',
        subcategories: [
          { id: 'sub-1', name: 'Komputer', category_id: 'cat-1', description: 'Computer issues' }
        ],
        agent_categories: [
          {
            id: 'ac-1',
            created_at: '2025-01-01T00:00:00Z',
            agent: {
              id: 'agent-1',
              name: 'Agent One',
              email: 'agent1@firma.pl'
            }
          }
        ]
      },
      {
        id: 'cat-2',
        name: 'Software',
        description: null,
        created_at: '2025-01-02T00:00:00Z',
        subcategories: [],
        agent_categories: []
      }
    ]

    it('should get all categories with agents and subcategories', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryAdminService.getCategoriesWithAgents()

      expect(mockSupabase.from).toHaveBeenCalledWith('categories')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('subcategories'))
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('agent_categories'))
      expect(mockOrder).toHaveBeenCalledWith('name')

      expect(result).toHaveLength(2)
      expect(result[0].agents).toHaveLength(1)
      expect(result[0].subcategories).toHaveLength(1)
      expect(result[1].agents).toHaveLength(0)
    })

    it('should map database fields to DTO correctly', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryAdminService.getCategoriesWithAgents()

      expect(result[0]).toEqual({
        id: 'cat-1',
        name: 'Hardware',
        description: 'Hardware issues',
        createdAt: '2025-01-01T00:00:00Z',
        subcategories: [
          { id: 'sub-1', name: 'Komputer', categoryId: 'cat-1', description: 'Computer issues' }
        ],
        agents: [
          {
            id: 'agent-1',
            name: 'Agent One',
            email: 'agent1@firma.pl',
            assignedAt: '2025-01-01T00:00:00Z'
          }
        ]
      })
    })

    it('should handle categories with no agents', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryAdminService.getCategoriesWithAgents()

      expect(result[1].agents).toEqual([])
    })

    it('should handle categories with no subcategories', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryAdminService.getCategoriesWithAgents()

      expect(result[1].subcategories).toEqual([])
    })

    it('should handle null subcategories and agent_categories', async () => {
      const mockCategoriesNull = [
        {
          ...mockCategories[0],
          subcategories: null,
          agent_categories: null
        }
      ]

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategoriesNull, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryAdminService.getCategoriesWithAgents()

      expect(result[0].subcategories).toEqual([])
      expect(result[0].agents).toEqual([])
    })

    it('should handle empty categories list', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryAdminService.getCategoriesWithAgents()

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

      await expect(CategoryAdminService.getCategoriesWithAgents()).rejects.toThrow('DATABASE_ERROR')
      await expect(CategoryAdminService.getCategoriesWithAgents()).rejects.toThrow('Database error')
    })
  })

  describe('updateCategoryDescription', () => {
    const categoryId = 'cat-1'
    const adminUserId = 'admin-123'

    it('should update category description successfully', async () => {
      const command: UpdateCategoryCommand = {
        description: 'Updated description'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await CategoryAdminService.updateCategoryDescription(categoryId, command, adminUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('categories')
      expect(mockUpdate).toHaveBeenCalledWith({ description: 'Updated description' })
      expect(mockEq).toHaveBeenCalledWith('id', categoryId)

      // Verify audit log was created
      expect(AuditLogService.createLog).toHaveBeenCalledWith({
        userId: adminUserId,
        action: 'CATEGORY_UPDATED',
        resourceType: 'category',
        resourceId: categoryId,
        details: { description: 'Updated description' }
      })
    })

    it('should handle null description', async () => {
      const command: UpdateCategoryCommand = {
        description: null
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await CategoryAdminService.updateCategoryDescription(categoryId, command, adminUserId)

      expect(mockUpdate).toHaveBeenCalledWith({ description: null })
    })

    it('should throw NOT_FOUND error when category does not exist', async () => {
      const command: UpdateCategoryCommand = {
        description: 'Updated description'
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
        CategoryAdminService.updateCategoryDescription(categoryId, command, adminUserId)
      ).rejects.toThrow('NOT_FOUND')
      await expect(
        CategoryAdminService.updateCategoryDescription(categoryId, command, adminUserId)
      ).rejects.toThrow('Kategoria nie istnieje')

      // Audit log should not be created when operation fails
      expect(AuditLogService.createLog).not.toHaveBeenCalled()
    })

    it('should throw DATABASE_ERROR for other database errors', async () => {
      const command: UpdateCategoryCommand = {
        description: 'Updated description'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ 
        error: { message: 'Database connection failed' } 
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await expect(
        CategoryAdminService.updateCategoryDescription(categoryId, command, adminUserId)
      ).rejects.toThrow('DATABASE_ERROR')
      await expect(
        CategoryAdminService.updateCategoryDescription(categoryId, command, adminUserId)
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('updateSubcategory', () => {
    const subcategoryId = 'sub-1'
    const adminUserId = 'admin-123'

    it('should update subcategory name and description', async () => {
      const command: UpdateSubcategoryCommand = {
        name: 'Updated Name',
        description: 'Updated description'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('subcategories')
      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Name',
        description: 'Updated description'
      })
      expect(mockEq).toHaveBeenCalledWith('id', subcategoryId)

      // Verify audit log was created
      expect(AuditLogService.createLog).toHaveBeenCalledWith({
        userId: adminUserId,
        action: 'SUBCATEGORY_UPDATED',
        resourceType: 'subcategory',
        resourceId: subcategoryId,
        details: {
          name: 'Updated Name',
          description: 'Updated description'
        }
      })
    })

    it('should update only name when description is not provided', async () => {
      const command: UpdateSubcategoryCommand = {
        name: 'Updated Name'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)

      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Name'
      })
    })

    it('should update only description when name is not provided', async () => {
      const command: UpdateSubcategoryCommand = {
        description: 'Updated description'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)

      expect(mockUpdate).toHaveBeenCalledWith({
        description: 'Updated description'
      })
    })

    it('should handle null description', async () => {
      const command: UpdateSubcategoryCommand = {
        description: null
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      })

      await CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)

      expect(mockUpdate).toHaveBeenCalledWith({
        description: null
      })
    })

    it('should throw VALIDATION_ERROR when no data to update', async () => {
      const command: UpdateSubcategoryCommand = {}

      await expect(
        CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)
      ).rejects.toThrow('VALIDATION_ERROR')
      await expect(
        CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)
      ).rejects.toThrow('Brak danych do aktualizacji')

      // Should not call database or create audit log
      expect(mockSupabase.from).not.toHaveBeenCalled()
      expect(AuditLogService.createLog).not.toHaveBeenCalled()
    })

    it('should throw NOT_FOUND error when subcategory does not exist', async () => {
      const command: UpdateSubcategoryCommand = {
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
        CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)
      ).rejects.toThrow('NOT_FOUND')
      await expect(
        CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)
      ).rejects.toThrow('Podkategoria nie istnieje')
    })

    it('should throw DATABASE_ERROR for other database errors', async () => {
      const command: UpdateSubcategoryCommand = {
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
        CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)
      ).rejects.toThrow('DATABASE_ERROR')
      await expect(
        CategoryAdminService.updateSubcategory(subcategoryId, command, adminUserId)
      ).rejects.toThrow('Connection failed')
    })
  })
})

