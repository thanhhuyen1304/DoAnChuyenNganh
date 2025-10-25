const axios = require('axios');
const cheerio = require('cheerio');

async function testCSESDetailed() {
  try {
    console.log('🔍 Testing CSES scraper in detail...\n');
    
    // Step 1: Get CSES page
    console.log('1️⃣ Fetching CSES page...');
    const response = await axios.get('https://cses.fi/problemset/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`✅ CSES page fetched (${response.data.length} characters)`);
    
    // Step 2: Parse with cheerio
    console.log('\n2️⃣ Parsing HTML...');
    const $ = cheerio.load(response.data);
    
    // Step 3: Try to scrape problems like the real scraper
    console.log('\n3️⃣ Scraping problems...');
    const problems = [];
    
    $('.task').each((index, element) => {
      if (index >= 10) return; // Lấy 10 bài đầu
      
      const titleElement = $(element).find('a');
      const title = titleElement.text().trim();
      const link = titleElement.attr('href');
      
      console.log(`   Processing task ${index + 1}: "${title}" (${link})`);
      
      if (title && link) {
        const problem = {
          title: `CSES: ${title}`,
          description: `Problem from CSES Problem Set - ${title}`,
          problemStatement: `Solve the problem: ${title}. This is a problem from the CSES Problem Set.`,
          difficulty: 'Medium', // Default
          language: 'C++',
          category: 'Logic',
          testCases: [
            {
              input: "5\n1 2 3 4 5",
              expectedOutput: "15",
              isHidden: false,
              points: 10
            }
          ],
          tags: ['cses', 'algorithm'],
          buggyCode: `#include <iostream>
using namespace std;

int main() {
  int n;
  cin >> n;
  int sum = 0;
  for (int i = 0; i < n; i++) {
    int x;
    cin >> x;
    sum += x;
  }
  // Bug: Missing output
  // cout << sum << endl;
  return 0;
}`,
          correctCode: `#include <iostream>
using namespace std;

int main() {
  int n;
  cin >> n;
  int sum = 0;
  for (int i = 0; i < n; i++) {
    int x;
    cin >> x;
    sum += x;
  }
  cout << sum << endl;
  return 0;
}`
        };
        
        problems.push(problem);
        console.log(`   ✅ Added: ${problem.title}`);
      } else {
        console.log(`   ❌ Skipped: Invalid title or link`);
      }
    });
    
    console.log(`\n✅ Scraped ${problems.length} problems from CSES`);
    
    // Step 4: Show first few problems
    console.log('\n4️⃣ First few problems:');
    problems.slice(0, 5).forEach((problem, index) => {
      console.log(`   ${index + 1}. ${problem.title}`);
      console.log(`      - Description: ${problem.description}`);
      console.log(`      - Language: ${problem.language}`);
      console.log(`      - Difficulty: ${problem.difficulty}`);
      console.log(`      - Tags: ${problem.tags.join(', ')}`);
      console.log('');
    });
    
    // Step 5: Test if problems would be saved
    console.log('5️⃣ Testing problem structure...');
    if (problems.length > 0) {
      const firstProblem = problems[0];
      console.log('   First problem structure:');
      console.log(`   - Title: ${firstProblem.title}`);
      console.log(`   - Description: ${firstProblem.description}`);
      console.log(`   - Language: ${firstProblem.language}`);
      console.log(`   - Difficulty: ${firstProblem.difficulty}`);
      console.log(`   - Category: ${firstProblem.category}`);
      console.log(`   - Test cases: ${firstProblem.testCases.length}`);
      console.log(`   - Tags: ${firstProblem.tags.length}`);
      console.log(`   - Buggy code length: ${firstProblem.buggyCode.length}`);
      console.log(`   - Correct code length: ${firstProblem.correctCode.length}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Headers:`, error.response.headers);
    }
  }
}

testCSESDetailed();
