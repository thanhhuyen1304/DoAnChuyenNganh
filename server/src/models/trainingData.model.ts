import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingData extends Document {
  question: string; // Câu hỏi hoặc keyword
  answer: string; // Câu trả lời
  category?: string; // Danh mục (ví dụ: 'programming', 'debugging', 'general')
  tags?: string[]; // Tags để tìm kiếm
  isPractice?: boolean; // Đánh dấu đây là bài luyện thực hành, không phải hội thoại chatbot
  hasCodeExample?: boolean; // Có ví dụ code
  priority?: number; // Độ ưu tiên (cao hơn = ưu tiên hơn)
  usageCount?: number; // Số lần được sử dụng
  rating?: number; // Đánh giá chất lượng (1-5)
  isActive: boolean; // Có đang hoạt động không
  createdBy?: mongoose.Types.ObjectId; // Người tạo (admin)
  createdAt: Date;
  updatedAt: Date;
}

const trainingDataSchema = new Schema<ITrainingData>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      index: true, // Index để tìm kiếm nhanh
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    priority: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    isPractice: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasCodeExample: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
trainingDataSchema.index({ question: 'text', answer: 'text', tags: 'text' });
trainingDataSchema.index({ category: 1, isActive: 1, priority: -1 });

// Method để tăng usage count
trainingDataSchema.methods.incrementUsage = function() {
  this.usageCount = (this.usageCount || 0) + 1;
  return this.save();
};

const TrainingData = mongoose.model<ITrainingData>('TrainingData', trainingDataSchema);

export default TrainingData;

