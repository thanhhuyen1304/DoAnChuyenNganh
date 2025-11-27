import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  roomId: mongoose.Types.ObjectId;
  roomName: string;
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    username: string;
    rating: number;
    ratingChange: number;
    finalScore: number;
    completionTime: number;
    submissions: number;
    rank: number;
  }>;
  settings: {
    mode: '1vs1' | 'tournament' | 'practice';
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    timeLimit: number;
    language: string;
  };
  problems: Array<{
    id: string;
    title: string;
    difficulty: string;
    submissions: Array<{
      userId: mongoose.Types.ObjectId;
      code: string;
      language: string;
      status: 'pending' | 'running' | 'completed' | 'error';
      score: number;
      executionTime: number;
      memoryUsage: number;
      submittedAt: Date;
    }>;
  }>;
  status: 'in-progress' | 'completed' | 'cancelled';
  winner?: mongoose.Types.ObjectId;
  winnerUsername?: string;
  startedAt: Date;
  completedAt?: Date;
  duration: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
    },
    participants: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      ratingChange: {
        type: Number,
        default: 0,
      },
      finalScore: {
        type: Number,
        default: 0,
      },
      completionTime: {
        type: Number,
        default: 0, // in seconds
      },
      submissions: {
        type: Number,
        default: 0,
      },
      rank: {
        type: Number,
        required: true,
      },
    }],
    settings: {
      mode: {
        type: String,
        enum: ['1vs1', 'tournament', 'practice'],
        required: true,
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        required: true,
      },
      timeLimit: {
        type: Number,
        required: true,
      },
      language: {
        type: String,
        required: true,
      },
    },
    problems: [{
      id: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        required: true,
      },
      submissions: [{
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        code: {
          type: String,
          required: true,
        },
        language: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'running', 'completed', 'error'],
          default: 'pending',
        },
        score: {
          type: Number,
          default: 0,
        },
        executionTime: {
          type: Number,
          default: 0, // in milliseconds
        },
        memoryUsage: {
          type: Number,
          default: 0, // in bytes
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      }],
    }],
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'cancelled'],
      default: 'in-progress',
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    winnerUsername: {
      type: String,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
matchSchema.index({ roomId: 1 });
matchSchema.index({ 'participants.userId': 1 });
matchSchema.index({ status: 1, createdAt: -1 });
matchSchema.index({ winner: 1 });

// Virtual for calculating match duration
matchSchema.virtual('actualDuration').get(function() {
  if (this.completedAt && this.startedAt) {
    return Math.floor((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
  return 0;
});

// Method to add submission
matchSchema.methods.addSubmission = function(
  problemId: string, 
  userId: mongoose.Types.ObjectId, 
  code: string, 
  language: string
) {
  const problem = this.problems.find((p: any) => p.id === problemId);
  if (!problem) {
    throw new Error('Problem not found');
  }
  
  // Remove previous pending submissions for this user and problem
  problem.submissions = problem.submissions.filter((s: any) => 
    !(s.userId.toString() === userId.toString() && s.status === 'pending')
  );
  
  problem.submissions.push({
    userId,
    code,
    language,
    status: 'pending',
    submittedAt: new Date(),
  });
  
  // Update participant submission count
  const participant = this.participants.find((p: any) => p.userId.toString() === userId.toString());
  if (participant) {
    participant.submissions++;
  }
  
  return this.save();
};

// Method to update submission result
matchSchema.methods.updateSubmissionResult = function(
  problemId: string,
  userId: mongoose.Types.ObjectId,
  status: 'completed' | 'error',
  score: number,
  executionTime: number = 0,
  memoryUsage: number = 0
) {
  const problem = this.problems.find((p: any) => p.id === problemId);
  if (!problem) {
    throw new Error('Problem not found');
  }
  
  const submission = problem.submissions
    .filter((s: any) => s.userId.toString() === userId.toString())
    .sort((a: any, b: any) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.status = status;
  submission.score = score;
  submission.executionTime = executionTime;
  submission.memoryUsage = memoryUsage;
  
  // Update participant score
  const participant = this.participants.find((p: any) => p.userId.toString() === userId.toString());
  if (participant) {
    participant.finalScore += score;
  }
  
  return this.save();
};

// Method to complete match
matchSchema.methods.completeMatch = function() {
  if (this.status !== 'in-progress') {
    throw new Error('Match is not in progress');
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  this.duration = this.actualDuration;
  
  // Sort participants by score and completion time
  this.participants.sort((a: any, b: any) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return a.completionTime - b.completionTime;
  });
  
  // Update ranks
  this.participants.forEach((participant: any, index: number) => {
    participant.rank = index + 1;
  });
  
  // Set winner
  if (this.participants.length > 0) {
    this.winner = this.participants[0].userId;
    this.winnerUsername = this.participants[0].username;
  }
  
  return this.save();
};

// Method to calculate rating changes
matchSchema.methods.calculateRatingChanges = function() {
  const participants = this.participants;
  
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    let ratingChange = 0;
    
    for (let j = 0; j < participants.length; j++) {
      if (i !== j) {
        const opponent = participants[j];
        const expectedScore = 1 / (1 + Math.pow(10, (opponent.rating - participant.rating) / 400));
        const actualScore = participant.rank < opponent.rank ? 1 : 0;
        ratingChange += Math.round(32 * (actualScore - expectedScore));
      }
    }
    
    participant.ratingChange = ratingChange;
  }
  
  return this.save();
};

export default mongoose.model<IMatch>('Match', matchSchema);