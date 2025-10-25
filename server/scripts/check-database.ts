import mongoose from 'mongoose';
import Challenge from '../src/models/challenge.model';
import User from '../src/models/user.model';

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter');
    console.log('✅ Connected to MongoDB');

    // Count total challenges
    const totalChallenges = await Challenge.countDocuments();
    console.log(`📊 Total challenges in database: ${totalChallenges}`);

    if (totalChallenges === 0) {
      console.log('❌ No challenges found in database!');
      return;
    }

    // Get all challenges
    const challenges = await Challenge.find({})
      .select('title isActive createdAt createdBy')
      .sort({ createdAt: -1 });

    console.log('\n📋 Recent challenges:');
    challenges.slice(0, 10).forEach((challenge, index) => {
      console.log(`${index + 1}. ${challenge.title}`);
      console.log(`   - Active: ${challenge.isActive}`);
      console.log(`   - Created: ${challenge.createdAt}`);
      console.log(`   - Created by ID: ${challenge.createdBy}`);
      console.log('');
    });

    // Check active vs inactive
    const activeChallenges = await Challenge.countDocuments({ isActive: true });
    const inactiveChallenges = await Challenge.countDocuments({ isActive: false });

    console.log(`📈 Statistics:`);
    console.log(`   Active: ${activeChallenges}`);
    console.log(`   Inactive: ${inactiveChallenges}`);

    // Check by source
    const csesChallenges = await Challenge.countDocuments({ title: { $regex: 'CSES:', $options: 'i' } });
    const atcoderChallenges = await Challenge.countDocuments({ title: { $regex: 'AtCoder:', $options: 'i' } });
    const leetcodeChallenges = await Challenge.countDocuments({ title: { $regex: 'LeetCode:', $options: 'i' } });

    console.log(`\n🌐 By source:`);
    console.log(`   CSES: ${csesChallenges}`);
    console.log(`   AtCoder: ${atcoderChallenges}`);
    console.log(`   LeetCode: ${leetcodeChallenges}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkDatabase();
