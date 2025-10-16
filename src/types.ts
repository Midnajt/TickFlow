import type { Database } from "@/app/lib/database.types";

//
// Row aliases
//
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type SubcategoryRow = Database["public"]["Tables"]["subcategories"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type AgentCategoryRow = Database["public"]["Tables"]["agent_categories"]["Row"];

//
// Enums
//
export type TicketStatus = TicketRow["status"];
export type UserRole = UserRow["role"];

//
// --- Auth DTOs & Commands ---
//

// Request payload for login
export type LoginCommand = Pick<UserRow, "email"> & { password: string };

// Response user payload (session info)
export interface UserSessionDTO {
  id: UserRow["id"];
  email: UserRow["email"];
  name: UserRow["name"];
  role: UserRow["role"];
  // DB: force_password_change → DTO: passwordResetRequired
  passwordResetRequired: UserRow["force_password_change"];
}

// Login response
export interface LoginResponseDTO {
  user: UserSessionDTO;
  session: {
    token: string;
    expiresAt: string;
  };
}

// Logout response
export interface LogoutResponseDTO {
  message: string;
}

// Request payload for changing password
export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Change-password response
export interface ChangePasswordResponseDTO {
  message: string;
  passwordResetRequired: boolean;
}

// Session fetch response
export interface SessionDTO {
  user: UserSessionDTO;
}

//
// --- Category DTOs ---
//

// Flat category info
export interface CategoryBaseDTO {
  id: CategoryRow["id"];
  name: CategoryRow["name"];
}

// Subcategory (nested under category)
export interface SubcategoryDTO {
  id: SubcategoryRow["id"];
  name: SubcategoryRow["name"];
  categoryId: SubcategoryRow["category_id"];
  description: SubcategoryRow["description"];
}

// Full category with optional subcategories
export interface CategoryDTO {
  id: CategoryRow["id"];
  name: CategoryRow["name"];
  description: CategoryRow["description"];
  createdAt: CategoryRow["created_at"];
  subcategories: SubcategoryDTO[];
}

//
// --- Ticket DTOs & Commands ---
//

// Create-ticket request
export interface CreateTicketCommand {
  title: TicketRow["title"];
  description: TicketRow["description"];
  subcategoryId: TicketRow["subcategory_id"];
}

// Nested creator / assignee info
export type UserBaseDTO = Pick<UserRow, "id" | "name" | "email">;

// Ticket full detail (used in POST and GET /:id)
export interface TicketDTO {
  id: TicketRow["id"];
  title: TicketRow["title"];
  description: TicketRow["description"];
  status: TicketStatus;
  subcategoryId: TicketRow["subcategory_id"];
  subcategory: SubcategoryDTO & { category: CategoryBaseDTO };
  createdById: TicketRow["created_by_id"];
  createdBy: UserBaseDTO;
  assignedToId: TicketRow["assigned_to_id"];
  assignedTo: UserBaseDTO | null;
  createdAt: TicketRow["created_at"];
  updatedAt: TicketRow["updated_at"];
}

// Query params for listing tickets
export interface GetTicketsParams {
  status?: TicketStatus;
  assignedToMe?: boolean;
  page?: number;
  limit?: number;
  sortBy?: keyof TicketRow;
  sortOrder?: "asc" | "desc";
}

// Item in tickets list
export interface TicketListItemDTO {
  id: TicketRow["id"];
  title: TicketRow["title"];
  status: TicketStatus;
  subcategory: SubcategoryDTO & { category: CategoryBaseDTO };
  createdBy: UserBaseDTO;
  assignedTo: UserBaseDTO | null;
  createdAt: TicketRow["created_at"];
  updatedAt: TicketRow["updated_at"];
}

// Pagination metadata
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// GET /api/tickets response
export interface TicketsListDTO {
  tickets: TicketListItemDTO[];
  pagination: PaginationDTO;
}

// Assign-ticket command (ticketId from path)
export interface AssignTicketCommand {
  ticketId: string;
}

// Assign-ticket response
export interface TicketAssignmentDTO {
  ticket: {
    id: TicketRow["id"];
    title: TicketRow["title"];
    status: TicketStatus;
    assignedToId: TicketRow["assigned_to_id"];
    assignedTo: UserBaseDTO;
    updatedAt: TicketRow["updated_at"];
  };
}

// Update-status command
export interface UpdateTicketStatusCommand {
  ticketId: string;
  status: TicketStatus;
}

// Update-status response
export interface TicketStatusUpdateDTO {
  ticket: {
    id: TicketRow["id"];
    title: TicketRow["title"];
    status: TicketStatus;
    updatedAt: TicketRow["updated_at"];
  };
}

//
// --- Agent Categories DTOs ---
//

// Agent-category mapping
export interface AgentCategoryDTO {
  id: AgentCategoryRow["id"];
  userId: AgentCategoryRow["agent_id"];
  categoryId: AgentCategoryRow["category_id"];
  category: CategoryBaseDTO;
  createdAt: AgentCategoryRow["created_at"];
}

// GET /api/agent-categories/me response
export interface GetAgentCategoriesResponseDTO {
  agentCategories: AgentCategoryDTO[];
}

// Agent info for GET /:categoryId/agents
export interface AgentDTO {
  id: UserRow["id"];
  name: UserRow["name"];
  email: UserRow["email"];
  assignedAt: AgentCategoryRow["created_at"];
}

// GET /api/agent-categories/:categoryId/agents response
export interface GetAgentsByCategoryResponseDTO {
  agents: AgentDTO[];
}

// Query params for listing categories
export interface GetCategoriesParams {
  includeSubcategories?: boolean;
}

// GET /api/categories response wrapper
export interface CategoriesListDTO {
  categories: CategoryDTO[];
}

// GET /api/categories/:categoryId params (path + optional query)
export interface GetCategoryParams {
  categoryId: string;
  includeSubcategories?: boolean;
}
