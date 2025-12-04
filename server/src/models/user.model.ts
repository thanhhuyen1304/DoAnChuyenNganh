import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUnlockedSolution {
  challengeId: mongoose.Types.ObjectId;
  solutionIndex: number;
  unlockedAt: Date;
}

export interface ICompletedChallenge {
  challengeId: mongoose.Types.ObjectId;
  completedAt: Date;
  maxScoreAchieved: number;
  tokenAwarded: boolean;
}

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  resetCode?: string;
  resetCodeExpires?: Date;
  avatar?: string;
  phone?: string;
  favoriteLanguages: string[];
  experience: number;
  rank: string;
  badges: string[];
  tokens: number;
  unlockedSolutions: IUnlockedSolution[];
  completedChallenges: ICompletedChallenge[];
  loginMethod?: string; // 'local', 'google', 'github', 'facebook'
  role?: string; // 'user', 'moderator', 'admin'
  isBanned?: boolean;
  banReason?: string;
  bannedUntil?: Date;
  oauth: {
    google?: string;
    github?: string;
    facebook?: string;
  };
  // PvP specific fields
  rating?: number; // Elo rating for PvP matchmaking
  level?: number; // User level based on experience
  // PvP statistics
  pvpStats?: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
    currentStreak: number;
    bestStreak: number;
    averageCompletionTime: number;
  };
  // User settings
  settings?: {
    background?: {
      id: string;
      url: string;
      label?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Tên người dùng là bắt buộc'],
      unique: true,
      trim: true,
      minlength: [3, 'Tên người dùng phải có ít nhất 3 ký tự'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    favoriteLanguages: [{
      type: String,
      enum: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'],
    }],
    experience: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      enum: ['Newbie', 'Junior', 'Intermediate', 'Senior', 'Expert'],
      default: 'Newbie',
    },
    badges: [{
      type: String,
    }],
    tokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    unlockedSolutions: [{
      challengeId: {
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
      },
      solutionIndex: {
        type: Number,
        required: true,
      },
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    completedChallenges: [{
      challengeId: {
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
      },
      completedAt: {
        type: Date,
        default: Date.now,
      },
      maxScoreAchieved: {
        type: Number,
        default: 0,
      },
      tokenAwarded: {
        type: Boolean,
        default: false,
      },
    }],
    loginMethod: {
      type: String,
      enum: ['local', 'google', 'github', 'facebook'],
      default: 'local'
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user'
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      trim: true,
    },
    bannedUntil: {
      type: Date,
    },
    oauth: {
      google: String,
      github: String,
      facebook: String,
    },
    // PvP specific fields
    rating: {
      type: Number,
      default: 1200, // Default Elo rating
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    // PvP statistics
    pvpStats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
      averageCompletionTime: { type: Number, default: 0 },
    }
    ,
    resetCode: {
      type: String,
      default: undefined,
      select: false,
    },
    resetCodeExpires: {
      type: Date,
      default: undefined,
    },
    // User settings (theme, background, etc.)
    settings: {
      background: {
        id: { type: String },
        url: { type: String },
        label: { type: String },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);