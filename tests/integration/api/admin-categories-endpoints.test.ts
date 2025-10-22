import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getCategoriesGET } from '@/app/api/admin/categories/route'
import { PATCH as updateCategoryPATCH } from '@/app/api/admin/categories/[categoryId]/route'
import { PATCH as updateSubcategoryPATCH } from '@/app/api/admin/subcategories/[subcategoryId]/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/app/lib/middleware/auth-middleware', () => ({
  withRole: (roles: string[], handler: any) => handler
}))

vi.mock('@/app/lib/services/categories/category-admin.service', () => ({
  CategoryAdminService: {
    getCategoriesWithAgents: vi.fn(),
    updateCategoryDescription: vi.fn(),
    updateSubcategory: vi.fn()
  }
}))

// Helper to create mock NextRequest
function createMockRequest(body?: any): NextRequest {
  return {
    json: async () => body || {},
    headers: new Headers(),
    method: 'PATCH',
    url: 'http://localhost:3000/api/admin/categories',
  } as NextRequest
}

// Mock admin user
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@firma.pl',
  name: 'Admin User',
  role: 'ADMIN'
}

describe('Admin Categories Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/categories', () => {
    it('should return categories with agents and subcategories', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      const mockCategories = [
        {
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
        },
        {
          id: 'cat-2',
          name: 'Software',
          description: null,
          createdAt: '2025-01-02T00:00:00Z',
          subcategories: [],
          agents: []
        }
      ]

      vi.mocked(CategoryAdminService.getCategoriesWithAgents).mockResolvedValue(mockCategories)

      const req = createMockRequest()
      const response = await getCategoriesGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.categories).toHaveLength(2)
      expect(data.data.categories[0].agents).toHaveLength(1)
      expect(data.data.categories[0].subcategories).toHaveLength(1)
      expect(CategoryAdminService.getCategoriesWithAgents).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.getCategoriesWithAgents).mockRejectedValue(
        new Error('DATABASE_ERROR:Connection failed')
      )

      const req = createMockRequest()
      const response = await getCategoriesGET(req, mockAdminUser)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DATABASE_ERROR')
    })
  })

  describe('PATCH /api/admin/categories/:categoryId', () => {
    it('should update category description successfully', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateCategoryDescription).mockResolvedValue(undefined)

      const req = createMockRequest({
        description: 'Updated description'
      })

      const context = {
        params: Promise.resolve({ categoryId: 'cat-1' })
      }

      const response = await updateCategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toContain('zaktualizowana')
      expect(CategoryAdminService.updateCategoryDescription).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({
          description: 'Updated description'
        }),
        mockAdminUser.id
      )
    })

    it('should allow null description', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateCategoryDescription).mockResolvedValue(undefined)

      const req = createMockRequest({
        description: null
      })

      const context = {
        params: Promise.resolve({ categoryId: 'cat-1' })
      }

      const response = await updateCategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(CategoryAdminService.updateCategoryDescription).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({
          description: null
        }),
        mockAdminUser.id
      )
    })

    it('should validate description length', async () => {
      const req = createMockRequest({
        description: 'a'.repeat(501) // too long
      })

      const context = {
        params: Promise.resolve({ categoryId: 'cat-1' })
      }

      const response = await updateCategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should handle NOT_FOUND error', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateCategoryDescription).mockRejectedValue(
        new Error('NOT_FOUND:Kategoria nie istnieje')
      )

      const req = createMockRequest({
        description: 'Updated description'
      })

      const context = {
        params: Promise.resolve({ categoryId: 'nonexistent-cat' })
      }

      const response = await updateCategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NOT_FOUND')
    })

    it('should handle database errors', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateCategoryDescription).mockRejectedValue(
        new Error('DATABASE_ERROR:Connection failed')
      )

      const req = createMockRequest({
        description: 'Updated description'
      })

      const context = {
        params: Promise.resolve({ categoryId: 'cat-1' })
      }

      const response = await updateCategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DATABASE_ERROR')
    })
  })

  describe('PATCH /api/admin/subcategories/:subcategoryId', () => {
    it('should update subcategory successfully', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateSubcategory).mockResolvedValue(undefined)

      const req = createMockRequest({
        name: 'Updated Name',
        description: 'Updated description'
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toContain('zaktualizowana')
      expect(CategoryAdminService.updateSubcategory).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          name: 'Updated Name',
          description: 'Updated description'
        }),
        mockAdminUser.id
      )
    })

    it('should update only name', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateSubcategory).mockResolvedValue(undefined)

      const req = createMockRequest({
        name: 'Updated Name'
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(CategoryAdminService.updateSubcategory).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          name: 'Updated Name'
        }),
        mockAdminUser.id
      )
    })

    it('should update only description', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateSubcategory).mockResolvedValue(undefined)

      const req = createMockRequest({
        description: 'Updated description'
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(CategoryAdminService.updateSubcategory).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          description: 'Updated description'
        }),
        mockAdminUser.id
      )
    })

    it('should validate name length (min 2 chars)', async () => {
      const req = createMockRequest({
        name: 'A' // too short
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should validate name length (max 100 chars)', async () => {
      const req = createMockRequest({
        name: 'a'.repeat(101) // too long
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should validate description length (max 500 chars)', async () => {
      const req = createMockRequest({
        description: 'a'.repeat(501) // too long
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should handle NOT_FOUND error', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateSubcategory).mockRejectedValue(
        new Error('NOT_FOUND:Podkategoria nie istnieje')
      )

      const req = createMockRequest({
        name: 'Updated Name'
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'nonexistent-sub' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('NOT_FOUND')
    })

    it('should handle VALIDATION_ERROR (no data to update)', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateSubcategory).mockRejectedValue(
        new Error('VALIDATION_ERROR:Brak danych do aktualizacji')
      )

      const req = createMockRequest({})

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should handle database errors', async () => {
      const { CategoryAdminService } = await import('@/app/lib/services/categories/category-admin.service')
      
      vi.mocked(CategoryAdminService.updateSubcategory).mockRejectedValue(
        new Error('DATABASE_ERROR:Connection failed')
      )

      const req = createMockRequest({
        name: 'Updated Name'
      })

      const context = {
        params: Promise.resolve({ subcategoryId: 'sub-1' })
      }

      const response = await updateSubcategoryPATCH(req, mockAdminUser, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('DATABASE_ERROR')
    })
  })
})

