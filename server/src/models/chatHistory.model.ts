import mongoose, { Schema, Document } from 'mongoose';

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    rating?: 'good' | 'bad'; // Rating cho AI messages
  }>;
  title?: string; // Tự động tạo từ câu hỏi đầu tiên
  createdAt: Date;
  updatedAt: Date;
}

const chatHistorySchema = new Schema<IChatHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        rating: {
          type: String,
          enum: ['good', 'bad'],
          default: undefined,
        },
      },
    ],
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm nhanh chat history của user
chatHistorySchema.index({ userId: 1, updatedAt: -1 });

const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);

export default ChatHistory;

