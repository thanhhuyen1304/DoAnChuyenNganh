import mongoose, { Schema, Document } from 'mongoose';

export type ResourceRating = 'up' | 'down';

export interface IResourceFeedback extends Document {
  userId?: string;
  url: string;
  title?: string;
  source?: 'google' | 'youtube' | 'internal';
  rating: ResourceRating;
  comment?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resourceFeedbackSchema = new Schema<IResourceFeedback>(
  {
    userId: { type: String, index: true },
    url: { type: String, required: true, trim: true, index: true },
    title: { type: String, trim: true },
    source: { type: String, enum: ['google', 'youtube', 'internal'], default: 'google' },
    rating: { type: String, enum: ['up', 'down'], required: true },
    comment: { type: String, trim: true },
    language: { type: String, lowercase: true, trim: true },
  },
  {
    timestamps: true,
  }
);

resourceFeedbackSchema.index({ url: 1, userId: 1 });

const ResourceFeedback = mongoose.model<IResourceFeedback>('ResourceFeedback', resourceFeedbackSchema);

export default ResourceFeedback;


