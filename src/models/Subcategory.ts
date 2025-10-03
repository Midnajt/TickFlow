import mongoose, { Schema, Model } from 'mongoose';
import { ISubcategory } from '@/types';

const SubcategorySchema = new Schema<ISubcategory>(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
      maxlength: [100, 'Subcategory name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Subcategory description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    agents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

SubcategorySchema.index({ category: 1 });
SubcategorySchema.index({ isActive: 1 });
SubcategorySchema.index({ name: 1, category: 1 }, { unique: true }); // Unique name within category

// ============================================
// MODEL
// ============================================

const Subcategory: Model<ISubcategory> =
  mongoose.models.Subcategory ||
  mongoose.model<ISubcategory>('Subcategory', SubcategorySchema);

export default Subcategory;
