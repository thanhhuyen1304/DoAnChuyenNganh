import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  user_id: mongoose.Types.ObjectId;
  exercise_id: mongoose.Types.ObjectId;
  title: string;
  language: string;
  favorited_on: Date;
}

const favoriteSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exercise_id: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge', // keep Challenge as ref name used in project
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    required: true,
    enum: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C']
  },
  favorited_on: {
    type: Date,
    default: Date.now
  }
}, {
  // store in the existing collection name you showed in DB (singular 'favorite')
  collection: 'favorite'
});

// Ensure one user can only favorite an exercise once
favoriteSchema.index({ user_id: 1, exercise_id: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema, 'favorite');