import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  description?: string;
  hostId: mongoose.Types.ObjectId;
  hostUsername: string;
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    username: string;
    rating: number;
    joinedAt: Date;
    isReady: boolean;
    progress?: {
      problemId: string;
      startTime: Date;
      completedAt?: Date;
      score?: number;
    };
  }>;
  settings: {
    mode: '1vs1' | 'tournament' | 'practice';
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    timeLimit: number; // in minutes
    language: string;
    isPrivate: boolean;
    password?: string;
    maxParticipants: number;
    autoStart: boolean;
    allowSpectators: boolean;
  };
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  currentRound?: number;
  totalRounds?: number;
  problems: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    timeLimit: number;
    memoryLimit: number;
    testCases: Array<{
      input: string;
      expectedOutput: string;
    }>;
  }>;
  results?: Array<{
    userId: mongoose.Types.ObjectId;
    username: string;
    score: number;
    completionTime: number;
    submissions: number;
    rank: number;
    ratingChange: number;
  }>;
  winner?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [100, 'Room name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
    },
    hostUsername: {
      type: String,
      required: [true, 'Host username is required'],
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
        default: 1200,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      isReady: {
        type: Boolean,
        default: false,
      },
      progress: {
        problemId: String,
        startTime: Date,
        completedAt: Date,
        score: Number,
      },
    }],
    settings: {
      mode: {
        type: String,
        enum: ['1vs1', 'tournament', 'practice'],
        default: '1vs1',
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        default: 'medium',
      },
      timeLimit: {
        type: Number,
        default: 30, // 30 minutes
        min: [5, 'Time limit must be at least 5 minutes'],
        max: [180, 'Time limit cannot exceed 180 minutes'],
      },
      language: {
        type: String,
        enum: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C', 'any'],
        default: 'any',
      },
      isPrivate: {
        type: Boolean,
        default: false,
      },
      password: {
        type: String,
        minlength: [4, 'Password must be at least 4 characters'],
      },
      maxParticipants: {
        type: Number,
        default: 2,
        min: [2, 'Minimum 2 participants required'],
        max: [50, 'Maximum 50 participants allowed'],
      },
      autoStart: {
        type: Boolean,
        default: false,
      },
      allowSpectators: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
      default: 'waiting',
    },
    currentRound: {
      type: Number,
      default: 1,
    },
    totalRounds: {
      type: Number,
      default: 1,
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
      description: {
        type: String,
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
      memoryLimit: {
        type: Number,
        required: true,
      },
      testCases: [{
        input: String,
        expectedOutput: String,
      }],
    }],
    results: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      score: {
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
      ratingChange: {
        type: Number,
        default: 0,
      },
    }],
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
roomSchema.index({ hostId: 1, status: 1 });
roomSchema.index({ 'settings.isPrivate': 1, status: 1 });
roomSchema.index({ 'participants.userId': 1 });
roomSchema.index({ createdAt: -1 });

// Virtual for checking if room is full
roomSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.settings.maxParticipants;
});

// Virtual for checking if room can start
roomSchema.virtual('canStart').get(function() {
  const minParticipants = this.settings.mode === '1vs1' ? 2 : 1;
  return this.participants.length >= minParticipants && 
         this.participants.every(p => p.isReady);
});

// Method to add participant
roomSchema.methods.addParticipant = function(userId: mongoose.Types.ObjectId, username: string, rating: number) {
  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error('Room is full');
  }
  
  const existingParticipant = this.participants.find((p: any) => p.userId.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User already in room');
  }
  
  this.participants.push({
    userId,
    username,
    rating,
    joinedAt: new Date(),
    isReady: false,
  });
  
  return this.save();
};

// Method to remove participant
roomSchema.methods.removeParticipant = function(userId: mongoose.Types.ObjectId) {
  this.participants = this.participants.filter((p: any) => p.userId.toString() !== userId.toString());
  return this.save();
};

// Method to set participant readiness
roomSchema.methods.setParticipantReady = function(userId: mongoose.Types.ObjectId, isReady: boolean) {
  const participant = this.participants.find((p: any) => p.userId.toString() === userId.toString());
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  participant.isReady = isReady;
  return this.save();
};

// Method to start room
roomSchema.methods.startRoom = function() {
  if (this.status !== 'waiting') {
    throw new Error('Room cannot be started');
  }
  
  if (!this.canStart) {
    throw new Error('Not enough ready participants');
  }
  
  this.status = 'in-progress';
  this.startedAt = new Date();
  return this.save();
};

// Method to complete room
roomSchema.methods.completeRoom = function(winnerId?: mongoose.Types.ObjectId) {
  if (this.status !== 'in-progress') {
    throw new Error('Room is not in progress');
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  if (winnerId) {
    this.winner = winnerId;
  }
  
  return this.save();
};

export default mongoose.model<IRoom>('Room', roomSchema);