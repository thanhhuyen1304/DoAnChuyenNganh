import mongoose, { Schema, Document } from 'mongoose';

export interface IReport {
  user: mongoose.Types.ObjectId;
  reason: string;
  reportedAt: Date;
}

export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  challenge: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  reports: IReport[];
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User là bắt buộc'],
      index: true,
    },
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: [true, 'Challenge là bắt buộc'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Nội dung bình luận là bắt buộc'],
      trim: true,
      minlength: [1, 'Nội dung phải có ít nhất 1 ký tự'],
      maxlength: [5000, 'Nội dung không được quá 5000 ký tự'],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reports: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh comments theo challenge
commentSchema.index({ challenge: 1, createdAt: -1 });

// Index để admin tìm comments có nhiều reports
commentSchema.index({ 'reports.0': 1, isHidden: 1 });

export default mongoose.model<IComment>('Comment', commentSchema);
