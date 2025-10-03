import mongoose, { Schema, Model } from 'mongoose';
import { ISystemLog, LogLevel } from '@/types';

const SystemLogSchema = new Schema<ISystemLog>(
  {
    level: {
      type: String,
      enum: Object.values(LogLevel),
      required: [true, 'Log level is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Log message is required'],
    },
    stackTrace: {
      type: String,
      // Stack trace for errors
    },
    context: {
      type: Schema.Types.Mixed,
      // Additional context (e.g., request data, user info, etc.)
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt for logs
  }
);

// ============================================
// INDEXES
// ============================================

SystemLogSchema.index({ level: 1, createdAt: -1 }); // For filtering by log level
SystemLogSchema.index({ createdAt: -1 }); // For general log viewing (newest first)

// ============================================
// MODEL
// ============================================

const SystemLog: Model<ISystemLog> =
  mongoose.models.SystemLog ||
  mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);

export default SystemLog;
