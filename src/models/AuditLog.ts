import mongoose, { Schema, Model } from 'mongoose';
import { IAuditLog, AuditAction, TargetType } from '@/types';

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: [true, 'Action is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    targetType: {
      type: String,
      enum: Object.values(TargetType),
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      // Additional context data (e.g., old/new values, error details, etc.)
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt for logs
  }
);

// ============================================
// INDEXES
// ============================================

AuditLogSchema.index({ action: 1, createdAt: -1 }); // For filtering by action type
AuditLogSchema.index({ userId: 1, createdAt: -1 }); // For user activity history
AuditLogSchema.index({ targetId: 1, createdAt: -1 }); // For object history
AuditLogSchema.index({ createdAt: -1 }); // For general log viewing (newest first)

// ============================================
// MODEL
// ============================================

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
