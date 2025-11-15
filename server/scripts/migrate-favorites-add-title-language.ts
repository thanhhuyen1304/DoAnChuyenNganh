import mongoose from 'mongoose';
import { Favorite } from '../src/models/favorite.model';
import Challenge from '../src/models/challenge.model';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
};

async function migrateFavorites() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all favorites that are missing title or language
    const favoritesToUpdate = await Favorite.find({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' },
        { language: { $exists: false } },
        { language: null },
        { language: '' }
      ]
    });

    console.log(`📊 Found ${favoritesToUpdate.length} favorite(s) that need to be updated`);

    if (favoritesToUpdate.length === 0) {
      console.log('✅ All favorites already have title and language. Nothing to migrate.');
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each favorite
    for (const favorite of favoritesToUpdate) {
      try {
        // Fetch challenge details
        const challenge = await Challenge.findById(favorite.exercise_id)
          .select('title language')
          .lean();

        if (!challenge) {
          console.warn(`⚠️  Challenge ${favorite.exercise_id} not found for favorite ${favorite._id}. Skipping...`);
          skipped++;
          continue;
        }

        // Update favorite with title and language
        await Favorite.updateOne(
          { _id: favorite._id },
          {
            $set: {
              title: challenge.title,
              language: challenge.language
            }
          }
        );

        updated++;
        console.log(`✅ Updated favorite ${favorite._id} - Title: "${challenge.title}", Language: ${challenge.language}`);
      } catch (error: any) {
        console.error(`❌ Error updating favorite ${favorite._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    // Verify migration
    const remainingToUpdate = await Favorite.countDocuments({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' },
        { language: { $exists: false } },
        { language: null },
        { language: '' }
      ]
    });

    if (remainingToUpdate === 0) {
      console.log('\n✅ Migration completed successfully! All favorites now have title and language.');
    } else {
      console.log(`\n⚠️  Warning: ${remainingToUpdate} favorite(s) still need to be updated.`);
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

if (require.main === module) {
  migrateFavorites();
}

export default migrateFavorites;

