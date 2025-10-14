import { http, HttpResponse } from 'msw'

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'

export const handlers = [
  // Auth handlers
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    
    if (body.email === 'test@firma.pl' && body.password === 'Test123!') {
      return HttpResponse.json({
        user: {
          id: 'test-user-id',
          email: 'test@firma.pl',
          name: 'Test User',
          role: 'USER',
        },
        token: 'mock-jwt-token',
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@firma.pl',
        name: 'Test User',
        role: 'USER',
      },
    })
  }),

  // Categories handlers
  http.get('/api/categories', () => {
    return HttpResponse.json([
      {
        id: 'cat-1',
        name: 'Hardware',
        description: 'Hardware issues',
        subcategories: [
          { id: 'sub-1', name: 'Komputer/Laptop', categoryId: 'cat-1' },
          { id: 'sub-2', name: 'Drukarka', categoryId: 'cat-1' },
        ],
      },
      {
        id: 'cat-2',
        name: 'Software',
        description: 'Software issues',
        subcategories: [
          { id: 'sub-3', name: 'Instalacja programu', categoryId: 'cat-2' },
        ],
      },
    ])
  }),

  // Tickets handlers
  http.get('/api/tickets', () => {
    return HttpResponse.json([
      {
        id: 'ticket-1',
        title: 'Test Ticket',
        description: 'Test description',
        status: 'OPEN',
        subcategoryId: 'sub-1',
        createdById: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subcategory: {
          id: 'sub-1',
          name: 'Komputer/Laptop',
          category: {
            id: 'cat-1',
            name: 'Hardware',
          },
        },
        createdBy: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@firma.pl',
        },
      },
    ])
  }),

  http.post('/api/tickets', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json(
      {
        id: 'new-ticket-id',
        ...body,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // AI handlers
  http.post('/api/ai/complete', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      categoryId: 'cat-1',
      subcategoryId: 'sub-1',
      summary: 'AI-generated summary',
      suggestedSteps: ['Step 1', 'Step 2'],
    })
  }),
]

