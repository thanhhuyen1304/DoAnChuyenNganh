import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  points?: number;
}

export interface IChallenge extends Document {
  title: string;
  description: string;
  problemStatement: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Syntax' | 'Logic' | 'Performance' | 'Security';
  tags: string[];
  buggyCode: string;
  correctCode?: string;
  testCases: ITestCase[];
  points: number;
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>({
  input: {
    type: String,
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 10,
  },
});

const challengeSchema = new Schema<IChallenge>(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề bài tập là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự'],
    },
    description: {
      type: String,
      required: [true, 'Mô tả bài tập là bắt buộc'],
      trim: true,
    },
    problemStatement: {
      type: String,
      required: [true, 'Đề bài là bắt buộc'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Ngôn ngữ lập trình là bắt buộc'],
      enum: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'],
    },
    difficulty: {
      type: String,
      required: [true, 'Độ khó là bắt buộc'],
      enum: ['Easy', 'Medium', 'Hard'],
    },
    category: {
      type: String,
      required: [true, 'Danh mục là bắt buộc'],
      enum: ['Syntax', 'Logic', 'Performance', 'Security'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    buggyCode: {
      type: String,
      required: [true, 'Code có lỗi là bắt buộc'],
    },
    correctCode: {
      type: String,
    },
    testCases: [testCaseSchema],
    points: {
      type: Number,
      required: [true, 'Điểm số là bắt buộc'],
      min: [1, 'Điểm số phải lớn hơn 0'],
      max: [1000, 'Điểm số không được vượt quá 1000'],
    },
    timeLimit: {
      type: Number,
      required: [true, 'Giới hạn thời gian là bắt buộc'],
      min: [1, 'Giới hạn thời gian phải lớn hơn 1 giây'],
      max: [60, 'Giới hạn thời gian không được vượt quá 60 giây'],
    },
    memoryLimit: {
      type: Number,
      required: [true, 'Giới hạn bộ nhớ là bắt buộc'],
      min: [1, 'Giới hạn bộ nhớ phải lớn hơn 1MB'],
      max: [512, 'Giới hạn bộ nhớ không được vượt quá 512MB'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo là bắt buộc'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
challengeSchema.index({ language: 1, difficulty: 1, isActive: 1 });
challengeSchema.index({ category: 1, tags: 1 });
challengeSchema.index({ createdBy: 1 });

export default mongoose.model<IChallenge>('Challenge', challengeSchema);
