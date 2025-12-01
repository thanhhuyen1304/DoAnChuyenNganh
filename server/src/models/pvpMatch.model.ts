import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission {
  code: string;
  language: string;
  score: number;
  submittedAt: Date;
  testResults?: any[];
}

export interface IPVPMatchParticipant {
  userId: mongoose.Types.ObjectId;
  username: string;
  submissionId?: mongoose.Types.ObjectId;
  score: number;
  passedTests: number;
  totalTests: number;
  completionTime: number | Date; // Can be number (milliseconds) or Date
  submittedAt?: Date;
  isWinner?: boolean;
  completed?: boolean;
  submissions?: ISubmission[];
}

export interface IPVPMatch extends Document {
  roomId: mongoose.Types.ObjectId;
  roomName: string;
  challengeId: mongoose.Types.ObjectId;
  challengeTitle: string;
  participants: IPVPMatchParticipant[];
  status: 'active' | 'completed' | 'in-progress';
  winnerId?: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
  endedAt?: Date;
  timeLimit: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  settings?: {
    timeLimit: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    maxParticipants: number;
  };
}

const matchParticipantSchema = new Schema<IPVPMatchParticipant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  submissionId: {
    type: Schema.Types.ObjectId,
    ref: 'Submission'
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  passedTests: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTests: {
    type: Number,
    default: 0,
    min: 0
  },
  completionTime: {
    type: Number,
    default: 0,
    min: 0
  },
  submittedAt: {
    type: Date
  },
  isWinner: {
    type: Boolean,
    default: false
  }
});

const pvpMatchSchema = new Schema<IPVPMatch>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'PVPRoom',
    required: [true, 'Room ID is required']
  },
  roomName: {
    type: String,
    required: [true, 'Room name is required']
  },
  challengeId: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge',
    required: [true, 'Challenge ID is required']
  },
  challengeTitle: {
    type: String,
    required: [true, 'Challenge title is required']
  },
  participants: [matchParticipantSchema],
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'in-progress'],
    default: 'active'
  },
  winnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  settings: {
    timeLimit: Number,
    difficulty: String,
    maxParticipants: Number
  },
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: 5,
    max: 60
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  }
}, {
  timestamps: true
});

// Indexes for performance
pvpMatchSchema.index({ roomId: 1 });
pvpMatchSchema.index({ status: 1, startedAt: -1 });
pvpMatchSchema.index({ 'participants.userId': 1 });

// Instance method to update participant submission
pvpMatchSchema.methods.updateParticipantSubmission = function(
  userId: mongoose.Types.ObjectId,
  submissionId: mongoose.Types.ObjectId,
  score: number,
  passedTests: number,
  totalTests: number
): boolean {
  const participant = this.participants.find(
    (p: IPVPMatchParticipant) => p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    // Only update if this is a better score or first submission
    const currentTime = Date.now() - this.startedAt.getTime();
    
    if (score > participant.score || !participant.submissionId) {
      participant.submissionId = submissionId;
      participant.score = score;
      participant.passedTests = passedTests;
      participant.totalTests = totalTests;
      participant.completionTime = currentTime;
      participant.submittedAt = new Date();
      return true;
    }
  }
  return false;
};

// Instance method to determine winner
pvpMatchSchema.methods.determineWinner = function(): void {
  if (this.participants.length === 0) return;
  
  // Sort participants by:
  // 1. Participants who passed all tests (score === totalTests)
  // 2. Higher score
  // 3. Faster completion time
  const sortedParticipants = [...this.participants].sort((a, b) => {
    const aPassedAll = a.passedTests === a.totalTests;
    const bPassedAll = b.passedTests === b.totalTests;
    
    if (aPassedAll && !bPassedAll) return -1;
    if (!aPassedAll && bPassedAll) return 1;
    
    if (a.score !== b.score) return b.score - a.score;
    return a.completionTime - b.completionTime;
  });
  
  // Lấy điểm và thời gian cao nhất
  const topScore = sortedParticipants[0].score;
  const topTime = sortedParticipants[0].completionTime;
  
  // Tìm tất cả người chơi có cùng điểm cao nhất và cùng thời gian
  const topParticipants = sortedParticipants.filter(p =>
    p.score === topScore && p.completionTime === topTime
  );
  
  // Nếu có nhiều hơn 1 người -> HÒA
  if (topParticipants.length > 1) {
    // Đánh dấu tất cả người có điểm cao nhất là winner (hòa)
    topParticipants.forEach(p => {
      p.isWinner = true;
    });
    this.winnerId = null; // Không có người thắng duy nhất
  } else {
    // Có 1 người thắng rõ ràng
    const winner = sortedParticipants[0];
    this.winnerId = winner.userId;
    winner.isWinner = true;
  }
};

// Instance method to calculate XP for winner
pvpMatchSchema.methods.calculateWinnerXP = function(): number {
  if (!this.winnerId || this.participants.length === 0) return 0;
  
  const baseXP: { [key: string]: number } = {
    'Easy': 20,
    'Medium': 50,
    'Hard': 100
  };
  
  return baseXP[this.difficulty] || 50;
};

// Instance method to complete match
pvpMatchSchema.methods.completeMatch = function(): void {
  this.status = 'completed';
  this.completedAt = new Date();
  this.determineWinner();
};

// Static method to check for timeout matches
pvpMatchSchema.statics.findTimeoutMatches = function(): Promise<IPVPMatch[]> {
  const now = new Date();
  return this.find({
    status: 'active',
    startedAt: {
      $lt: new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
    }
  });
};

// Instance method to get time remaining
pvpMatchSchema.methods.getTimeRemaining = function(): number {
  const now = new Date();
  const startedAt = new Date(this.startedAt);
  const timeLimitMs = (this.settings?.timeLimit || this.timeLimit) * 60 * 1000; // Convert minutes to milliseconds
  const elapsedMs = now.getTime() - startedAt.getTime();
  return Math.max(0, timeLimitMs - elapsedMs);
};

export default mongoose.model<IPVPMatch>('PVPMatch', pvpMatchSchema);
