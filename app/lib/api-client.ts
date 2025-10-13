/**
 * API Client dla TickFlow
 * Obsługuje wszystkie zapytania HTTP do backend API
 */

import type {
  LoginCommand,
  LoginResponseDTO,
  ChangePasswordCommand,
  ChangePasswordResponseDTO,
  SessionDTO,
  TicketsListDTO,
  TicketDTO,
  CreateTicketCommand,
  CategoriesListDTO,
  GetAgentCategoriesResponseDTO,
  TicketAssignmentDTO,
  TicketStatusUpdateDTO,
  TicketStatus,
} from '@/src/types';

// Base configuration
const API_BASE = '/api';

// Helper do obsługi błędów
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Helper do pobierania tokenu z cookie
function getAuthHeaders(): HeadersInit {
  // Token jest w HttpOnly cookie, więc nie potrzebujemy ręcznie go dodawać
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Auth API
 */
export const authApi = {
  login: async (command: LoginCommand): Promise<LoginResponseDTO> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      credentials: 'include', // Wysyła cookies
    });
    return handleResponse<LoginResponseDTO>(response);
  },

  logout: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleResponse(response);
  },

  changePassword: async (command: ChangePasswordCommand): Promise<ChangePasswordResponseDTO> => {
    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(command),
      credentials: 'include',
    });
    return handleResponse<ChangePasswordResponseDTO>(response);
  },

  getSession: async (): Promise<SessionDTO> => {
    const response = await fetch(`${API_BASE}/auth/session`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<SessionDTO>(response);
  },
};

/**
 * Tickets API
 */
export const ticketsApi = {
  getTickets: async (params?: {
    status?: TicketStatus;
    assignedToMe?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<TicketsListDTO> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assignedToMe) searchParams.set('assignedToMe', 'true');
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await fetch(`${API_BASE}/tickets?${searchParams}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<TicketsListDTO>(response);
  },

  getTicketById: async (ticketId: string): Promise<TicketDTO> => {
    const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<TicketDTO>(response);
  },

  createTicket: async (command: CreateTicketCommand): Promise<TicketDTO> => {
    const response = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(command),
      credentials: 'include',
    });
    return handleResponse<TicketDTO>(response);
  },

  assignTicket: async (ticketId: string): Promise<TicketAssignmentDTO> => {
    const response = await fetch(`${API_BASE}/tickets/${ticketId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<TicketAssignmentDTO>(response);
  },

  updateTicketStatus: async (ticketId: string, status: TicketStatus): Promise<TicketStatusUpdateDTO> => {
    const response = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
      credentials: 'include',
    });
    return handleResponse<TicketStatusUpdateDTO>(response);
  },
};

/**
 * Categories API
 */
export const categoriesApi = {
  getCategories: async (includeSubcategories = true): Promise<CategoriesListDTO> => {
    const searchParams = new URLSearchParams();
    searchParams.set('includeSubcategories', includeSubcategories.toString());

    const response = await fetch(`${API_BASE}/categories?${searchParams}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<CategoriesListDTO>(response);
  },
};

/**
 * Agent Categories API
 */
export const agentCategoriesApi = {
  getMyCategories: async (): Promise<GetAgentCategoriesResponseDTO> => {
    const response = await fetch(`${API_BASE}/agent-categories/me`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<GetAgentCategoriesResponseDTO>(response);
  },
};

