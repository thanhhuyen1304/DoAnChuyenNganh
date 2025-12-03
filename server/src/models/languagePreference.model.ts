import mongoose, { Schema, Document } from 'mongoose';

export interface ILanguagePreference extends Document {
  user_id: mongoose.Types.ObjectId;
  type: string; // 'language_preference' to distinguish from favorite challenges
  languages: string[]; // Array of favorite languages
  updated_at: Date;
  created_at: Date;
}

const languagePreferenceSchema = new Schema<ILanguagePreference>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    default: 'language_preference',
    enum: ['language_preference'],
    required: true,
    index: true,
  },
  languages: [{
    type: String,
    enum: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'],
    required: true,
  }],
  updated_at: {
    type: Date,
    default: Date.now,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'favorite', // Store in 'favorite' collection
  timestamps: false, // Use custom timestamps
});

// Index for faster queries - unique combination of user_id and type
languagePreferenceSchema.index({ user_id: 1, type: 1 }, { unique: true });

// Update updated_at before saving
languagePreferenceSchema.pre('save', function(next) {
  this.updated_at = new Date();
  if (!this.created_at) {
    this.created_at = new Date();
  }
  next();
});

export const LanguagePreference = mongoose.model<ILanguagePreference>(
  'LanguagePreference',
  languagePreferenceSchema,
  'favorite'
);

