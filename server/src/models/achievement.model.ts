import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  description: string;
  icon: string; // Emoji or icon URL
  type: 'challenge' | 'streak' | 'points' | 'special';
  condition: {
    type: string; // 'complete_challenges', 'streak_days', 'total_points', etc.
    value: number; // Threshold value
  };
  points: number; // Points awarded
  badge: string; // Badge name
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      default: '🏆',
    },
    type: {
      type: String,
      enum: ['challenge', 'streak', 'points', 'special'],
      required: true,
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
      required: true,
      trim: true,
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

// Indexes
achievementSchema.index({ type: 1 });
achievementSchema.index({ isActive: 1 });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);

