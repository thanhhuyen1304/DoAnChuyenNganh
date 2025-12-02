import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  content: string;
  rating?: number; // 1-5 stars
  status: 'pending' | 'reviewing' | 'in_progress' | 'completed' | 'rejected';
  adminResponse?: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['bug', 'feature', 'improvement', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
    },
    adminResponse: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
feedbackSchema.index({ user: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ createdAt: -1 });

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);

