import mongoose, { Schema, Document } from 'mongoose';

export interface IFriend extends Document {
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  requesterUsername: string;
  recipientUsername: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  requestedAt: Date;
  respondedAt?: Date;
  lastInteraction?: Date;
  // Friendship metadata
  friendshipLevel: number; // 1-5 based on interactions
  totalMatches: number;
  messagesExchanged: number;
  // Block reasons
  blockReason?: string;
  // Privacy settings
  canSeeOnlineStatus: boolean;
  canInviteToMatches: boolean;
  canViewStats: boolean;
}

const friendSchema = new Schema<IFriend>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
    },
    requesterUsername: {
      type: String,
      required: [true, 'Requester username is required'],
    },
    recipientUsername: {
      type: String,
      required: [true, 'Recipient username is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
    // Friendship metadata
    friendshipLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    totalMatches: {
      type: Number,
      default: 0,
    },
    messagesExchanged: {
      type: Number,
      default: 0,
    },
    // Block reasons
    blockReason: {
      type: String,
      maxlength: [500, 'Block reason cannot exceed 500 characters'],
    },
    // Privacy settings
    canSeeOnlineStatus: {
      type: Boolean,
      default: true,
    },
    canInviteToMatches: {
      type: Boolean,
      default: true,
    },
    canViewStats: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better performance
friendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
friendSchema.index({ recipientId: 1, status: 1 });
friendSchema.index({ requesterId: 1, status: 1 });
friendSchema.index({ status: 1, lastInteraction: -1 });

// Virtual for checking if friendship is active
friendSchema.virtual('isActive').get(function() {
  return this.status === 'accepted';
});

// Virtual for friendship duration
friendSchema.virtual('friendshipDuration').get(function() {
  if (this.respondedAt && this.status === 'accepted') {
    return Math.floor((Date.now() - this.respondedAt.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Method to accept friend request
friendSchema.methods.acceptRequest = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be accepted');
  }
  
  this.status = 'accepted';
  this.respondedAt = new Date();
  this.lastInteraction = new Date();
  
  return this.save();
};

// Method to decline friend request
friendSchema.methods.declineRequest = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be declined');
  }
  
  this.status = 'declined';
  this.respondedAt = new Date();
  
  return this.save();
};

// Method to block user
friendSchema.methods.blockUser = function(reason?: string) {
  this.status = 'blocked';
  this.blockReason = reason;
  this.lastInteraction = new Date();
  
  return this.save();
};

// Method to unblock user
friendSchema.methods.unblockUser = function() {
  if (this.status !== 'blocked') {
    throw new Error('Only blocked users can be unblocked');
  }
  
  this.status = 'pending';
  this.blockReason = undefined;
  this.respondedAt = undefined;
  
  return this.save();
};

// Method to update friendship level
friendSchema.methods.updateFriendshipLevel = function() {
  if (this.status !== 'accepted') {
    return this;
  }
  
  const { totalMatches, messagesExchanged, friendshipDuration } = this;
  
  // Calculate friendship level based on interactions
  let newLevel = 1;
  
  if (totalMatches >= 50 || messagesExchanged >= 100) {
    newLevel = 5; // Best friends
  } else if (totalMatches >= 25 || messagesExchanged >= 50) {
    newLevel = 4; // Close friends
  } else if (totalMatches >= 10 || messagesExchanged >= 25) {
    newLevel = 3; // Good friends
  } else if (totalMatches >= 3 || messagesExchanged >= 10) {
    newLevel = 2; // Friends
  }
  
  // Bonus for long-term friendship
  if (friendshipDuration >= 365) {
    newLevel = Math.min(5, newLevel + 1);
  }
  
  this.friendshipLevel = newLevel;
  this.lastInteraction = new Date();
  
  return this.save();
};

// Method to increment match count
friendSchema.methods.incrementMatchCount = function() {
  if (this.status === 'accepted') {
    this.totalMatches += 1;
    this.lastInteraction = new Date();
    return this.updateFriendshipLevel();
  }
  return this;
};

// Method to increment message count
friendSchema.methods.incrementMessageCount = function() {
  if (this.status === 'accepted') {
    this.messagesExchanged += 1;
    this.lastInteraction = new Date();
    return this.updateFriendshipLevel();
  }
  return this;
};

// Static method to find friendship between two users
friendSchema.statics.findFriendship = function(userId1: mongoose.Types.ObjectId, userId2: mongoose.Types.ObjectId) {
  return this.findOne({
    $or: [
      { requesterId: userId1, recipientId: userId2 },
      { requesterId: userId2, recipientId: userId1 }
    ]
  });
};

// Static method to get friends list for a user
friendSchema.statics.getFriendsList = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    $or: [
      { requesterId: userId, status: 'accepted' },
      { recipientId: userId, status: 'accepted' }
    ]
  }).sort({ lastInteraction: -1 });
};

// Static method to get pending requests for a user
friendSchema.statics.getPendingRequests = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    recipientId: userId,
    status: 'pending'
  }).sort({ requestedAt: -1 });
};

// Static method to get blocked users for a user
friendSchema.statics.getBlockedUsers = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    $or: [
      { requesterId: userId, status: 'blocked' },
      { recipientId: userId, status: 'blocked' }
    ]
  }).sort({ lastInteraction: -1 });
};

export default mongoose.model<IFriend>('Friend', friendSchema);