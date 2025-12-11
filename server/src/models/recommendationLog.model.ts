import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendationLog extends Document {
  user: mongoose.Types.ObjectId;
  challenge?: mongoose.Types.ObjectId;
  suggestedChallenges: mongoose.Types.ObjectId[];
  suggestedTrainingData: mongoose.Types.ObjectId[];
  suggestedResources: string[]; // Lưu URL để tránh lệ thuộc id ngoài
  createdAt: Date;
}

const RecommendationLogSchema = new Schema<IRecommendationLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  challenge: { type: Schema.Types.ObjectId, ref: 'Challenge' },
  suggestedChallenges: [{ type: Schema.Types.ObjectId, ref: 'Challenge' }],
  suggestedTrainingData: [{ type: Schema.Types.ObjectId, ref: 'TrainingData' }],
  suggestedResources: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IRecommendationLog>('RecommendationLog', RecommendationLogSchema);
