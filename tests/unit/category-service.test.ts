import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CategoryService } from '@/app/lib/services/categories'

// Mock Supabase
vi.mock('@/app/lib/utils/supabase-auth', () => ({
  createSupabaseAdmin: vi.fn()
}))

import { createSupabaseAdmin } from '@/app/lib/utils/supabase-auth'

describe('CategoryService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn()
    }

    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase)
  })

  describe('getCategories', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Hardware',
        description: 'Hardware issues',
        created_at: '2025-01-01T00:00:00Z',
        subcategories: [
          { id: 'sub-1', name: 'Komputer/Laptop', category_id: 'cat-1' },
          { id: 'sub-2', name: 'Drukarka', category_id: 'cat-1' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Software',
        description: 'Software issues',
        created_at: '2025-01-02T00:00:00Z',
        subcategories: [
          { id: 'sub-3', name: 'Instalacja programu', category_id: 'cat-2' }
        ]
      }
    ]

    it('should return all categories with subcategories by default', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories()

      expect(mockSupabase.from).toHaveBeenCalledWith('categories')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('subcategories'))
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })

      expect(result.categories).toHaveLength(2)
      expect(result.categories[0].subcategories).toHaveLength(2)
      expect(result.categories[1].subcategories).toHaveLength(1)
    })

    it('should return categories with subcategories when includeSubcategories is true', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories(true)

      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('subcategories'))
      expect(result.categories[0]).toHaveProperty('subcategories')
      expect(result.categories[0].subcategories.length).toBeGreaterThan(0)
    })

    it('should return categories without subcategories when includeSubcategories is false', async () => {
      const mockCategoriesWithoutSubs = [
        {
          id: 'cat-1',
          name: 'Hardware',
          description: 'Hardware issues',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 'cat-2',
          name: 'Software',
          description: 'Software issues',
          created_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategoriesWithoutSubs, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories(false)

      expect(mockSelect).toHaveBeenCalledWith('id, name, description, created_at')
      expect(mockSelect).toHaveBeenCalledWith(expect.not.stringContaining('subcategories'))
      
      expect(result.categories).toHaveLength(2)
      expect(result.categories[0].subcategories).toEqual([])
      expect(result.categories[1].subcategories).toEqual([])
    })

    it('should map database fields to DTO correctly', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories()

      expect(result.categories[0]).toEqual({
        id: 'cat-1',
        name: 'Hardware',
        description: 'Hardware issues',
        createdAt: '2025-01-01T00:00:00Z',
        subcategories: [
          { id: 'sub-1', name: 'Komputer/Laptop', categoryId: 'cat-1' },
          { id: 'sub-2', name: 'Drukarka', categoryId: 'cat-1' }
        ]
      })
    })

    it('should order categories by name ascending', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      await CategoryService.getCategories()

      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should handle empty categories list', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories()

      expect(result.categories).toEqual([])
    })

    it('should handle null data response', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories()

      expect(result.categories).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Connection failed' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      await expect(CategoryService.getCategories()).rejects.toThrow('DATABASE_ERROR')
      await expect(CategoryService.getCategories()).rejects.toThrow('Connection failed')
    })

    it('should handle categories with no subcategories', async () => {
      const mockCategoriesNoSubs = [
        {
          id: 'cat-1',
          name: 'Hardware',
          description: 'Hardware issues',
          created_at: '2025-01-01T00:00:00Z',
          subcategories: []
        }
      ]

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategoriesNoSubs, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories()

      expect(result.categories[0].subcategories).toEqual([])
    })

    it('should handle categories with null subcategories', async () => {
      const mockCategoriesNullSubs = [
        {
          id: 'cat-1',
          name: 'Hardware',
          description: 'Hardware issues',
          created_at: '2025-01-01T00:00:00Z',
          subcategories: null
        }
      ]

      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockCategoriesNullSubs, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder
      })

      const result = await CategoryService.getCategories()

      expect(result.categories[0].subcategories).toEqual([])
    })
  })

  describe('getCategoryById', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Hardware',
      description: 'Hardware issues',
      created_at: '2025-01-01T00:00:00Z',
      subcategories: [
        { id: 'sub-1', name: 'Komputer/Laptop', category_id: 'cat-1' },
        { id: 'sub-2', name: 'Drukarka', category_id: 'cat-1' }
      ]
    }

    it('should return category by ID with subcategories by default', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCategory, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.getCategoryById(categoryId)

      expect(mockSupabase.from).toHaveBeenCalledWith('categories')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('subcategories'))
      expect(mockEq).toHaveBeenCalledWith('id', categoryId)

      expect(result.id).toBe('cat-1')
      expect(result.subcategories).toHaveLength(2)
    })

    it('should return category with subcategories when includeSubcategories is true', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCategory, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.getCategoryById(categoryId, true)

      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('subcategories'))
      expect(result.subcategories.length).toBeGreaterThan(0)
    })

    it('should return category without subcategories when includeSubcategories is false', async () => {
      const categoryId = 'cat-1'
      const mockCategoryNoSubs = {
        id: 'cat-1',
        name: 'Hardware',
        description: 'Hardware issues',
        created_at: '2025-01-01T00:00:00Z'
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCategoryNoSubs, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.getCategoryById(categoryId, false)

      expect(mockSelect).toHaveBeenCalledWith('id, name, description, created_at')
      expect(result.subcategories).toEqual([])
    })

    it('should throw NOT_FOUND error when category does not exist', async () => {
      const categoryId = 'nonexistent-category'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      await expect(CategoryService.getCategoryById(categoryId)).rejects.toThrow('NOT_FOUND')
      await expect(CategoryService.getCategoryById(categoryId)).rejects.toThrow('nie została znaleziona')
    })

    it('should map database fields to DTO correctly', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCategory, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.getCategoryById(categoryId)

      expect(result).toEqual({
        id: 'cat-1',
        name: 'Hardware',
        description: 'Hardware issues',
        createdAt: '2025-01-01T00:00:00Z',
        subcategories: [
          { id: 'sub-1', name: 'Komputer/Laptop', categoryId: 'cat-1' },
          { id: 'sub-2', name: 'Drukarka', categoryId: 'cat-1' }
        ]
      })
    })

    it('should handle null subcategories', async () => {
      const categoryId = 'cat-1'
      const mockCategoryNullSubs = {
        ...mockCategory,
        subcategories: null
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCategoryNullSubs, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.getCategoryById(categoryId)

      expect(result.subcategories).toEqual([])
    })
  })

  describe('getSubcategoriesByCategoryId', () => {
    const mockSubcategories = [
      { id: 'sub-1', name: 'Komputer/Laptop', category_id: 'cat-1' },
      { id: 'sub-2', name: 'Drukarka', category_id: 'cat-1' },
      { id: 'sub-3', name: 'Monitor', category_id: 'cat-1' }
    ]

    it('should return all subcategories for a category', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockSubcategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      })

      const result = await CategoryService.getSubcategoriesByCategoryId(categoryId)

      expect(mockSupabase.from).toHaveBeenCalledWith('subcategories')
      expect(mockSelect).toHaveBeenCalledWith('id, name, category_id')
      expect(mockEq).toHaveBeenCalledWith('category_id', categoryId)
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })

      expect(result).toHaveLength(3)
    })

    it('should order subcategories by name ascending', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockSubcategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      })

      await CategoryService.getSubcategoriesByCategoryId(categoryId)

      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should map database fields to DTO correctly', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockSubcategories, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      })

      const result = await CategoryService.getSubcategoriesByCategoryId(categoryId)

      expect(result[0]).toEqual({
        id: 'sub-1',
        name: 'Komputer/Laptop',
        categoryId: 'cat-1'
      })
    })

    it('should return empty array when category has no subcategories', async () => {
      const categoryId = 'cat-empty'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      })

      const result = await CategoryService.getSubcategoriesByCategoryId(categoryId)

      expect(result).toEqual([])
    })

    it('should handle null data response', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      })

      const result = await CategoryService.getSubcategoriesByCategoryId(categoryId)

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const categoryId = 'cat-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      })

      await expect(CategoryService.getSubcategoriesByCategoryId(categoryId))
        .rejects.toThrow('DATABASE_ERROR')
      await expect(CategoryService.getSubcategoriesByCategoryId(categoryId))
        .rejects.toThrow('Database error')
    })
  })

  describe('subcategoryExists', () => {
    it('should return true when subcategory exists', async () => {
      const subcategoryId = 'sub-1'
      const mockSubcategory = { id: 'sub-1' }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockSubcategory, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.subcategoryExists(subcategoryId)

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('subcategories')
      expect(mockSelect).toHaveBeenCalledWith('id')
      expect(mockEq).toHaveBeenCalledWith('id', subcategoryId)
    })

    it('should return false when subcategory does not exist', async () => {
      const subcategoryId = 'nonexistent-sub'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.subcategoryExists(subcategoryId)

      expect(result).toBe(false)
    })

    it('should return false when error occurs', async () => {
      const subcategoryId = 'sub-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: { id: 'sub-1' }, 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.subcategoryExists(subcategoryId)

      expect(result).toBe(false)
    })
  })

  describe('getCategoryBySubcategoryId', () => {
    it('should return category for given subcategory', async () => {
      const subcategoryId = 'sub-1'
      const mockData = {
        category_id: 'cat-1',
        categories: {
          id: 'cat-1',
          name: 'Hardware'
        }
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      const result = await CategoryService.getCategoryBySubcategoryId(subcategoryId)

      expect(mockSupabase.from).toHaveBeenCalledWith('subcategories')
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('categories'))
      expect(mockEq).toHaveBeenCalledWith('id', subcategoryId)

      expect(result).toEqual({
        id: 'cat-1',
        name: 'Hardware'
      })
    })

    it('should throw NOT_FOUND error when subcategory does not exist', async () => {
      const subcategoryId = 'nonexistent-sub'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      await expect(CategoryService.getCategoryBySubcategoryId(subcategoryId))
        .rejects.toThrow('NOT_FOUND')
      await expect(CategoryService.getCategoryBySubcategoryId(subcategoryId))
        .rejects.toThrow('Podkategoria nie została znaleziona')
    })

    it('should throw NOT_FOUND error when category data is missing', async () => {
      const subcategoryId = 'sub-orphan'
      const mockData = {
        category_id: 'cat-1',
        categories: null
      }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      await expect(CategoryService.getCategoryBySubcategoryId(subcategoryId))
        .rejects.toThrow('NOT_FOUND')
    })

    it('should handle database errors', async () => {
      const subcategoryId = 'sub-1'

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      })

      await expect(CategoryService.getCategoryBySubcategoryId(subcategoryId))
        .rejects.toThrow('NOT_FOUND')
    })
  })
})

