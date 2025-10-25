const mongoose = require('mongoose');
const { RealProblemScraper } = require('../src/services/realProblemScraper');

async function testCSESDirect() {
  try {
    console.log('🔍 Testing CSES scraper directly...\n');
    
    // Step 1: Connect to database
    console.log('1️⃣ Connecting to database...');
    await mongoose.connect('mongodb://localhost:27017/bughunter');
    console.log('✅ Connected to MongoDB');
    
    // Step 2: Test CSES scraper
    console.log('\n2️⃣ Testing CSES scraper...');
    const problems = await RealProblemScraper.scrapeCSES();
    console.log(`✅ Scraped ${problems.length} problems`);
    
    // Step 3: Show first few problems
    if (problems.length > 0) {
      console.log('\n3️⃣ First few problems:');
      problems.slice(0, 3).forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem.title}`);
        console.log(`      - Description: ${problem.description}`);
        console.log(`      - Language: ${problem.language}`);
        console.log(`      - Difficulty: ${problem.difficulty}`);
        console.log(`      - Tags: ${problem.tags.join(', ')}`);
        console.log('');
      });
    }
    
    // Step 4: Test saving to database
    if (problems.length > 0) {
      console.log('\n4️⃣ Testing save to database...');
      const adminId = '68e9aef690945482f3158ac2'; // Use existing admin ID
      const classificationSettings = {
        language: 'C++',
        difficulty: 'Medium',
        category: 'Logic',
        points: 25
      };
      
      try {
        await RealProblemScraper.saveProblemsToDB(problems, adminId, classificationSettings);
        console.log('✅ Problems saved to database successfully');
      } catch (error) {
        console.log('❌ Error saving to database:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

testCSESDirect();
