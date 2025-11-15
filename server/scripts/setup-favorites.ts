import mongoose from 'mongoose';
import { Favorite } from '../src/models/favorite.model';
import User from '../src/models/user.model';
import Challenge from '../src/models/challenge.model';

// Type helpers for global Node vars when running as a ts-node script
declare const process: any;
declare const require: any;
declare const module: any;

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
};

async function setupFavorites() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db!;
    const collName = 'favorite';

    // Drop existing collection if present
    const existing = await db.listCollections({ name: collName }).toArray();
    if (existing.length > 0) {
      console.log(`🗑 Dropping existing collection '${collName}'`);
      await db.dropCollection(collName);
    }

    console.log(`📦 Creating collection '${collName}'`);
    await db.createCollection(collName);

    // Ensure indexes from Mongoose model
    console.log('🔐 Ensuring indexes for Favorite model');
    await (Favorite as any).createIndexes();

    // Seeding logic: you can provide SEED_USER_IDS and SEED_EXERCISE_IDS as comma separated env vars
  const seedUserIds: string[] = process.env.SEED_USER_IDS ? process.env.SEED_USER_IDS.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const seedExerciseIds: string[] = process.env.SEED_EXERCISE_IDS ? process.env.SEED_EXERCISE_IDS.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

    let inserted = 0;

    if (seedUserIds.length && seedExerciseIds.length && seedUserIds.length === seedExerciseIds.length) {
      console.log('🌱 Seeding favorites from environment variables');
      const docs: any[] = [];
      for (let i = 0; i < seedUserIds.length; i++) {
        docs.push({ user_id: new mongoose.Types.ObjectId(seedUserIds[i]), exercise_id: new mongoose.Types.ObjectId(seedExerciseIds[i]), favorited_on: new Date() });
      }
      const res = await (Favorite as any).insertMany(docs);
      inserted = res.length;
    } else {
      // Try to seed one example if possible using first user & challenge
      const user = await User.findOne();
      const challenge = await Challenge.findOne();
      if (user && challenge) {
        console.log('🌱 Seeding one favorite using first existing user and challenge');
        const doc = new (Favorite as any)({ user_id: user._id, exercise_id: challenge._id, favorited_on: new Date() });
        await doc.save();
        inserted = 1;
      } else {
        console.log('⚠️ No users or challenges found to auto-seed. Provide SEED_USER_IDS and SEED_EXERCISE_IDS env vars to seed manually.');
      }
    }

    console.log(`✅ Setup complete. Inserted ${inserted} favorite(s)`);
  } catch (error) {
    console.error('❌ Error setting up favorites:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

if (require.main === module) {
  setupFavorites();
}

export default setupFavorites;
