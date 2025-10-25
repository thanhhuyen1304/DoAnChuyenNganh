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
  static async scrapeLeetCode(skipCount: number = 0): Promise<ScrapedProblem[]> {
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

      for (const question of questions.slice(0, 10)) { // Lấy 10 bài đầu
        const problem: ScrapedProblem = {
          title: `LeetCode: ${question.title}`,
          description: `Problem from LeetCode - ${question.title}`,
          problemStatement: this.cleanHtml(question.content || ''),
          difficulty: this.mapLeetCodeDifficulty(question.difficulty),
          language: 'JavaScript',
          category: 'Logic',
          testCases: this.parseLeetCodeTestCases(question.exampleTestcases),
          tags: question.topicTags?.map((tag: any) => tag.slug) || ['leetcode'],
          buggyCode: this.generateBuggyCode('javascript'),
          correctCode: this.generateCorrectCode('javascript')
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
  static async scrapeCSES(): Promise<ScrapedProblem[]> {
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
          const problem: ScrapedProblem = {
            title: `CSES: ${title}`,
            description: `Problem from CSES Problem Set - ${title}`,
            problemStatement: `Solve the problem: ${title}. This is a problem from the CSES Problem Set.`,
            difficulty: this.mapCSESDifficulty(title),
            language: 'C++',
            category: 'Logic',
            testCases: this.generateSampleTestCases(),
            tags: ['cses', 'algorithm'],
            buggyCode: this.generateBuggyCode('cpp'),
            correctCode: this.generateCorrectCode('cpp')
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
  static async scrapeAtCoder(): Promise<ScrapedProblem[]> {
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
          const problem: ScrapedProblem = {
            title: `AtCoder: ${contestName}`,
            description: `Contest problem from AtCoder - ${contestName}`,
            problemStatement: `Solve the contest problem: ${contestName}. This is a problem from AtCoder competitive programming platform.`,
            difficulty: this.mapAtCoderDifficulty(contestName),
            language: 'C++',
            category: 'Logic',
            testCases: this.generateSampleTestCases(),
            tags: ['atcoder', 'competitive-programming'],
            buggyCode: this.generateBuggyCode('cpp'),
            correctCode: this.generateCorrectCode('cpp')
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
      console.log(`💾 Attempting to save ${desiredCount} new problems to database...`);
      let savedCount = 0;
      
      for (const problem of problems) {
        if (savedCount >= desiredCount) break;

        // Chuẩn hóa title và tạo một phiên bản thay thế nếu trùng
        let normalizedTitle = problem.title.replace(/\s+/g, ' ').trim();
        let attempt = 1;
        let isUnique = false;
        
        while (!isUnique && attempt <= 5) { // Thử tối đa 5 lần với các tên khác nhau
          const titleToTry = attempt === 1 ? normalizedTitle : `${normalizedTitle} (Variant ${attempt})`;
          
          // Kiểm tra xem problem đã tồn tại chưa
          const existing = await Challenge.findOne({ 
            title: { $regex: new RegExp('^' + titleToTry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
          });
          
          if (!existing) {
            isUnique = true;
            problem.title = titleToTry; // Cập nhật title nếu cần thêm variant
            break;
          }
          attempt++;
        }
        
        if (!isUnique) {
          console.log(`⏭️  Cannot find unique variant for: ${normalizedTitle}`);
          continue;
        }

        const challenge = new Challenge({
          title: problem.title,
          description: problem.description,
          problemStatement: problem.problemStatement,
          difficulty: classificationSettings?.difficulty || problem.difficulty,
          language: classificationSettings?.language || problem.language,
          category: classificationSettings?.category || problem.category,
          testCases: problem.testCases,
          tags: problem.tags,
          buggyCode: problem.buggyCode,
          correctCode: problem.correctCode,
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
          console.log(`   - Language: ${challenge.language}`);
          console.log(`   - Difficulty: ${challenge.difficulty}`);
          console.log(`   - Category: ${challenge.category}`);
          console.log(`   - Points: ${challenge.points}`);
          console.log(`   - IsActive: ${challenge.isActive}`);
        } catch (saveError) {
          console.error(`❌ Error saving problem ${problem.title}:`, saveError);
          continue;
        }
      }

      console.log(`🎉 Successfully saved ${savedCount} new problems to database!`);
      return savedCount;

    } catch (error) {
      console.error('❌ Error in saveProblemsToDB:', error);
      throw error;
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

  private static parseLeetCodeTestCases(testCases: string): Array<{input: string, expectedOutput: string, isHidden: boolean, points: number}> {
    if (!testCases) return this.generateSampleTestCases();
    
    const lines = testCases.split('\n');
    const testCasesArray = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        testCasesArray.push({
          input: lines[i].trim(),
          expectedOutput: lines[i + 1].trim(),
          isHidden: false,
          points: 10
        });
      }
    }
    
    return testCasesArray.length > 0 ? testCasesArray : this.generateSampleTestCases();
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

  private static generateBuggyCode(language: string): string {
    switch (language) {
      case 'javascript':
        return `function solution(input) {
  // Bug: Missing return statement
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input[i];
  }
  // Missing: return sum;
}`;
      case 'cpp':
        return `#include <iostream>
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
}`;
      default:
        return `# Buggy code - fix the logic
def solution(data):
    result = 0
    for item in data:
        result += item
    # Missing return statement
    # return result`;
    }
  }

  private static generateCorrectCode(language: string): string {
    switch (language) {
      case 'javascript':
        return `function solution(input) {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input[i];
  }
  return sum;
}`;
      case 'cpp':
        return `#include <iostream>
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
}`;
      default:
        return `def solution(data):
    result = 0
    for item in data:
        result += item
    return result`;
    }
  }

  private static calculatePoints(difficulty: string): number {
    switch (difficulty) {
      case 'Easy': return 10;
      case 'Medium': return 20;
      case 'Hard': return 30;
      default: return 15;
    }
  }
}
