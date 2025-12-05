import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  description: string;
  icon: string; // Emoji or icon URL
  image?: string; // Upload image URL
  type: 'challenge' | 'streak' | 'points' | 'special';
  condition: {
    type: string; // 'complete_challenges', 'streak_days', 'total_points', etc.
    value: number; // Threshold value
  };
  points: number; // Points awarded
  badge: string; // Badge name
  isActive: boolean;
  isDeleted: boolean; // Soft delete flag
  deletedAt?: Date; // Soft delete timestamp
  deletedBy?: mongoose.Types.ObjectId; // Who deleted it
  createdBy?: mongoose.Types.ObjectId; // Who created it
  updatedBy?: mongoose.Types.ObjectId; // Who last updated it
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    name: {
      type: String,
      required: [true, 'Tên thành tích là bắt buộc'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc'],
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      default: '🏆',
    },
    image: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['challenge', 'streak', 'points', 'special', 'support', 'teamwork', 'creativity'],
        message: 'Type phải là một trong: challenge, streak, points, special, support, teamwork, creativity',
      },
      required: [true, 'Loại thành tích là bắt buộc'],
    },
    condition: {
      type: {
        type: String,
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
    },
    points: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
      required: [true, 'Badge name là bắt buộc'],
      trim: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
achievementSchema.index({ type: 1 });
achievementSchema.index({ isActive: 1 });
achievementSchema.index({ isDeleted: 1 });
achievementSchema.index({ name: 1 });
achievementSchema.index({ createdAt: -1 });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);

