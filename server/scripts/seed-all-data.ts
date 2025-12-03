/**
 * Script Master: Seed Tất Cả Dữ Liệu Mẫu
 * Chạy tất cả các seed scripts để hoàn thành các phần chưa đạt
 * 
 * Usage:
 *   npx ts-node scripts/seed-all-data.ts
 */

import { seedTrainingData } from './seed-training-data';
import { seedChallenges } from './seed-challenges';

async function seedAllData() {
  console.log('='.repeat(70));
  console.log('🚀 SEED TẤT CẢ DỮ LIỆU MẪU');
  console.log('='.repeat(70));
  console.log();

  try {
    // 1. Seed Training Data
    console.log('📚 Bước 1: Seed Training Data...');
    console.log('─'.repeat(70));
    await seedTrainingData();
    console.log();

    // 2. Seed Challenges
    console.log('🏆 Bước 2: Seed Challenges...');
    console.log('─'.repeat(70));
    await seedChallenges();
    console.log();

    console.log('='.repeat(70));
    console.log('✅ HOÀN THÀNH SEED TẤT CẢ DỮ LIỆU');
    console.log('='.repeat(70));
    console.log();
    console.log('📝 Bước tiếp theo:');
    console.log('   1. Tạo user submissions bằng cách làm bài tập trên website');
    console.log('   2. Test chatbot để tạo chat history');
    console.log('   3. Chạy lại test: npx ts-node scripts/test-chatbot-data-integration.ts');
    console.log();

  } catch (error: any) {
    console.error('❌ Lỗi khi seed dữ liệu:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seed all
if (require.main === module) {
  seedAllData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedAllData };

