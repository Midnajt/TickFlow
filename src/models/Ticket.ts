import mongoose, { Schema, Model } from 'mongoose';
import { ITicket, TicketStatus } from '@/types';

const TicketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
      minlength: [1, 'Description must be at least 1 character'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: [true, 'Subcategory is required'],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

TicketSchema.index({ status: 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ subcategory: 1 });
TicketSchema.index({ createdBy: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ createdAt: -1 }); // For sorting by newest first

// Compound indexes for common queries
TicketSchema.index({ status: 1, subcategory: 1 }); // For agents viewing available tickets
TicketSchema.index({ createdBy: 1, status: 1 }); // For users viewing their tickets
TicketSchema.index({ assignedTo: 1, status: 1 }); // For agents viewing their assigned tickets

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

TicketSchema.pre('save', function (next) {
  // Set assignedAt timestamp when ticket is assigned
  if (this.isModified('assignedTo') && this.assignedTo && !this.assignedAt) {
    this.assignedAt = new Date();
  }

  // Set resolvedAt timestamp when status changes to RESOLVED
  if (this.isModified('status') && this.status === TicketStatus.RESOLVED && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  // Set closedAt timestamp when status changes to CLOSED
  if (this.isModified('status') && this.status === TicketStatus.CLOSED && !this.closedAt) {
    this.closedAt = new Date();
  }

  // Update status to IN_PROGRESS when assigned
  if (this.isModified('assignedTo') && this.assignedTo && this.status === TicketStatus.OPEN) {
    this.status = TicketStatus.IN_PROGRESS;
  }

  next();
});

// ============================================
// MODEL
// ============================================

const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;
