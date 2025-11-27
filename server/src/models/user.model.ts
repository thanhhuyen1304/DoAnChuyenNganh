import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  avatar?: string;
  favoriteLanguages: string[];
  experience: number;
  rank: string;
  badges: string[];
  loginMethod?: string; // 'local', 'google', 'github', 'facebook'
  oauth: {
    google?: string;
    github?: string;
    facebook?: string;
  };
  // PvP specific fields
  rating?: number; // Elo rating for PvP matchmaking
  level?: number; // User level based on experience
  role?: string; // User role (user, admin, moderator)
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
    loginMethod: {
      type: String,
      enum: ['local', 'google', 'github', 'facebook'],
      default: 'local'
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
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
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