import axios from 'axios';
import * as cheerio from 'cheerio';
import Challenge from '../models/challenge.model';

interface ScrapedProblem {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  category: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    points: number;
  }>;
  tags: string[];
  problemStatement: string;
  buggyCode: string;
  correctCode: string;
}

export class RealProblemScraper {
  
  // Scrape từ LeetCode (sử dụng API công khai)
  static async scrapeLeetCode(skipCount: number = 0, requestedLanguage?: string): Promise<ScrapedProblem[]> {
    try {
      console.log('🔍 Scraping LeetCode...');
      
      // LeetCode GraphQL API
      const query = `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(
            categorySlug: $categorySlug
            limit: $limit
            skip: $skip
            filters: $filters
          ) {
            questions: data {
              questionId
              title
              titleSlug
              difficulty
              content
              exampleTestcases
              codeSnippets {
                lang
                langSlug
                code
              }
              topicTags {
                name
                slug
              }
            }
          }
        }
      `;

      const variables = {
        categorySlug: "",
        skip: skipCount,
        limit: 50,
        filters: {}
      };

      const response = await axios.post('https://leetcode.com/graphql/', {
        query,
        variables
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const problems: ScrapedProblem[] = [];
      const questions = response.data.data.problemsetQuestionList.questions;

      // Map requested language to LeetCode langSlug
      const langMap: Record<string, string[]> = {
        'JavaScript': ['javascript', 'typescript'],
        'Python': ['python3', 'python'],
        'Java': ['java'],
        'C++': ['cpp', 'c++'],
        'C': ['c'],
        'C#': ['csharp', 'c#']
      };

      const targetLang = requestedLanguage || 'JavaScript';
      const langSlugs = langMap[targetLang] || ['javascript', 'typescript'];

      for (const question of questions.slice(0, 10)) { // Lấy 10 bài đầu
        // Lấy code snippet từ LeetCode phù hợp với ngôn ngữ yêu cầu
        let codeSnippet = question.codeSnippets?.find((snippet: any) => 
          langSlugs.includes(snippet.langSlug?.toLowerCase())
        );
        
        // Fallback to first available snippet if not found
        if (!codeSnippet) {
          codeSnippet = question.codeSnippets?.[0];
        }

        // Normalize language name to match Challenge model enum
        const normalizedLang = this.normalizeLanguage(targetLang);

        const problem: ScrapedProblem = {
          title: `LeetCode: ${question.title}`,
          description: `Problem from LeetCode - ${question.title}`,
          problemStatement: this.cleanHtml(question.content || ''),
          difficulty: this.mapLeetCodeDifficulty(question.difficulty),
          language: normalizedLang,
          category: 'Logic',
          testCases: this.parseLeetCodeTestCases(question.exampleTestcases, question.title),
          tags: question.topicTags?.map((tag: any) => tag.slug) || ['leetcode'],
          buggyCode: this.generateBuggyCodeForProblem(this.mapToInternalLanguage(normalizedLang), question.title, question.titleSlug, codeSnippet?.code),
          correctCode: this.generateCorrectCodeForProblem(this.mapToInternalLanguage(normalizedLang), question.title, question.titleSlug, codeSnippet?.code)
        };

        problems.push(problem);
      }

      console.log(`✅ Scraped ${problems.length} problems from LeetCode`);
      return problems;

    } catch (error) {
      console.error('❌ Error scraping LeetCode:', error);
      return [];
    }
  }

  // Scrape từ CSES Problem Set
  static async scrapeCSES(requestedLanguage?: string): Promise<ScrapedProblem[]> {
    try {
      console.log('🔍 Scraping CSES...');
      
      const response = await axios.get('https://cses.fi/problemset/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`📄 CSES page fetched (${response.data.length} characters)`);
      const $ = cheerio.load(response.data);
      const problems: ScrapedProblem[] = [];

      console.log(`🔍 Found ${$('.task').length} .task elements`);

      $('.task').each((index, element) => {
        if (index >= 10) return; // Lấy 10 bài đầu

        const titleElement = $(element).find('a');
        const title = titleElement.text().trim();
        const link = titleElement.attr('href');

        console.log(`   Processing task ${index + 1}: "${title}" (${link})`);

        if (title && link) {
          const targetLang = requestedLanguage || 'C++';
          const normalizedLang = this.normalizeLanguage(targetLang);
          const internalLang = this.mapToInternalLanguage(normalizedLang);

          const problem: ScrapedProblem = {
            title: `CSES: ${title}`,
            description: `Problem from CSES Problem Set - ${title}`,
            problemStatement: `Solve the problem: ${title}. This is a problem from the CSES Problem Set.`,
            difficulty: this.mapCSESDifficulty(title),
            language: normalizedLang,
            category: 'Logic',
            testCases: this.generateTestCasesForProblem(internalLang, title, index),
            tags: ['cses', 'algorithm'],
            buggyCode: this.generateBuggyCodeForProblem(internalLang, title, link, undefined),
            correctCode: this.generateCorrectCodeForProblem(internalLang, title, link, undefined)
          };

          problems.push(problem);
          console.log(`   ✅ Added: ${problem.title}`);
        } else {
          console.log(`   ❌ Skipped: Invalid title or link`);
        }
      });

      console.log(`✅ Scraped ${problems.length} problems from CSES`);
      return problems;

    } catch (error) {
      console.error('❌ Error scraping CSES:', error);
      return [];
    }
  }

  // Scrape từ AtCoder
  static async scrapeAtCoder(requestedLanguage?: string): Promise<ScrapedProblem[]> {
    try {
      console.log('🔍 Scraping AtCoder...');
      
      const response = await axios.get('https://atcoder.jp/contests/archive', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const problems: ScrapedProblem[] = [];

      $('tbody tr').each((index, element) => {
        if (index >= 5) return; // Lấy 5 contest đầu

        const contestName = $(element).find('td').eq(1).text().trim();
        const contestLink = $(element).find('td').eq(1).find('a').attr('href');

        if (contestName && contestLink) {
          const targetLang = requestedLanguage || 'C++';
          const normalizedLang = this.normalizeLanguage(targetLang);
          const internalLang = this.mapToInternalLanguage(normalizedLang);

          const problem: ScrapedProblem = {
            title: `AtCoder: ${contestName}`,
            description: `Contest problem from AtCoder - ${contestName}`,
            problemStatement: `Solve the contest problem: ${contestName}. This is a problem from AtCoder competitive programming platform.`,
            difficulty: this.mapAtCoderDifficulty(contestName),
            language: normalizedLang,
            category: 'Logic',
            testCases: this.generateTestCasesForProblem(internalLang, contestName, index),
            tags: ['atcoder', 'competitive-programming'],
            buggyCode: this.generateBuggyCodeForProblem(internalLang, contestName, contestLink, undefined),
            correctCode: this.generateCorrectCodeForProblem(internalLang, contestName, contestLink, undefined)
          };

          problems.push(problem);
        }
      });

      console.log(`✅ Scraped ${problems.length} problems from AtCoder`);
      return problems;

    } catch (error) {
      console.error('❌ Error scraping AtCoder:', error);
      return [];
    }
  }

  // Lưu problems vào database
  static async saveProblemsToDB(problems: ScrapedProblem[], adminId: string, classificationSettings?: any, desiredCount: number = 10): Promise<number> {
    try {
      console.log(`\n💾 Starting save operation...`);
      console.log(`   Total problems to process: ${problems.length}`);
      console.log(`   Desired count: ${desiredCount}`);
      console.log(`   Classification settings:`, classificationSettings);
      
      let savedCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;
      
      for (const problem of problems) {
        if (savedCount >= desiredCount) {
          console.log(`\n✅ Reached desired count of ${desiredCount} problems`);
          break;
        }

        // Chuẩn hóa title
        let normalizedTitle = problem.title.replace(/\s+/g, ' ').trim();
        
        // Đảm bảo ngôn ngữ được sử dụng đúng từ classificationSettings
        const finalLanguage = classificationSettings?.language || problem.language;
        const normalizedFinalLang = this.normalizeLanguage(finalLanguage);
        const internalLang = this.mapToInternalLanguage(normalizedFinalLang);

        // Tạo unique identifier cho bài: title + language + source
        // Điều này đảm bảo cùng một bài từ nguồn khác nhau hoặc ngôn ngữ khác nhau sẽ có code khác nhau
        const sourceIdentifier = problem.title.includes('LeetCode') ? 'leetcode' : 
                                  problem.title.includes('CSES') ? 'cses' : 
                                  problem.title.includes('AtCoder') ? 'atcoder' : 'unknown';
        
        // Tạo hash seed từ title + language + source để đảm bảo code unique
        const uniqueSeed = `${normalizedTitle}_${normalizedFinalLang}_${sourceIdentifier}`;
        const uniqueHash = this.simpleHash(uniqueSeed);
        
        // Kiểm tra duplicate dựa trên title + language + source
        const existingChallenge = await Challenge.findOne({
          $or: [
            { 
              title: normalizedTitle,
              language: normalizedFinalLang,
              tags: { $in: [sourceIdentifier] }
            },
            {
              title: { $regex: new RegExp('^' + normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*', 'i') },
              language: normalizedFinalLang,
              tags: { $in: [sourceIdentifier] }
            }
          ]
        });
        
        if (existingChallenge) {
          console.log(`⏭️  Duplicate found: "${normalizedTitle}" (${normalizedFinalLang}) from ${sourceIdentifier} - skipping`);
          duplicateCount++;
          continue;
        }

        // Generate code với unique seed để đảm bảo mỗi bài có code khác nhau
        // Sử dụng uniqueHash để thay đổi bugType và các biến khác
        const bugTypeFromHash = uniqueHash % 6;
        console.log(`   🔨 Generating code for: ${normalizedTitle} (${normalizedFinalLang}, ${sourceIdentifier}, hash: ${uniqueHash})`);
        
        // Regenerate code để đảm bảo unique dựa trên title + language + source
        const buggyCode = this.generateBuggyCodeForProblem(
          internalLang, 
          normalizedTitle, 
          uniqueSeed,  // Pass unique seed thay vì empty string
          problem.buggyCode,  // Pass existing code để check if has implementation
          bugTypeFromHash  // Use hash-based bug type
        );
        
        const correctCode = this.generateCorrectCodeForProblem(
          internalLang, 
          normalizedTitle, 
          uniqueSeed,
          problem.correctCode,  // Pass existing code để check if has implementation
          bugTypeFromHash
        );

        const challenge = new Challenge({
          title: problem.title,
          description: problem.description,
          problemStatement: problem.problemStatement,
          difficulty: classificationSettings?.difficulty || problem.difficulty,
          language: normalizedFinalLang, // Sử dụng ngôn ngữ đã normalize
          category: classificationSettings?.category || problem.category,
          testCases: problem.testCases,
          tags: [...(problem.tags || []), sourceIdentifier], // Add source identifier to tags
          buggyCode: buggyCode,
          correctCode: correctCode,
          createdBy: adminId,
          isActive: true,
          points: classificationSettings?.points || this.calculatePoints(problem.difficulty),
          timeLimit: 2,
          memoryLimit: 256
        });

        try {
          await challenge.save();
          savedCount++;
          console.log(`✅ Saved: ${problem.title}`);
          console.log(`   - Language: ${challenge.language} (normalized from ${problem.language})`);
          console.log(`   - Difficulty: ${challenge.difficulty}`);
          console.log(`   - Category: ${challenge.category}`);
          console.log(`   - Points: ${challenge.points}`);
          console.log(`   - IsActive: ${challenge.isActive}`);
          console.log(`   - Code Language: ${internalLang}`);
        } catch (saveError) {
          console.error(`❌ Error saving problem ${problem.title}:`, saveError);
          errorCount++;
          continue;
        }
      }

      console.log(`\n📊 Final Statistics:`);
      console.log(`   ✅ Successfully saved: ${savedCount} problems`);
      console.log(`   ⚠️ Duplicates skipped: ${duplicateCount} problems`);
      console.log(`   ❌ Errors encountered: ${errorCount} problems`);
      console.log(`   💯 Success rate: ${((savedCount / problems.length) * 100).toFixed(1)}%`);

      // Verify final count in database
      const totalInDb = await Challenge.countDocuments({});
      console.log(`\n🔍 Database verification:`);
      console.log(`   Current total in database: ${totalInDb}`);

      return savedCount;

    } catch (error) {
      console.error('❌ Error in saveProblemsToDB:', error);
      throw new Error(`Failed to save problems: ${error.message}`);
    }
  }
  
  // Helper method để lấy thêm bài khi không đủ số lượng mong muốn
  private static async getMoreProblems(source: 'leetcode' | 'cses' | 'atcoder', skipCount: number): Promise<ScrapedProblem[]> {
    switch(source) {
      case 'leetcode':
        return this.scrapeLeetCode(skipCount);
      case 'cses':
        return this.scrapeCSES(); // Có thể thêm logic phân trang nếu cần
      case 'atcoder':
        return this.scrapeAtCoder(); // Có thể thêm logic phân trang nếu cần
      default:
        return [];
    }
  }

  // Helper methods
  private static cleanHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private static mapLeetCodeDifficulty(difficulty: string): 'Easy' | 'Medium' | 'Hard' {
    switch (difficulty) {
      case 'Easy': return 'Easy';
      case 'Medium': return 'Medium';
      case 'Hard': return 'Hard';
      default: return 'Medium';
    }
  }

  private static mapCSESDifficulty(title: string): 'Easy' | 'Medium' | 'Hard' {
    if (title.includes('Easy') || title.includes('Basic') || title.includes('Introductory')) return 'Easy';
    if (title.includes('Hard') || title.includes('Advanced') || title.includes('Expert')) return 'Hard';
    return 'Medium';
  }

  private static mapAtCoderDifficulty(contestName: string): 'Easy' | 'Medium' | 'Hard' {
    if (contestName.includes('ABC') || contestName.includes('Beginner')) return 'Easy';
    if (contestName.includes('ARC') || contestName.includes('Regular')) return 'Medium';
    return 'Hard';
  }

  private static parseLeetCodeTestCases(testCases: string, problemTitle?: string): Array<{input: string, expectedOutput: string, isHidden: boolean, points: number}> {
    if (!testCases) {
      return this.generateTestCasesForProblem('javascript', problemTitle || '', 0);
    }
    
    const lines = testCases.split('\n').filter(line => line.trim());
    const testCasesArray = [];
    
    // Parse LeetCode test case format (usually input and output on separate lines)
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        testCasesArray.push({
          input: lines[i].trim(),
          expectedOutput: lines[i + 1].trim(),
          isHidden: testCasesArray.length > 0, // First is public, rest are hidden
          points: 10
        });
      }
    }
    
    // Nếu không parse được, generate dựa trên problem title
    if (testCasesArray.length === 0) {
      return this.generateTestCasesForProblem('javascript', problemTitle || '', 0);
    }
    
    // Thêm thêm test cases ẩn nếu chỉ có 1 test case
    if (testCasesArray.length === 1) {
      testCasesArray.push({
        input: this.generateVariedInput(testCasesArray[0].input),
        expectedOutput: this.generateVariedOutput(testCasesArray[0].expectedOutput),
        isHidden: true,
        points: 10
      });
    }
    
    return testCasesArray;
  }

  private static generateVariedInput(originalInput: string): string {
    // Tạo input khác biệt dựa trên input gốc
    const numbers = originalInput.match(/\d+/g);
    if (numbers) {
      const varied = numbers.map(n => String(Number(n) + 10)).join(' ');
      return varied.length > 0 ? varied : originalInput;
    }
    return originalInput;
  }

  private static generateVariedOutput(originalOutput: string): string {
    // Tạo output khác biệt dựa trên output gốc
    const numbers = originalOutput.match(/\d+/g);
    if (numbers) {
      const varied = numbers.map(n => String(Number(n) + 10)).join(' ');
      return varied.length > 0 ? varied : originalOutput;
    }
    return originalOutput;
  }

  private static generateSampleTestCases() {
    return [
      {
        input: "5\n1 2 3 4 5",
        expectedOutput: "15",
        isHidden: false,
        points: 10
      },
      {
        input: "3\n10 20 30",
        expectedOutput: "60",
        isHidden: true,
        points: 10
      }
    ];
  }

  // Check if template code has actual implementation or just signature
  private static hasImplementation(code: string, language: string): boolean {
    if (!code || code.trim().length < 50) {
      return false; // Code quá ngắn, chỉ có signature
    }

    const codeLower = code.toLowerCase();
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    
    // Nếu chỉ có 1-2 dòng, có thể chỉ là signature
    if (lines.length <= 2) {
      return false;
    }

    // Check xem có body code thực sự không (không chỉ là signature + empty lines)
    const hasBody = code.match(/\{[^}]{10,}|def\s+\w+.*:\s*\n\s+\w|function\s+\w+.*\{\s*\n\s+\w|class\s+\w+.*:\s*\n\s+def|public\s+\w+.*\{\s*\n\s+\w/);
    if (!hasBody) {
      return false;
    }

    // Check xem có logic code không (assignments, loops, conditions, etc.)
    const hasLogic = code.match(/if\s*\(|for\s*\(|while\s*\(|=\s*[^=]|return\s+[^;]|\w+\s*\+\s*|=|\w+\[/);
    return hasLogic !== null;
  }

  // Generate unique buggy code for each problem based on title/slug
  private static generateBuggyCodeForProblem(language: string, title: string, slug?: string, templateCode?: string, bugTypeOverride?: number): string {
    // Tạo hash từ title + slug để có tính nhất quán nhưng vẫn khác nhau
    // Nếu có slug (uniqueSeed), dùng nó để tạo hash unique
    const hashSeed = slug && slug.includes('_') ? slug : title;
    const hash = this.simpleHash(hashSeed);
    const bugType = bugTypeOverride !== undefined ? bugTypeOverride : (hash % 6); // 6 loại bug khác nhau
    
    // Generate code dựa trên problem characteristics
    const isArrayProblem = title.toLowerCase().includes('array') || title.toLowerCase().includes('list');
    const isStringProblem = title.toLowerCase().includes('string') || title.toLowerCase().includes('substring') || title.toLowerCase().includes('convert');
    const isMathProblem = title.toLowerCase().includes('sum') || title.toLowerCase().includes('add') || title.toLowerCase().includes('number');
    const isTwoSum = title.toLowerCase().includes('two sum');
    const isZigZag = title.toLowerCase().includes('zigzag') || title.toLowerCase().includes('zig') || title.toLowerCase().includes('convert');

    // Nếu có template code VÀ có implementation, thì dùng template và introduce bug
    if (templateCode && this.hasImplementation(templateCode, language)) {
      console.log(`   📝 Using template code with implementation for: ${title}`);
      return this.introduceBugToCode(templateCode, bugType, language);
    }

    // Nếu không có template hoặc template chỉ có signature, generate full code
    console.log(`   🔨 Generating full buggy code for: ${title} (language: ${language})`);

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return this.generateJavaScriptBuggyCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'cpp':
      case 'c++':
        return this.generateCppBuggyCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'c':
        return this.generateCBuggyCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'csharp':
      case 'c#':
        return this.generateCSharpBuggyCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'java':
        return this.generateJavaBuggyCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'python':
        return this.generatePythonBuggyCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      default:
        return this.generateJavaScriptBuggyCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
    }
  }

  // Generate unique correct code for each problem
  private static generateCorrectCodeForProblem(language: string, title: string, slug?: string, templateCode?: string, bugTypeOverride?: number): string {
    // Generate code dựa trên problem characteristics
    const isArrayProblem = title.toLowerCase().includes('array') || title.toLowerCase().includes('list');
    const isStringProblem = title.toLowerCase().includes('string') || title.toLowerCase().includes('substring') || title.toLowerCase().includes('convert');
    const isMathProblem = title.toLowerCase().includes('sum') || title.toLowerCase().includes('add') || title.toLowerCase().includes('number');
    const isTwoSum = title.toLowerCase().includes('two sum');
    const isZigZag = title.toLowerCase().includes('zigzag') || title.toLowerCase().includes('zig') || title.toLowerCase().includes('convert');

    // Sử dụng slug để tạo hash unique nếu có
    const hashSeed = slug && slug.includes('_') ? slug : title;
    const hash = this.simpleHash(hashSeed);
    const bugType = bugTypeOverride !== undefined ? bugTypeOverride : (hash % 6);

    // Chỉ dùng template nếu nó có implementation đầy đủ
    if (templateCode && this.hasImplementation(templateCode, language)) {
      console.log(`   ✅ Using template code with implementation for correct code: ${title}`);
      return templateCode;
    }

    // Nếu không có template hoặc template chỉ có signature, generate full code
    console.log(`   🔨 Generating full correct code for: ${title} (language: ${language})`);

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return this.generateJavaScriptCorrectCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'cpp':
      case 'c++':
        return this.generateCppCorrectCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'c':
        return this.generateCCorrectCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'csharp':
      case 'c#':
        return this.generateCSharpCorrectCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'java':
        return this.generateJavaCorrectCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      case 'python':
        return this.generatePythonCorrectCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
      default:
        return this.generateJavaScriptCorrectCode(bugType, isArrayProblem, isStringProblem, isMathProblem, title, isTwoSum, isZigZag);
    }
  }

  // Helper: Simple hash function for consistency
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Introduce bug to existing code
  private static introduceBugToCode(code: string, bugType: number, language: string): string {
    // Bug types: 0=missing return, 1=off-by-one, 2=wrong operator, 3=missing initialization, 4=wrong condition, 5=missing output
    const bugs = [
      () => code.replace(/return\s+[^;]+;?/g, '// Missing return'),
      () => code.replace(/for\s*\([^)]+\)\s*\{/g, (match) => match.replace(/i\s*<\s*(\w+)/, 'i <= $1')),
      () => code.replace(/\+/g, (match, offset) => offset % 2 === 0 ? '-' : match),
      () => code.replace(/let\s+(\w+)\s*=/g, '// Missing initialization: let $1 ='),
      () => code.replace(/if\s*\(([^)]+)\)/g, 'if (!($1))'),
      () => code.replace(/console\.log|print\(|cout\s*<</g, '// Missing output: ')
    ];

    return bugs[bugType]?.() || code;
  }

  // Generate test cases unique to each problem
  private static generateTestCasesForProblem(language: string, title: string, index: number): Array<{input: string, expectedOutput: string, isHidden: boolean, points: number}> {
    const hash = this.simpleHash(title + index);
    const isArrayProblem = title.toLowerCase().includes('array') || title.toLowerCase().includes('list');
    const isStringProblem = title.toLowerCase().includes('string') || title.toLowerCase().includes('substring');
    const isTwoSum = title.toLowerCase().includes('two sum');
    
    // Generate unique test cases based on problem type
    if (isTwoSum) {
      return [
        {
          input: `[${2 + (hash % 5)},${7 + (hash % 5)}] ${9 + (hash % 10)}`,
          expectedOutput: `[0,1]`,
          isHidden: false,
          points: 10
        },
        {
          input: `[${3 + (hash % 5)},${2 + (hash % 5)},${4 + (hash % 5)}] ${6 + (hash % 5)}`,
          expectedOutput: `[1,2]`,
          isHidden: true,
          points: 10
        },
        {
          input: `[${3 + (hash % 3)},${3 + (hash % 3)}] ${6 + (hash % 3)}`,
          expectedOutput: `[0,1]`,
          isHidden: true,
          points: 10
        }
      ];
    }

    if (isArrayProblem) {
      const baseValue = 5 + (hash % 10);
      return [
        {
          input: `${baseValue}\n${Array.from({length: baseValue}, (_, i) => i + 1).join(' ')}`,
          expectedOutput: `${(baseValue * (baseValue + 1)) / 2}`,
          isHidden: false,
          points: 10
        },
        {
          input: `${baseValue + 3}\n${Array.from({length: baseValue + 3}, (_, i) => (i + 1) * 2).join(' ')}`,
          expectedOutput: `${(baseValue + 3) * (baseValue + 4)}`,
          isHidden: true,
          points: 10
        }
      ];
    }

    if (isStringProblem) {
      const strLength = 5 + (hash % 10);
      return [
        {
          input: `"${Array.from({length: strLength}, (_, i) => String.fromCharCode(97 + (i % 26))).join('')}"`,
          expectedOutput: `${strLength}`,
          isHidden: false,
          points: 10
        },
        {
          input: `"${Array.from({length: strLength + 3}, (_, i) => String.fromCharCode(97 + ((i + hash) % 26))).join('')}"`,
          expectedOutput: `${strLength + 3}`,
          isHidden: true,
          points: 10
        }
      ];
    }

    // Default test cases - varied by index and hash
    const base = 3 + (hash % 7);
    return [
      {
        input: `${base}\n${Array.from({length: base}, (_, i) => (i + 1) * (hash % 5 + 1)).join(' ')}`,
        expectedOutput: `${Array.from({length: base}, (_, i) => (i + 1) * (hash % 5 + 1)).reduce((a, b) => a + b, 0)}`,
        isHidden: false,
        points: 10
      },
      {
        input: `${base + 2}\n${Array.from({length: base + 2}, (_, i) => (i + 2) * (hash % 3 + 2)).join(' ')}`,
        expectedOutput: `${Array.from({length: base + 2}, (_, i) => (i + 2) * (hash % 3 + 2)).reduce((a, b) => a + b, 0)}`,
        isHidden: true,
        points: 10
      }
    ];
  }

  // JavaScript code generators
  private static generateJavaScriptBuggyCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    const buggyCodes = [
      // Bug 0: Missing return
      `function ${this.getFunctionName(title)}(${isArray ? 'nums' : isString ? 'str' : 'input'}) {
  let result = 0;
  ${isArray ? 'for (let i = 0; i < nums.length; i++) { result += nums[i]; }' : 
    isString ? 'for (let i = 0; i < str.length; i++) { result++; }' : 
    'result = input * 2;'}
  // Bug: Missing return statement
}`,
      // Bug 1: Off-by-one error
      `function ${this.getFunctionName(title)}(${isArray ? 'nums' : isString ? 'str' : 'input'}) {
  let result = 0;
  ${isArray ? 'for (let i = 0; i <= nums.length; i++) { result += nums[i] || 0; }' : 
    isString ? 'for (let i = 0; i <= str.length; i++) { result++; }' : 
    'result = input + 1;'}
  return result;
}`,
      // Bug 2: Wrong operator
      `function ${this.getFunctionName(title)}(${isArray ? 'nums' : isString ? 'str' : 'input'}) {
  let result = 0;
  ${isArray ? 'for (let i = 0; i < nums.length; i++) { result -= nums[i]; }' : 
    isString ? 'result = str.length - 1;' : 
    'result = input - 2;'}
  return result;
}`,
      // Bug 3: Missing initialization
      `function ${this.getFunctionName(title)}(${isArray ? 'nums' : isString ? 'str' : 'input'}) {
  // Bug: result not initialized
  ${isArray ? 'for (let i = 0; i < nums.length; i++) { result += nums[i]; }' : 
    isString ? 'result = str.length;' : 
    'result = input * 2;'}
  return result;
}`,
      // Bug 4: Wrong condition
      `function ${this.getFunctionName(title)}(${isArray ? 'nums' : isString ? 'str' : 'input'}) {
  let result = 0;
  ${isArray ? 'for (let i = 0; i < nums.length; i++) { if (nums[i] < 0) result += nums[i]; }' : 
    isString ? 'if (str.length > 10) result = str.length;' : 
    'if (input === 0) result = input * 2;'}
  return result;
}`,
      // Bug 5: Missing console.log (not applicable for functions, use wrong logic)
      `function ${this.getFunctionName(title)}(${isArray ? 'nums' : isString ? 'str' : 'input'}) {
  let result = 0;
  ${isArray ? 'for (let i = 1; i < nums.length; i++) { result += nums[i]; }' : 
    isString ? 'result = str.length - 1;' : 
    'result = input + 1;'}
  return result;
}`
    ];
    return buggyCodes[bugType % buggyCodes.length];
  }

  private static generateJavaScriptCorrectCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    return `function ${this.getFunctionName(title)}(${isArray ? 'nums' : isString ? 'str' : 'input'}) {
  let result = 0;
  ${isArray ? 'for (let i = 0; i < nums.length; i++) { result += nums[i]; }' : 
    isString ? 'result = str.length;' : 
    'result = input * 2;'}
  return result;
}`;
  }

  // C++ code generators
  private static generateCppBuggyCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    // Special handling for ZigZag Conversion (C++ class Solution style)
    if (isZigZag) {
      const buggyZigZagCodes = [
        `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) {
            return s;
        }
        
        vector<string> rows(numRows);
        int currentRow = 0;
        bool goingDown = false;
        
        for (char c : s) {
            rows[currentRow] += c;
            if (currentRow == 0 || currentRow == numRows - 1) {
                goingDown = !goingDown;
            }
            // Bug: Wrong direction logic
            currentRow += goingDown ? 1 : -1;
        }
        
        // Bug: Missing result combination
        // string result;
        // for (string row : rows) {
        //     result += row;
        // }
        // return result;
        return "";
    }
};`,
        `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1) {
            return s;
        }
        
        vector<string> rows(numRows);
        int currentRow = 0;
        bool goingDown = true;
        
        for (char c : s) {
            rows[currentRow] += c;
            if (currentRow == 0 || currentRow == numRows) {  // Bug: Off-by-one
                goingDown = !goingDown;
            }
            currentRow += goingDown ? 1 : -1;
        }
        
        string result;
        for (string row : rows) {
            result += row;
        }
        return result;
    }
};`
      ];
      return buggyZigZagCodes[bugType % buggyZigZagCodes.length];
    }

    // Special handling for Two Sum
    if (isTwoSum) {
      const buggyTwoSumCodes = [
        `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        // Bug: Missing return for no solution
        return {};
    }
};`,
        `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i; j < nums.size(); j++) {  // Bug: Should be i+1
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};`
      ];
      return buggyTwoSumCodes[bugType % buggyTwoSumCodes.length];
    }

    // General buggy codes
    const buggyCodes = [
      `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    ${isArray ? 'int' : isString ? 'string' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'vector<int>& nums' : isString ? 'string s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int num : nums) {\n            result += num;\n        }' : 
        isString ? 'string result = "";\n        for (char c : s) {\n            result += c;\n        }' : 
        'int result = 0;\n        for (int i = 0; i < n; i++) {\n            result += i;\n        }'}
        // Bug: Missing return statement
    }
};`,
      `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    ${isArray ? 'int' : isString ? 'string' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'vector<int>& nums' : isString ? 'string s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int i = 0; i <= nums.size(); i++) {\n            if (i < nums.size()) result += nums[i];\n        }' : 
        isString ? 'string result = "";\n        for (int i = 0; i <= s.length(); i++) {\n            if (i < s.length()) result += s[i];\n        }' : 
        'int result = 0;\n        for (int i = 0; i <= n; i++) {\n            if (i < n) result += i;\n        }'}
        return result;
    }
};`,
      `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    ${isArray ? 'int' : isString ? 'string' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'vector<int>& nums' : isString ? 'string s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int num : nums) {\n            result -= num;  // Bug: Wrong operator\n        }' : 
        isString ? 'string result = "";\n        for (int i = 0; i < s.length() - 1; i++) {  // Bug: Off-by-one\n            result += s[i];\n        }' : 
        'int result = 0;\n        for (int i = 0; i < n; i++) {\n            result -= i;  // Bug: Wrong operator\n        }'}
        return result;
    }
};`,
      `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    ${isArray ? 'int' : isString ? 'string' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'vector<int>& nums' : isString ? 'string s' : 'int n'}) {
        // Bug: result not initialized
        ${isArray ? 'for (int num : nums) {\n            result += num;\n        }' : 
        isString ? 'for (char c : s) {\n            result += c;\n        }' : 
        'for (int i = 0; i < n; i++) {\n            result += i;\n        }'}
        return result;
    }
};`,
      `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    ${isArray ? 'int' : isString ? 'string' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'vector<int>& nums' : isString ? 'string s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int num : nums) {\n            if (num < 0) result += num;  // Bug: Wrong condition\n        }' : 
        isString ? 'string result = "";\n        if (s.length() > 10) {  // Bug: Wrong condition\n            for (char c : s) {\n                result += c;\n            }\n        }' : 
        'int result = 0;\n        for (int i = 0; i < n; i++) {\n            if (i == 0) result += i;  // Bug: Wrong condition\n        }'}
        return result;
    }
};`,
      `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    ${isArray ? 'int' : isString ? 'string' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'vector<int>& nums' : isString ? 'string s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int i = 1; i < nums.size(); i++) {  // Bug: Starts from 1\n            result += nums[i];\n        }' : 
        isString ? 'string result = "";\n        for (int i = 1; i < s.length(); i++) {  // Bug: Starts from 1\n            result += s[i];\n        }' : 
        'int result = 0;\n        for (int i = 1; i < n; i++) {  // Bug: Starts from 1\n            result += i;\n        }'}
        return result;
    }
};`
    ];
    return buggyCodes[bugType % buggyCodes.length];
  }

  private static generateCppCorrectCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    // Special handling for ZigZag Conversion
    if (isZigZag) {
      return `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) {
            return s;
        }
        
        vector<string> rows(numRows);
        int currentRow = 0;
        bool goingDown = false;
        
        for (char c : s) {
            rows[currentRow] += c;
            if (currentRow == 0 || currentRow == numRows - 1) {
                goingDown = !goingDown;
            }
            currentRow += goingDown ? 1 : -1;
        }
        
        string result;
        for (string row : rows) {
            result += row;
        }
        return result;
    }
};`;
    }

    // Special handling for Two Sum
    if (isTwoSum) {
      return `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};`;
    }

    // General implementations
    if (isString) {
      return `#include <string>
using namespace std;

class Solution {
public:
    string ${this.getFunctionName(title)}(string s) {
        string result = "";
        for (char c : s) {
            result += c;
        }
        return result;
    }
};`;
    }

    if (isArray) {
      return `#include <vector>
using namespace std;

class Solution {
public:
    int ${this.getFunctionName(title)}(vector<int>& nums) {
        int result = 0;
        for (int num : nums) {
            result += num;
        }
        return result;
    }
};`;
    }

    // Default implementation
    return `class Solution {
public:
    int ${this.getFunctionName(title)}(int n) {
        int result = 0;
        for (int i = 0; i < n; i++) {
            result += i;
        }
        return result;
    }
};`;
  }

  // Java code generators
  private static generateJavaBuggyCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    // Special handling for ZigZag Conversion
    if (isZigZag) {
      const buggyZigZagCodes = [
        `class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) {
            return s;
        }
        
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new StringBuilder();
        }
        
        int currentRow = 0;
        boolean goingDown = false;
        
        for (char c : s.toCharArray()) {
            rows[currentRow].append(c);
            if (currentRow == 0 || currentRow == numRows - 1) {
                goingDown = !goingDown;
            }
            // Bug: Wrong direction logic
            currentRow += goingDown ? 1 : -1;
        }
        
        // Bug: Missing result combination
        // StringBuilder result = new StringBuilder();
        // for (StringBuilder row : rows) {
        //     result.append(row);
        // }
        // return result.toString();
        return "";
    }
}`,
        `class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1) {
            return s;
        }
        
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new StringBuilder();
        }
        
        int currentRow = 0;
        boolean goingDown = true;
        
        for (char c : s.toCharArray()) {
            rows[currentRow].append(c);
            if (currentRow == 0 || currentRow == numRows) {  // Bug: Off-by-one
                goingDown = !goingDown;
            }
            currentRow += goingDown ? 1 : -1;
        }
        
        StringBuilder result = new StringBuilder();
        for (StringBuilder row : rows) {
            result.append(row);
        }
        return result.toString();
    }
}`,
        `class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) {
            return s;
        }
        
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new StringBuilder();
        }
        
        int currentRow = 0;
        boolean goingDown = false;
        
        for (char c : s.toCharArray()) {
            rows[currentRow].append(c);
            if (currentRow == 0 || currentRow == numRows - 1) {
                goingDown = !goingDown;
            }
            currentRow += goingDown ? 1 : 0;  // Bug: Missing negative direction
        }
        
        StringBuilder result = new StringBuilder();
        for (StringBuilder row : rows) {
            result.append(row);
        }
        return result.toString();
    }
}`
      ];
      return buggyZigZagCodes[bugType % buggyZigZagCodes.length];
    }

    // Special handling for Two Sum
    if (isTwoSum) {
      const buggyTwoSumCodes = [
        `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        // Bug: Missing return for no solution
        return null;
    }
}`,
        `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i; j < nums.length; j++) {  // Bug: Should be i+1
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}`,
        `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] - nums[j] == target) {  // Bug: Wrong operator
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}`
      ];
      return buggyTwoSumCodes[bugType % buggyTwoSumCodes.length];
    }

    // General buggy codes with class Solution style
    const buggyCodes = [
      // Bug 0: Missing return
      `class Solution {
    public ${isArray ? 'int' : isString ? 'String' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'int[] nums' : isString ? 'String s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int num : nums) {\n            result += num;\n        }' : 
        isString ? 'StringBuilder result = new StringBuilder();\n        for (int i = 0; i < s.length(); i++) {\n            result.append(s.charAt(i));\n        }' : 
        'int result = 0;\n        for (int i = 0; i < n; i++) {\n            result += i;\n        }'}
        // Bug: Missing return statement
    }
}`,
      // Bug 1: Off-by-one error
      `class Solution {
    public ${isArray ? 'int' : isString ? 'String' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'int[] nums' : isString ? 'String s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int i = 0; i <= nums.length; i++) {\n            if (i < nums.length) result += nums[i];\n        }' : 
        isString ? 'StringBuilder result = new StringBuilder();\n        for (int i = 0; i <= s.length(); i++) {\n            if (i < s.length()) result.append(s.charAt(i));\n        }' : 
        'int result = 0;\n        for (int i = 0; i <= n; i++) {\n            if (i < n) result += i;\n        }'}
        return ${isArray || !isString ? 'result' : 'result.toString()'};
    }
}`,
      // Bug 2: Wrong operator
      `class Solution {
    public ${isArray ? 'int' : isString ? 'String' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'int[] nums' : isString ? 'String s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int num : nums) {\n            result -= num;  // Bug: Wrong operator\n        }' : 
        isString ? 'StringBuilder result = new StringBuilder();\n        for (int i = 0; i < s.length() - 1; i++) {  // Bug: Off-by-one\n            result.append(s.charAt(i));\n        }' : 
        'int result = 0;\n        for (int i = 0; i < n; i++) {\n            result -= i;  // Bug: Wrong operator\n        }'}
        return ${isArray || !isString ? 'result' : 'result.toString()'};
    }
}`,
      // Bug 3: Missing initialization
      `class Solution {
    public ${isArray ? 'int' : isString ? 'String' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'int[] nums' : isString ? 'String s' : 'int n'}) {
        // Bug: result not initialized
        ${isArray ? 'for (int num : nums) {\n            result += num;\n        }' : 
        isString ? 'for (int i = 0; i < s.length(); i++) {\n            result.append(s.charAt(i));\n        }' : 
        'for (int i = 0; i < n; i++) {\n            result += i;\n        }'}
        return ${isArray || !isString ? 'result' : 'result.toString()'};
    }
}`,
      // Bug 4: Wrong condition
      `class Solution {
    public ${isArray ? 'int' : isString ? 'String' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'int[] nums' : isString ? 'String s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int num : nums) {\n            if (num < 0) result += num;  // Bug: Wrong condition\n        }' : 
        isString ? 'StringBuilder result = new StringBuilder();\n        if (s.length() > 10) {  // Bug: Wrong condition\n            for (int i = 0; i < s.length(); i++) {\n                result.append(s.charAt(i));\n            }\n        }' : 
        'int result = 0;\n        for (int i = 0; i < n; i++) {\n            if (i == 0) result += i;  // Bug: Wrong condition\n        }'}
        return ${isArray || !isString ? 'result' : 'result.toString()'};
    }
}`,
      // Bug 5: Wrong loop start
      `class Solution {
    public ${isArray ? 'int' : isString ? 'String' : 'int'} ${this.getFunctionName(title)}(${isArray ? 'int[] nums' : isString ? 'String s' : 'int n'}) {
        ${isArray ? 'int result = 0;\n        for (int i = 1; i < nums.length; i++) {  // Bug: Starts from 1\n            result += nums[i];\n        }' : 
        isString ? 'StringBuilder result = new StringBuilder();\n        for (int i = 1; i < s.length(); i++) {  // Bug: Starts from 1\n            result.append(s.charAt(i));\n        }' : 
        'int result = 0;\n        for (int i = 1; i < n; i++) {  // Bug: Starts from 1\n            result += i;\n        }'}
        return ${isArray || !isString ? 'result' : 'result.toString()'};
    }
}`
    ];
    return buggyCodes[bugType % buggyCodes.length];
  }

  private static generateJavaCorrectCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    // Special handling for ZigZag Conversion
    if (isZigZag) {
      return `class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) {
            return s;
        }
        
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new StringBuilder();
        }
        
        int currentRow = 0;
        boolean goingDown = false;
        
        for (char c : s.toCharArray()) {
            rows[currentRow].append(c);
            if (currentRow == 0 || currentRow == numRows - 1) {
                goingDown = !goingDown;
            }
            currentRow += goingDown ? 1 : -1;
        }
        
        StringBuilder result = new StringBuilder();
        for (StringBuilder row : rows) {
            result.append(row);
        }
        return result.toString();
    }
}`;
    }

    // Special handling for Two Sum
    if (isTwoSum) {
      return `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}`;
    }

    // General implementations with class Solution style
    if (isString) {
      return `class Solution {
    public String ${this.getFunctionName(title)}(String s) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            result.append(s.charAt(i));
        }
        return result.toString();
    }
}`;
    }

    if (isArray) {
      return `class Solution {
    public int ${this.getFunctionName(title)}(int[] nums) {
        int result = 0;
        for (int num : nums) {
            result += num;
        }
        return result;
    }
}`;
    }

    // Default implementation
    return `class Solution {
    public int ${this.getFunctionName(title)}(int n) {
        int result = 0;
        for (int i = 0; i < n; i++) {
            result += i;
        }
        return result;
    }
}`;
  }

  // Python code generators
  private static generatePythonBuggyCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    // Special handling for ZigZag Conversion
    if (isZigZag) {
      const buggyZigZagCodes = [
        `class Solution:
    def convert(self, s: str, numRows: int) -> str:
        if numRows == 1 or numRows >= len(s):
            return s
        
        rows = [''] * numRows
        current_row = 0
        going_down = False
        
        for char in s:
            rows[current_row] += char
            if current_row == 0 or current_row == numRows - 1:
                going_down = not going_down
            # Bug: Wrong direction logic
            current_row += 1 if going_down else -1
        
        return ''.join(rows)`,
        `class Solution:
    def convert(self, s: str, numRows: int) -> str:
        if numRows == 1 or numRows >= len(s):
            return s
        
        rows = [''] * numRows
        current_row = 0
        going_down = False
        
        for char in s:
            rows[current_row] += char
            if current_row == 0 or current_row == numRows - 1:
                going_down = not going_down
            # Bug: Off-by-one error
            current_row += 1 if going_down else 0
        
        return ''.join(rows)`,
        `class Solution:
    def convert(self, s: str, numRows: int) -> str:
        if numRows == 1:
            return s
        
        rows = [''] * numRows
        current_row = 0
        going_down = True
        
        for char in s:
            rows[current_row] += char
            if current_row == 0 or current_row == numRows:
                going_down = not going_down
            current_row += 1 if going_down else -1
        
        # Bug: Missing return statement
        # return ''.join(rows)`
      ];
      return buggyZigZagCodes[bugType % buggyZigZagCodes.length];
    }

    // Special handling for Two Sum
    if (isTwoSum) {
      const buggyTwoSumCodes = [
        `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        # Bug: Missing return for no solution
        return []`,
        `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i, len(nums)):  # Bug: Should be i+1
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []`,
        `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] - nums[j] == target:  # Bug: Wrong operator
                    return [i, j]
        return []`
      ];
      return buggyTwoSumCodes[bugType % buggyTwoSumCodes.length];
    }
    // General buggy codes with class Solution style
    const buggyCodes = [
      `class Solution:
    def ${this.getFunctionName(title)}(self, nums: List[int]) -> int:
    result = 0
        for num in nums:
            result += num
        # Bug: Missing return statement`,
      `class Solution:
    def ${this.getFunctionName(title)}(self, nums: List[int]) -> int:
        result = 0
        for i in range(len(nums) + 1):  # Bug: Off-by-one
            if i < len(nums):
                result += nums[i]
        return result`,
      `class Solution:
    def ${this.getFunctionName(title)}(self, nums: List[int]) -> int:
        result = 0
        for num in nums:
            result -= num  # Bug: Wrong operator
        return result`,
      `class Solution:
    def ${this.getFunctionName(title)}(self, nums: List[int]) -> int:
        # Bug: result not initialized
        for num in nums:
            result += num
        return result`,
      `class Solution:
    def ${this.getFunctionName(title)}(self, nums: List[int]) -> int:
        result = 0
        for num in nums:
            if num < 0:  # Bug: Wrong condition
                result += num
        return result`,
      `class Solution:
    def ${this.getFunctionName(title)}(self, nums: List[int]) -> int:
        result = 0
        for i in range(1, len(nums)):  # Bug: Starts from 1
            result += nums[i]
        return result`
    ];
    return buggyCodes[bugType % buggyCodes.length];
  }

  private static generatePythonCorrectCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    // Special handling for ZigZag Conversion
    if (isZigZag) {
      return `class Solution:
    def convert(self, s: str, numRows: int) -> str:
        if numRows == 1 or numRows >= len(s):
            return s
        
        rows = [''] * numRows
        current_row = 0
        going_down = False
        
        for char in s:
            rows[current_row] += char
            if current_row == 0 or current_row == numRows - 1:
                going_down = not going_down
            current_row += 1 if going_down else -1
        
        return ''.join(rows)`;
    }

    // Special handling for Two Sum
    if (isTwoSum) {
      return `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []`;
    }

    // General implementations
    if (isString) {
      return `class Solution:
    def ${this.getFunctionName(title)}(self, s: str) -> str:
        result = ''
        for i in range(len(s)):
            result += s[i]
    return result`;
    }

    if (isArray) {
      return `class Solution:
    def ${this.getFunctionName(title)}(self, nums: List[int]) -> int:
        result = 0
        for num in nums:
            result += num
        return result`;
    }

    // Default implementation
    return `class Solution:
    def ${this.getFunctionName(title)}(self, n: int) -> int:
        result = 0
        for i in range(n):
            result += i
        return result`;
  }

  // C code generators
  private static generateCBuggyCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    const buggyCodes = [
      `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    // Bug: Missing printf
}`,
      `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 0; i <= n; i++) {  // Bug: Off-by-one
        if (i < n) {
            int x;
            scanf("%d", &x);
            sum += x;
        }
    }
    printf("%d\\n", sum);
    return 0;
}`,
      `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum -= x;  // Bug: Wrong operator
    }
    printf("%d\\n", sum);
    return 0;
}`,
      `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    // Bug: sum not initialized
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%d\\n", sum);
    return 0;
}`,
      `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        if (x < 0) sum += x;  // Bug: Wrong condition
    }
    printf("%d\\n", sum);
    return 0;
}`,
      `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 1; i < n; i++) {  // Bug: Starts from 1
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%d\\n", sum);
    return 0;
}`
    ];
    return buggyCodes[bugType % buggyCodes.length];
  }

  private static generateCCorrectCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    return `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%d\\n", sum);
    return 0;
}`;
  }

  // C# code generators
  private static generateCSharpBuggyCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    const className = this.getClassName(title);
    const buggyCodes = [
      `using System;

public class ${className} {
    public static void Main() {
        int n = int.Parse(Console.ReadLine());
        int sum = 0;
        for (int i = 0; i < n; i++) {
            int x = int.Parse(Console.ReadLine());
            sum += x;
        }
        // Bug: Missing Console.WriteLine
    }
}`,
      `using System;

public class ${className} {
    public static void Main() {
        int n = int.Parse(Console.ReadLine());
        int sum = 0;
        for (int i = 0; i <= n; i++) {  // Bug: Off-by-one
            if (i < n) {
                int x = int.Parse(Console.ReadLine());
                sum += x;
            }
        }
        Console.WriteLine(sum);
    }
}`,
      `using System;

public class ${className} {
    public static void Main() {
        int n = int.Parse(Console.ReadLine());
        int sum = 0;
        for (int i = 0; i < n; i++) {
            int x = int.Parse(Console.ReadLine());
            sum -= x;  // Bug: Wrong operator
        }
        Console.WriteLine(sum);
    }
}`,
      `using System;

public class ${className} {
    public static void Main() {
        int n = int.Parse(Console.ReadLine());
        // Bug: sum not initialized
        for (int i = 0; i < n; i++) {
            int x = int.Parse(Console.ReadLine());
            sum += x;
        }
        Console.WriteLine(sum);
    }
}`,
      `using System;

public class ${className} {
    public static void Main() {
        int n = int.Parse(Console.ReadLine());
        int sum = 0;
        for (int i = 0; i < n; i++) {
            int x = int.Parse(Console.ReadLine());
            if (x < 0) sum += x;  // Bug: Wrong condition
        }
        Console.WriteLine(sum);
    }
}`,
      `using System;

public class ${className} {
    public static void Main() {
        int n = int.Parse(Console.ReadLine());
        int sum = 0;
        for (int i = 1; i < n; i++) {  // Bug: Starts from 1
            int x = int.Parse(Console.ReadLine());
            sum += x;
        }
        Console.WriteLine(sum);
    }
}`
    ];
    return buggyCodes[bugType % buggyCodes.length];
  }

  private static generateCSharpCorrectCode(bugType: number, isArray: boolean, isString: boolean, isMath: boolean, title: string, isTwoSum: boolean = false, isZigZag: boolean = false): string {
    const className = this.getClassName(title);
    return `using System;

public class ${className} {
    public static void Main() {
        int n = int.Parse(Console.ReadLine());
        int sum = 0;
        for (int i = 0; i < n; i++) {
            int x = int.Parse(Console.ReadLine());
            sum += x;
        }
        Console.WriteLine(sum);
    }
}`;
  }

  // Helper methods
  private static getFunctionName(title: string): string {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').replace(/LeetCode|CSES|AtCoder/gi, '');
    return cleanTitle.length > 0 ? cleanTitle.charAt(0).toLowerCase() + cleanTitle.slice(1) : 'solution';
  }

  private static getClassName(title: string): string {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').replace(/LeetCode|CSES|AtCoder/gi, '');
    return cleanTitle.length > 0 ? cleanTitle : 'Solution';
  }

  private static calculatePoints(difficulty: string): number {
    switch (difficulty) {
      case 'Easy': return 10;
      case 'Medium': return 20;
      case 'Hard': return 30;
      default: return 15;
    }
  }

  // Normalize language name to match Challenge model enum values
  private static normalizeLanguage(lang: string): 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C#' | 'C' {
    const normalized = lang.trim();
    const langMap: Record<string, 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C#' | 'C'> = {
      'python': 'Python',
      'python3': 'Python',
      'javascript': 'JavaScript',
      'js': 'JavaScript',
      'typescript': 'JavaScript', // Map TypeScript to JavaScript
      'java': 'Java',
      'cpp': 'C++',
      'c++': 'C++',
      'cplusplus': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'c#': 'C#'
    };

    return langMap[normalized.toLowerCase()] || 'Python'; // Default to Python
  }

  // Map normalized language to internal language code used in code generation
  private static mapToInternalLanguage(lang: 'Python' | 'JavaScript' | 'Java' | 'C++' | 'C#' | 'C'): string {
    const map: Record<string, string> = {
      'Python': 'python',
      'JavaScript': 'javascript',
      'Java': 'java',
      'C++': 'cpp',
      'C#': 'csharp',
      'C': 'c'
    };
    return map[lang] || 'python';
  }
}
