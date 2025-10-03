import { Document, Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  USER = 'USER',
  AGENT = 'AGENT',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_UPDATED = 'TICKET_UPDATED',
  TICKET_RESOLVED = 'TICKET_RESOLVED',
  TICKET_CLOSED = 'TICKET_CLOSED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  CATEGORY_CREATED = 'CATEGORY_CREATED',
  CATEGORY_UPDATED = 'CATEGORY_UPDATED',
  CATEGORY_DELETED = 'CATEGORY_DELETED',
  SUBCATEGORY_CREATED = 'SUBCATEGORY_CREATED',
  SUBCATEGORY_UPDATED = 'SUBCATEGORY_UPDATED',
  SUBCATEGORY_DELETED = 'SUBCATEGORY_DELETED',
}

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export enum TargetType {
  TICKET = 'TICKET',
  USER = 'USER',
  CATEGORY = 'CATEGORY',
  SUBCATEGORY = 'SUBCATEGORY',
  COMMENT = 'COMMENT',
}

// ============================================
// USER TYPES
// ============================================

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  assignedCategories: Types.ObjectId[];
  assignedSubcategories: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  managers: Types.ObjectId[];
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SUBCATEGORY TYPES
// ============================================

export interface ISubcategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  category: Types.ObjectId;
  agents: Types.ObjectId[];
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TICKET TYPES
// ============================================

export interface ITicket extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: TicketStatus;
  category: Types.ObjectId;
  subcategory: Types.ObjectId;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// COMMENT TYPES
// ============================================

export interface IComment extends Document {
  _id: Types.ObjectId;
  ticket: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  action: AuditAction;
  userId: Types.ObjectId;
  targetId?: Types.ObjectId;
  targetType?: TargetType;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================
// SYSTEM LOG TYPES
// ============================================

export interface ISystemLog extends Document {
  _id: Types.ObjectId;
  level: LogLevel;
  message: string;
  stackTrace?: string;
  context?: Record<string, any>;
  createdAt: Date;
}
