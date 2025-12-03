import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import User from '../src/models/user.model';
import { personalizedPlanService } from '../src/services/personalizedPlanService';

async function main() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    config({ path: envPath });

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');

    const user =
      (await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@bughunter.com' })) ||
      (await User.findOne());
    if (!user) {
      console.error('Không tìm thấy user để test');
      return;
    }

    console.log(`👤 Testing personalized plan for user: ${user.email}`);
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const plan = await personalizedPlanService.buildPlan(userId);

    console.log('\n📋 Profile Summary');
    console.log('Experience:', plan.profile.experienceLevel);
    console.log('Focus Categories:', plan.profile.focusCategories.join(', ') || 'N/A');
    console.log('Focus Tags:', plan.profile.focusTags.join(', ') || 'N/A');
    console.log('Preferred Languages:', plan.profile.preferredLanguages.join(', ') || 'N/A');

    console.log('\n🎯 Recommended Challenges');
    plan.recommendations.challenges.forEach((rec, idx) => {
      console.log(
        `${idx + 1}. ${rec.data.title} (${rec.data.category} - ${rec.data.difficulty}) - ${
          Math.round(rec.score * 100) / 100
        }`
      );
    });

    console.log('\n📚 Recommended Training Data');
    plan.recommendations.trainingData.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.data.question} (${rec.data.category}) - ${rec.score.toFixed(2)}`);
    });

    console.log('\n🛤️ Learning Path');
    plan.learningPath.slice(0, 6).forEach((step) => {
      console.log(
        `${step.step}. [${step.type}] ${step.title} - ${step.category || ''} ${step.difficulty || ''}`
      );
    });
  } catch (error) {
    console.error('❌ Test personalized plan error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

main();

