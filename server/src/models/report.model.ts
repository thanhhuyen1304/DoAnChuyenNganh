import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId; // User báo cáo
  reportedUser?: mongoose.Types.ObjectId; // User bị báo cáo
  reportedChallenge?: mongoose.Types.ObjectId; // Challenge bị báo cáo
  reportedSubmission?: mongoose.Types.ObjectId; // Submission bị báo cáo
  type: 'user' | 'challenge' | 'submission' | 'other';
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  adminNotes?: string;
  resolvedBy?: mongoose.Types.ObjectId; // Admin xử lý
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reportedChallenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
    },
    reportedSubmission: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
    },
    type: {
      type: String,
      enum: ['user', 'challenge', 'submission', 'other'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ reporter: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model<IReport>('Report', reportSchema);

