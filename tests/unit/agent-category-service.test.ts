import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentCategoryService } from '@/app/lib/services/agent-categories'

// Mock Supabase
vi.mock('@/app/lib/utils/supabase-auth', () => ({
  createSupabaseAdmin: vi.fn()
}))

import { createSupabaseAdmin } from '@/app/lib/utils/supabase-auth'

describe('AgentCategoryService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      from: vi.fn()
    }

    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase)
  })

  describe('getAgentCategories', () => {
    const agentId = 'agent-123'
    const mockAgent = { id: agentId, role: 'AGENT' }
    const mockAgentCategories = [
      {
        id: 'ac-1',
        agent_id: agentId,
        category_id: 'cat-1',
        created_at: '2025-01-01T00:00:00Z',
        categories: {
          id: 'cat-1',
          name: 'Hardware'
        }
      },
      {
        id: 'ac-2',
        agent_id: agentId,
        category_id: 'cat-2',
        created_at: '2025-01-02T00:00:00Z',
        categories: {
          id: 'cat-2',
          name: 'Software'
        }
      }
    ]

    it('should return agent categories when agent exists and has AGENT role', async () => {
      // First call: verify agent
      const mockSelectAgent = vi.fn().mockReturnThis()
      const mockEqAgent = vi.fn().mockReturnThis()
      const mockSingleAgent = vi.fn().mockResolvedValue({ data: mockAgent, error: null })

      // Second call: get categories
      const mockSelectCategories = vi.fn().mockReturnThis()
      const mockEqCategories = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockAgentCategories, error: null })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'users') {
          return {
            select: mockSelectAgent,
            eq: mockEqAgent,
            single: mockSingleAgent
          }
        } else {
          return {
            select: mockSelectCategories,
            eq: mockEqCategories,
            order: mockOrder
          }
        }
      })

      const result = await AgentCategoryService.getAgentCategories(agentId)

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_categories')
      expect(mockEqAgent).toHaveBeenNthCalledWith(1, 'id', agentId)
      expect(mockEqAgent).toHaveBeenNthCalledWith(2, 'role', 'AGENT')
      expect(mockEqCategories).toHaveBeenCalledWith('agent_id', agentId)

      expect(result.agentCategories).toHaveLength(2)
      expect(result.agentCategories[0]).toEqual({
        id: 'ac-1',
        userId: agentId,
        categoryId: 'cat-1',
        category: {
          id: 'cat-1',
          name: 'Hardware'
        },
        createdAt: '2025-01-01T00:00:00Z'
      })
    })

    it('should throw NOT_FOUND error when agent does not exist', async () => {
      const mockSelectAgent = vi.fn().mockReturnThis()
      const mockEqAgent = vi.fn().mockReturnThis()
      const mockSingleAgent = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })

      mockSupabase.from.mockReturnValue({
        select: mockSelectAgent,
        eq: mockEqAgent,
        single: mockSingleAgent
      })

      await expect(AgentCategoryService.getAgentCategories('nonexistent-agent'))
        .rejects.toThrow('NOT_FOUND')
      await expect(AgentCategoryService.getAgentCategories('nonexistent-agent'))
        .rejects.toThrow('Agent nie został znaleziony lub nie ma roli AGENT')
    })

    it('should throw NOT_FOUND error when user is not an agent', async () => {
      const nonAgentUser = { id: 'user-123', role: 'USER' }
      
      const mockSelectAgent = vi.fn().mockReturnThis()
      const mockEqAgent = vi.fn().mockReturnThis()
      const mockSingleAgent = vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows found' } })

      mockSupabase.from.mockReturnValue({
        select: mockSelectAgent,
        eq: mockEqAgent,
        single: mockSingleAgent
      })

      await expect(AgentCategoryService.getAgentCategories('user-123'))
        .rejects.toThrow('NOT_FOUND')
    })

    it('should order categories by created_at ascending', async () => {
      const mockSelectAgent = vi.fn().mockReturnThis()
      const mockEqAgent = vi.fn().mockReturnThis()
      const mockSingleAgent = vi.fn().mockResolvedValue({ data: mockAgent, error: null })

      const mockSelectCategories = vi.fn().mockReturnThis()
      const mockEqCategories = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockAgentCategories, error: null })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'users') {
          return { select: mockSelectAgent, eq: mockEqAgent, single: mockSingleAgent }
        } else {
          return { select: mockSelectCategories, eq: mockEqCategories, order: mockOrder }
        }
      })

      await AgentCategoryService.getAgentCategories(agentId)

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('should return empty array when agent has no category assignments', async () => {
      const mockSelectAgent = vi.fn().mockReturnThis()
      const mockEqAgent = vi.fn().mockReturnThis()
      const mockSingleAgent = vi.fn().mockResolvedValue({ data: mockAgent, error: null })

      const mockSelectCategories = vi.fn().mockReturnThis()
      const mockEqCategories = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'users') {
          return { select: mockSelectAgent, eq: mockEqAgent, single: mockSingleAgent }
        } else {
          return { select: mockSelectCategories, eq: mockEqCategories, order: mockOrder }
        }
      })

      const result = await AgentCategoryService.getAgentCategories(agentId)

      expect(result.agentCategories).toEqual([])
    })

    it('should handle null data response', async () => {
      const mockSelectAgent = vi.fn().mockReturnThis()
      const mockEqAgent = vi.fn().mockReturnThis()
      const mockSingleAgent = vi.fn().mockResolvedValue({ data: mockAgent, error: null })

      const mockSelectCategories = vi.fn().mockReturnThis()
      const mockEqCategories = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'users') {
          return { select: mockSelectAgent, eq: mockEqAgent, single: mockSingleAgent }
        } else {
          return { select: mockSelectCategories, eq: mockEqCategories, order: mockOrder }
        }
      })

      const result = await AgentCategoryService.getAgentCategories(agentId)

      expect(result.agentCategories).toEqual([])
    })

    it('should throw DATABASE_ERROR when query fails', async () => {
      const mockSelectAgent = vi.fn().mockReturnThis()
      const mockEqAgent = vi.fn().mockReturnThis()
      const mockSingleAgent = vi.fn().mockResolvedValue({ data: mockAgent, error: null })

      const mockSelectCategories = vi.fn().mockReturnThis()
      const mockEqCategories = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'users') {
          return { select: mockSelectAgent, eq: mockEqAgent, single: mockSingleAgent }
        } else {
          return { select: mockSelectCategories, eq: mockEqCategories, order: mockOrder }
        }
      })

      await expect(AgentCategoryService.getAgentCategories(agentId))
        .rejects.toThrow('DATABASE_ERROR')
      await expect(AgentCategoryService.getAgentCategories(agentId))
        .rejects.toThrow('Database error')
    })
  })

  describe('getAgentsByCategory', () => {
    const categoryId = 'cat-1'
    const mockCategory = { id: categoryId }
    const mockAgents = [
      {
        created_at: '2025-01-01T00:00:00Z',
        users: {
          id: 'agent-1',
          name: 'Agent One',
          email: 'agent1@firma.pl'
        }
      },
      {
        created_at: '2025-01-02T00:00:00Z',
        users: {
          id: 'agent-2',
          name: 'Agent Two',
          email: 'agent2@firma.pl'
        }
      }
    ]

    it('should return agents for given category', async () => {
      // First call: verify category
      const mockSelectCategory = vi.fn().mockReturnThis()
      const mockEqCategory = vi.fn().mockReturnThis()
      const mockSingleCategory = vi.fn().mockResolvedValue({ data: mockCategory, error: null })

      // Second call: get agents
      const mockSelectAgents = vi.fn().mockReturnThis()
      const mockEqAgents = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockAgents, error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'categories') {
          return {
            select: mockSelectCategory,
            eq: mockEqCategory,
            single: mockSingleCategory
          }
        } else {
          return {
            select: mockSelectAgents,
            eq: mockEqAgents,
            order: mockOrder
          }
        }
      })

      const result = await AgentCategoryService.getAgentsByCategory(categoryId)

      expect(mockSupabase.from).toHaveBeenCalledWith('categories')
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_categories')
      expect(mockEqCategory).toHaveBeenCalledWith('id', categoryId)
      expect(mockEqAgents).toHaveBeenCalledWith('category_id', categoryId)

      expect(result.agents).toHaveLength(2)
      expect(result.agents[0]).toEqual({
        id: 'agent-1',
        name: 'Agent One',
        email: 'agent1@firma.pl',
        assignedAt: '2025-01-01T00:00:00Z'
      })
    })

    it('should throw NOT_FOUND error when category does not exist', async () => {
      const mockSelectCategory = vi.fn().mockReturnThis()
      const mockEqCategory = vi.fn().mockReturnThis()
      const mockSingleCategory = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelectCategory,
        eq: mockEqCategory,
        single: mockSingleCategory
      })

      await expect(AgentCategoryService.getAgentsByCategory('nonexistent-cat'))
        .rejects.toThrow('NOT_FOUND')
      await expect(AgentCategoryService.getAgentsByCategory('nonexistent-cat'))
        .rejects.toThrow('Kategoria nie została znaleziona')
    })

    it('should order agents by created_at ascending', async () => {
      const mockSelectCategory = vi.fn().mockReturnThis()
      const mockEqCategory = vi.fn().mockReturnThis()
      const mockSingleCategory = vi.fn().mockResolvedValue({ data: mockCategory, error: null })

      const mockSelectAgents = vi.fn().mockReturnThis()
      const mockEqAgents = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: mockAgents, error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'categories') {
          return { select: mockSelectCategory, eq: mockEqCategory, single: mockSingleCategory }
        } else {
          return { select: mockSelectAgents, eq: mockEqAgents, order: mockOrder }
        }
      })

      await AgentCategoryService.getAgentsByCategory(categoryId)

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('should return empty array when category has no agents', async () => {
      const mockSelectCategory = vi.fn().mockReturnThis()
      const mockEqCategory = vi.fn().mockReturnThis()
      const mockSingleCategory = vi.fn().mockResolvedValue({ data: mockCategory, error: null })

      const mockSelectAgents = vi.fn().mockReturnThis()
      const mockEqAgents = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'categories') {
          return { select: mockSelectCategory, eq: mockEqCategory, single: mockSingleCategory }
        } else {
          return { select: mockSelectAgents, eq: mockEqAgents, order: mockOrder }
        }
      })

      const result = await AgentCategoryService.getAgentsByCategory(categoryId)

      expect(result.agents).toEqual([])
    })

    it('should throw DATABASE_ERROR when query fails', async () => {
      const mockSelectCategory = vi.fn().mockReturnThis()
      const mockEqCategory = vi.fn().mockReturnThis()
      const mockSingleCategory = vi.fn().mockResolvedValue({ data: mockCategory, error: null })

      const mockSelectAgents = vi.fn().mockReturnThis()
      const mockEqAgents = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'categories') {
          return { select: mockSelectCategory, eq: mockEqCategory, single: mockSingleCategory }
        } else {
          return { select: mockSelectAgents, eq: mockEqAgents, order: mockOrder }
        }
      })

      await expect(AgentCategoryService.getAgentsByCategory(categoryId))
        .rejects.toThrow('DATABASE_ERROR')
    })
  })

  describe('hasAccessToCategory', () => {
    const agentId = 'agent-123'
    const categoryId = 'cat-1'

    it('should return true when agent has access to category', async () => {
      const mockAssignment = { id: 'ac-1' }

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq1 = vi.fn().mockReturnThis()
      const mockEq2 = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockAssignment, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq1,
        single: mockSingle
      })

      // Override eq to return mockEq2 on second call
      mockEq1.eq = vi.fn().mockReturnValue(mockEq2)
      mockEq2.single = mockSingle

      const result = await AgentCategoryService.hasAccessToCategory(agentId, categoryId)

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_categories')
      expect(mockSelect).toHaveBeenCalledWith('id')
    })

    it('should return false when agent does not have access to category', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq1 = vi.fn().mockReturnThis()
      const mockEq2 = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq1,
        single: mockSingle
      })

      mockEq1.eq = vi.fn().mockReturnValue(mockEq2)
      mockEq2.single = mockSingle

      const result = await AgentCategoryService.hasAccessToCategory(agentId, categoryId)

      expect(result).toBe(false)
    })

    it('should return false when database query fails', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq1 = vi.fn().mockReturnThis()
      const mockEq2 = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: { id: 'ac-1' }, 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq1,
        single: mockSingle
      })

      mockEq1.eq = vi.fn().mockReturnValue(mockEq2)
      mockEq2.single = mockSingle

      const result = await AgentCategoryService.hasAccessToCategory(agentId, categoryId)

      expect(result).toBe(false)
    })
  })

  describe('getAgentCategoryIds', () => {
    const agentId = 'agent-123'
    const mockAssignments = [
      { category_id: 'cat-1' },
      { category_id: 'cat-2' },
      { category_id: 'cat-3' }
    ]

    it('should return array of category IDs for agent', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ data: mockAssignments, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq
      })

      const result = await AgentCategoryService.getAgentCategoryIds(agentId)

      expect(mockSupabase.from).toHaveBeenCalledWith('agent_categories')
      expect(mockSelect).toHaveBeenCalledWith('category_id')
      expect(mockEq).toHaveBeenCalledWith('agent_id', agentId)

      expect(result).toEqual(['cat-1', 'cat-2', 'cat-3'])
    })

    it('should return empty array when agent has no categories', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq
      })

      const result = await AgentCategoryService.getAgentCategoryIds(agentId)

      expect(result).toEqual([])
    })

    it('should handle null data response', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq
      })

      const result = await AgentCategoryService.getAgentCategoryIds(agentId)

      expect(result).toEqual([])
    })

    it('should throw DATABASE_ERROR when query fails', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq
      })

      await expect(AgentCategoryService.getAgentCategoryIds(agentId))
        .rejects.toThrow('DATABASE_ERROR')
    })
  })

  describe('hasAccessToTicket', () => {
    const agentId = 'agent-123'
    const subcategoryId = 'sub-1'
    const categoryId = 'cat-1'

    it('should return true when agent has access to ticket category', async () => {
      // First call: get category from subcategory
      const mockSelectSub = vi.fn().mockReturnThis()
      const mockEqSub = vi.fn().mockReturnThis()
      const mockSingleSub = vi.fn().mockResolvedValue({ 
        data: { category_id: categoryId }, 
        error: null 
      })

      // Second call: check agent access
      const mockSelectAccess = vi.fn().mockReturnThis()
      const mockEq1 = vi.fn().mockReturnThis()
      const mockEq2 = vi.fn().mockReturnThis()
      const mockSingleAccess = vi.fn().mockResolvedValue({ 
        data: { id: 'ac-1' }, 
        error: null 
      })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'subcategories') {
          return {
            select: mockSelectSub,
            eq: mockEqSub,
            single: mockSingleSub
          }
        } else {
          const obj = {
            select: mockSelectAccess,
            eq: mockEq1,
            single: mockSingleAccess
          }
          mockEq1.eq = vi.fn().mockReturnValue(mockEq2)
          mockEq2.single = mockSingleAccess
          return obj
        }
      })

      const result = await AgentCategoryService.hasAccessToTicket(agentId, subcategoryId)

      expect(result).toBe(true)
      expect(mockEqSub).toHaveBeenCalledWith('id', subcategoryId)
    })

    it('should return false when subcategory does not exist', async () => {
      const mockSelectSub = vi.fn().mockReturnThis()
      const mockEqSub = vi.fn().mockReturnThis()
      const mockSingleSub = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelectSub,
        eq: mockEqSub,
        single: mockSingleSub
      })

      const result = await AgentCategoryService.hasAccessToTicket(agentId, subcategoryId)

      expect(result).toBe(false)
    })

    it('should return false when agent does not have access to category', async () => {
      // Subcategory exists
      const mockSelectSub = vi.fn().mockReturnThis()
      const mockEqSub = vi.fn().mockReturnThis()
      const mockSingleSub = vi.fn().mockResolvedValue({ 
        data: { category_id: categoryId }, 
        error: null 
      })

      // But agent has no access
      const mockSelectAccess = vi.fn().mockReturnThis()
      const mockEq1 = vi.fn().mockReturnThis()
      const mockEq2 = vi.fn().mockReturnThis()
      const mockSingleAccess = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'No access' } 
      })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'subcategories') {
          return {
            select: mockSelectSub,
            eq: mockEqSub,
            single: mockSingleSub
          }
        } else {
          const obj = {
            select: mockSelectAccess,
            eq: mockEq1,
            single: mockSingleAccess
          }
          mockEq1.eq = vi.fn().mockReturnValue(mockEq2)
          mockEq2.single = mockSingleAccess
          return obj
        }
      })

      const result = await AgentCategoryService.hasAccessToTicket(agentId, subcategoryId)

      expect(result).toBe(false)
    })
  })
})

