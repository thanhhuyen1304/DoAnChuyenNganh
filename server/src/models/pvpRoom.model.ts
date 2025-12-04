import mongoose, { Schema, Document } from 'mongoose';

export interface IPVPParticipant {
  userId: mongoose.Types.ObjectId;
  username: string;
  joinedAt: Date;
  isReady: boolean;
}

export interface IPVPRoomSettings {
  timeLimit: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  maxParticipants: number;
  isPrivate?: boolean;
  language?: string;
}

export interface IPVPRoom extends Document {
  name: string;
  hostId: mongoose.Types.ObjectId;
  hostUsername: string;
  roomCode: string; // 6 characters
  settings: IPVPRoomSettings;
  participants: IPVPParticipant[];
  status: 'waiting' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IPVPParticipant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isReady: {
    type: Boolean,
    default: false
  }
});

const roomSettingsSchema = new Schema<IPVPRoomSettings>({
  timeLimit: {
    type: Number,
    required: true,
    min: 5,
    max: 60,
    default: 15
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 8,
    default: 2
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'javascript'
  }
});

const pvpRoomSchema = new Schema<IPVPRoom>({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host ID is required']
  },
  hostUsername: {
    type: String,
    required: [true, 'Host username is required']
  },
  roomCode: {
    type: String,
    required: [true, 'Room code is required'],
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9]{6}$/
  },
  settings: {
    type: roomSettingsSchema,
    required: true
  },
  participants: [participantSchema],
  status: {
    type: String,
    required: true,
    enum: ['waiting', 'in-progress', 'completed'],
    default: 'waiting'
  }
}, {
  timestamps: true
});

// Indexes for performance
pvpRoomSchema.index({ roomCode: 1 });
pvpRoomSchema.index({ status: 1, createdAt: -1 });
pvpRoomSchema.index({ hostId: 1 });

// Static method to generate unique room code
pvpRoomSchema.statics.generateRoomCode = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomCode = '';
  for (let i = 0; i < 6; i++) {
    roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomCode;
};

// Instance method to add participant
pvpRoomSchema.methods.addParticipant = function(userId: mongoose.Types.ObjectId, username: string): void {
  // Check if user already in room
  const existingParticipant = this.participants.find(
    (p: IPVPParticipant) => p.userId.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      userId,
      username,
      joinedAt: new Date(),
      isReady: false
    });
  }
};

// Instance method to remove participant
pvpRoomSchema.methods.removeParticipant = function(userId: mongoose.Types.ObjectId): boolean {
  const initialLength = this.participants.length;
  this.participants = this.participants.filter(
    (p: IPVPParticipant) => p.userId.toString() !== userId.toString()
  );
  return this.participants.length < initialLength;
};

// Instance method to set participant ready status
pvpRoomSchema.methods.setParticipantReady = function(userId: mongoose.Types.ObjectId, isReady: boolean): boolean {
  const participant = this.participants.find(
    (p: IPVPParticipant) => p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isReady = isReady;
    return true;
  }
  return false;
};

// Instance method to check if all participants are ready
pvpRoomSchema.methods.allParticipantsReady = function(): boolean {
  return this.participants.length > 0 && 
         this.participants.every((p: IPVPParticipant) => p.isReady);
};

export default mongoose.model<IPVPRoom>('PVPRoom', pvpRoomSchema);
