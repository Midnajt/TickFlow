/**
 * Re-export auth middleware functions from utils/auth.ts
 * This file exists for backward compatibility with admin endpoints
 */
export { withAuth, withRole, requireAuth, hasRole, requireRole } from '@/app/lib/utils/auth';

