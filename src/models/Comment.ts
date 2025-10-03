import mongoose, { Schema, Model } from 'mongoose';
import { IComment } from '@/types';

const CommentSchema = new Schema<IComment>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: [true, 'Ticket reference is required'],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment must be at least 1 character'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isInternal: {
      type: Boolean,
      default: false,
      // Internal comments are only visible to agents/managers/admins
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

CommentSchema.index({ ticket: 1, createdAt: -1 }); // For fetching comments by ticket, newest first
CommentSchema.index({ author: 1 });

// ============================================
// MODEL
// ============================================

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
