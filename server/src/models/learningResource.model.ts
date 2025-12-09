import mongoose, { Schema, Document } from 'mongoose';

export type LearningResourceType = 'article' | 'video' | 'exercise' | 'doc';
export type LearningDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ILearningResource extends Document {
  title: string;
  url: string;
  type: LearningResourceType;
  language?: string; // e.g. 'python', 'javascript'
  errorTypes: string[]; // e.g. ['syntax', 'runtime']
  tags?: string[];
  category?: string;
  difficulty?: LearningDifficulty;
  qualityScore?: number; // feedback-based score
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const learningResourceSchema = new Schema<ILearningResource>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: ['article', 'video', 'exercise', 'doc'], required: true },
    language: { type: String, lowercase: true, trim: true },
    errorTypes: [{ type: String, lowercase: true, trim: true, index: true }],
    tags: [{ type: String, lowercase: true, trim: true }],
    category: { type: String, lowercase: true, trim: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    qualityScore: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

learningResourceSchema.index({ errorTypes: 1, language: 1, difficulty: 1, isActive: 1 });
learningResourceSchema.index({ tags: 1 });

const LearningResource = mongoose.model<ILearningResource>('LearningResource', learningResourceSchema);
export default LearningResource;


