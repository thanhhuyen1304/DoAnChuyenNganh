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