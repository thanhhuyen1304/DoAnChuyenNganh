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
  buggyCode?: string; // Optional - không tự động generate nữa
  correctCode?: string; // Optional - không tự động generate nữa
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
          // Không tự động generate code - admin có thể thêm sau nếu cần
          buggyCode: undefined,
          correctCode: undefined
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
            // Không tự động generate code - admin có thể thêm sau nếu cần
            buggyCode: undefined,
            correctCode: undefined
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
            // Không tự động generate code - admin có thể thêm sau nếu cần
            buggyCode: undefined,
            correctCode: undefined
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
        
        // Log để debug
        console.log(`\n   🔍 Processing: "${normalizedTitle}"`);
        console.log(`      Language: ${normalizedFinalLang} (from ${finalLanguage})`);
        console.log(`      Source: ${sourceIdentifier}`);
        
        // Kiểm tra duplicate dựa trên title + language + source (chỉ exact match)
        // Chỉ check exact match để tránh false positive
        const existingChallenge = await Challenge.findOne({
              title: normalizedTitle,
              language: normalizedFinalLang,
              tags: { $in: [sourceIdentifier] }
        });
        
        // Không tự động generate code nữa - chỉ scrape test cases và metadata
        // Admin có thể tự thêm buggyCode sau nếu cần (làm starter code)
        console.log(`   📝 Preparing to save: ${normalizedTitle} (${normalizedFinalLang}, ${sourceIdentifier})`);

        const challengeData = {
          title: problem.title,
          description: problem.description,
          problemStatement: problem.problemStatement,
          difficulty: classificationSettings?.difficulty || problem.difficulty,
          language: normalizedFinalLang, // Sử dụng ngôn ngữ đã normalize
          category: classificationSettings?.category || problem.category,
          testCases: problem.testCases,
          tags: [...(problem.tags || []), sourceIdentifier], // Add source identifier to tags
          // Không tự động generate code - để admin tự thêm sau nếu cần (làm starter code)
          buggyCode: problem.buggyCode || '', // Empty string - admin có thể thêm sau
          correctCode: undefined, // Không cần correctCode nữa
          createdBy: adminId,
          isActive: true,
          points: classificationSettings?.points || this.calculatePoints(problem.difficulty),
          timeLimit: 2,
          memoryLimit: 256
        };

        try {
          let challenge;
          if (existingChallenge) {
            // Update existing challenge
            console.log(`   🔄 Updating existing challenge`);
            console.log(`      Existing ID: ${existingChallenge._id}`);
            Object.assign(existingChallenge, challengeData);
            challenge = await existingChallenge.save();
            savedCount++;
            console.log(`✅ Updated: ${problem.title}`);
          } else {
            // Create new challenge
            console.log(`   ✅ No duplicate found - creating new`);
            challenge = new Challenge(challengeData);
            challenge = await challenge.save();
          savedCount++;
          console.log(`✅ Saved: ${problem.title}`);
          }
          
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

  // Helper: Simple hash function for consistency (used by generateTestCasesForProblem)
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
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

  // Helper methods (used by generateTestCasesForProblem)
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
