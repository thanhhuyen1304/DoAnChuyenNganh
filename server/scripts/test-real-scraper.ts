import mongoose from 'mongoose';
import { RealProblemScraper } from '../src/services/realProblemScraper';
import User from '../src/models/user.model';

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com'
};

async function testRealScraper() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Tìm admin user
    const admin = await User.findOne({ email: ENV.ADMIN_EMAIL });
    if (!admin) {
      console.error('❌ Không tìm thấy admin user');
      return;
    }

    console.log(`👤 Tìm thấy admin: ${admin.username}`);

    // Test scrape từ LeetCode
    console.log('\n🚀 Testing LeetCode scraper...');
    const leetcodeProblems = await RealProblemScraper.scrapeLeetCode();
    console.log(`📊 LeetCode: ${leetcodeProblems.length} problems`);

    if (leetcodeProblems.length > 0) {
      console.log('📝 Sample LeetCode problem:');
      console.log(`   Title: ${leetcodeProblems[0].title}`);
      console.log(`   Difficulty: ${leetcodeProblems[0].difficulty}`);
      console.log(`   Tags: ${leetcodeProblems[0].tags.join(', ')}`);
    }

    // Test scrape từ CSES
    console.log('\n🚀 Testing CSES scraper...');
    const csesProblems = await RealProblemScraper.scrapeCSES();
    console.log(`📊 CSES: ${csesProblems.length} problems`);

    if (csesProblems.length > 0) {
      console.log('📝 Sample CSES problem:');
      console.log(`   Title: ${csesProblems[0].title}`);
      console.log(`   Difficulty: ${csesProblems[0].difficulty}`);
      console.log(`   Tags: ${csesProblems[0].tags.join(', ')}`);
    }

    // Test scrape từ AtCoder
    console.log('\n🚀 Testing AtCoder scraper...');
    const atcoderProblems = await RealProblemScraper.scrapeAtCoder();
    console.log(`📊 AtCoder: ${atcoderProblems.length} problems`);

    if (atcoderProblems.length > 0) {
      console.log('📝 Sample AtCoder problem:');
      console.log(`   Title: ${atcoderProblems[0].title}`);
      console.log(`   Difficulty: ${atcoderProblems[0].difficulty}`);
      console.log(`   Tags: ${atcoderProblems[0].tags.join(', ')}`);
    }

    // Lưu một số problems vào database để test
    const allProblems = [...leetcodeProblems.slice(0, 2), ...csesProblems.slice(0, 2), ...atcoderProblems.slice(0, 2)];
    
    if (allProblems.length > 0) {
      console.log(`\n💾 Saving ${allProblems.length} problems to database...`);
      await RealProblemScraper.saveProblemsToDB(allProblems, (admin._id as any).toString());
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

// Chạy test
testRealScraper();
