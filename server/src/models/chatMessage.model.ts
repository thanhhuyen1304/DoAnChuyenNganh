import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    contextUsed?: boolean;      // Có dùng context từ DB không?
    timestamp?: Date;
    model?: string;              // Model AI đã dùng
  };
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system']
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    metadata: {
      contextUsed: Boolean,
      timestamp: Date,
      model: String
    }
  },
  { timestamps: true }
);

chatMessageSchema.index({ userId: 1, createdAt: -1 });

// Define interface for static methods
interface ChatMessageModel extends mongoose.Model<IChatMessage> {
  getRecentHistory(userId: string, limit?: number): Promise<IChatMessage[]>;
  clearHistory(userId: string): Promise<any>;
}

// Static method: Get recent history
chatMessageSchema.statics.getRecentHistory = function(userId: string, limit: number = 20) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method: Clear history
chatMessageSchema.statics.clearHistory = function(userId: string) {
  return this.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
};

const ChatMessage = mongoose.model<IChatMessage, ChatMessageModel>('ChatMessage', chatMessageSchema);

export default ChatMessage;

