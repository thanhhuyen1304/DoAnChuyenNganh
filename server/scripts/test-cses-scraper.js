const axios = require('axios');
const cheerio = require('cheerio');

async function testCSESScraper() {
  try {
    console.log('🔍 Testing CSES scraper directly...\n');
    
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
    
    // Check for different selectors
    console.log('   Checking for .task elements:', $('.task').length);
    console.log('   Checking for .task-list elements:', $('.task-list').length);
    console.log('   Checking for table rows:', $('table tr').length);
    console.log('   Checking for links:', $('a').length);
    
    // Step 3: Try to find problems
    console.log('\n3️⃣ Looking for problems...');
    
    // Try .task selector
    const taskElements = $('.task');
    console.log(`   Found ${taskElements.length} .task elements`);
    
    if (taskElements.length > 0) {
      console.log('   First few .task elements:');
      taskElements.slice(0, 3).each((index, element) => {
        const title = $(element).find('a').text().trim();
        const link = $(element).find('a').attr('href');
        console.log(`     ${index + 1}. ${title} (${link})`);
      });
    }
    
    // Try alternative selectors
    console.log('\n4️⃣ Trying alternative selectors...');
    
    // Look for any links that might be problems
    const allLinks = $('a');
    console.log(`   Total links found: ${allLinks.length}`);
    
    const problemLinks = allLinks.filter((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      return href && href.includes('/problemset/') && text.length > 0;
    });
    
    console.log(`   Problem links found: ${problemLinks.length}`);
    
    if (problemLinks.length > 0) {
      console.log('   First few problem links:');
      problemLinks.slice(0, 5).each((index, element) => {
        const title = $(element).text().trim();
        const link = $(element).attr('href');
        console.log(`     ${index + 1}. ${title} (${link})`);
      });
    }
    
    // Step 4: Check page structure
    console.log('\n5️⃣ Page structure analysis...');
    console.log('   Page title:', $('title').text());
    console.log('   Has .task class:', $('.task').length > 0);
    console.log('   Has .task-list class:', $('.task-list').length > 0);
    console.log('   Has table:', $('table').length > 0);
    console.log('   Has list:', $('ul, ol').length > 0);
    
    // Step 5: Try to find any problem-related content
    console.log('\n6️⃣ Looking for problem-related content...');
    const problemKeywords = ['problem', 'task', 'exercise', 'challenge'];
    
    problemKeywords.forEach(keyword => {
      const elements = $(`*:contains("${keyword}")`).not('script, style');
      console.log(`   Elements containing "${keyword}": ${elements.length}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Headers:`, error.response.headers);
    }
  }
}

testCSESScraper();
