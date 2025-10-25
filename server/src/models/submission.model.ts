import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutionResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  memoryUsed: number;
  errorMessage?: string;
  points: number;
}

export interface ISubmission extends Document {
  user: mongoose.Types.ObjectId;
  challenge: mongoose.Types.ObjectId;
  submittedCode: string;
  language: string;
  status: 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  score: number;
  totalPoints: number;
  executionResults: IExecutionResult[];
  executionTime: number; // total execution time in milliseconds
  memoryUsed: number; // peak memory usage in KB
  errorMessage?: string;
  submittedAt: Date;
}

const executionResultSchema = new Schema<IExecutionResult>({
  testCaseIndex: {
    type: Number,
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  },
  actualOutput: {
    type: String,
    required: true,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  executionTime: {
    type: Number,
    required: true,
  },
  memoryUsed: {
    type: Number,
    required: true,
  },
  errorMessage: {
    type: String,
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
});

const submissionSchema = new Schema<ISubmission>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc'],
    },
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: [true, 'Bài tập là bắt buộc'],
    },
    submittedCode: {
      type: String,
      required: [true, 'Code nộp bài là bắt buộc'],
    },
    language: {
      type: String,
      required: [true, 'Ngôn ngữ lập trình là bắt buộc'],
      enum: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'],
    },
    status: {
      type: String,
      required: [true, 'Trạng thái là bắt buộc'],
      enum: ['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error'],
      default: 'Pending',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    executionResults: [executionResultSchema],
    executionTime: {
      type: Number,
      default: 0,
    },
    memoryUsed: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
submissionSchema.index({ user: 1, challenge: 1 });
submissionSchema.index({ user: 1, submittedAt: -1 });
submissionSchema.index({ challenge: 1, submittedAt: -1 });
submissionSchema.index({ status: 1, submittedAt: -1 });

export default mongoose.model<ISubmission>('Submission', submissionSchema);
