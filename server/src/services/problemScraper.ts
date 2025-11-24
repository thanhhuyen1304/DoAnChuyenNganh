import axios from 'axios';
import cheerio from 'cheerio';
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
}

export class ProblemScraper {
  
  // Scrape từ CSES Problem Set
  static async scrapeCSES(): Promise<ScrapedProblem[]> {
    try {
      const response = await axios.get('https://cses.fi/problemset/');
      const $ = cheerio.load(response.data);
      const problems: ScrapedProblem[] = [];

      $('.task').each((index, element) => {
        const title = $(element).find('a').text().trim();
        const link = $(element).find('a').attr('href');
        
        if (title && link) {
          problems.push({
            title: title,
            description: `Problem from CSES: ${title}`,
            difficulty: this.mapCSESDifficulty(title),
            language: 'cpp',
            category: 'Algorithm',
            testCases: this.generateSampleTestCases(),
            tags: ['cses', 'algorithm']
          });
        }
      });

      return problems;
    } catch (error) {
      console.error('Error scraping CSES:', error);
      return [];
    }
  }

  // Scrape từ AtCoder
  static async scrapeAtCoder(): Promise<ScrapedProblem[]> {
    try {
      const response = await axios.get('https://atcoder.jp/contests/archive');
      const $ = cheerio.load(response.data);
      const problems: ScrapedProblem[] = [];

      $('tbody tr').each((index, element) => {
        const contestName = $(element).find('td').eq(1).text().trim();
        const contestLink = $(element).find('td').eq(1).find('a').attr('href');
        
        if (contestName && contestLink) {
          problems.push({
            title: `AtCoder: ${contestName}`,
            description: `Contest problem from AtCoder: ${contestName}`,
            difficulty: this.mapAtCoderDifficulty(contestName),
            language: 'cpp',
            category: 'Competitive Programming',
            testCases: this.generateSampleTestCases(),
            tags: ['atcoder', 'competitive-programming']
          });
        }
      });

      return problems;
    } catch (error) {
      console.error('Error scraping AtCoder:', error);
      return [];
    }
  }

  // Scrape từ LeetCode (simplified)
  static async scrapeLeetCode(): Promise<ScrapedProblem[]> {
    try {
      // LeetCode không có public API, nhưng có thể scrape từ trang web
      const response = await axios.get('https://leetcode.com/problemset/all/');
      const $ = cheerio.load(response.data);
      const problems: ScrapedProblem[] = [];

      $('[role="row"]').each((index, element) => {
        const titleElement = $(element).find('[role="cell"]').eq(1);
        const title = titleElement.text().trim();
        const difficulty = $(element).find('[role="cell"]').eq(4).text().trim();
        
        if (title && difficulty) {
          problems.push({
            title: `LeetCode: ${title}`,
            description: `Problem from LeetCode: ${title}`,
            difficulty: this.mapLeetCodeDifficulty(difficulty),
            language: 'javascript',
            category: 'Data Structures',
            testCases: this.generateSampleTestCases(),
            tags: ['leetcode', 'data-structures']
          });
        }
      });

      return problems;
    } catch (error) {
      console.error('Error scraping LeetCode:', error);
      return [];
    }
  }

  // Lưu problems vào database
  static async saveProblemsToDB(problems: ScrapedProblem[], adminId: string): Promise<void> {
    try {
      for (const problem of problems) {
        const challenge = new Challenge({
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          language: problem.language,
          category: problem.category,
          testCases: problem.testCases,
          tags: problem.tags,
          createdBy: adminId,
          isActive: true,
          // Không tự động generate code - admin có thể thêm sau nếu cần
          buggyCode: '',
          correctCode: undefined
        });

        await challenge.save();
        console.log(`Saved problem: ${problem.title}`);
      }
    } catch (error) {
      console.error('Error saving problems to DB:', error);
    }
  }

  // Helper methods
  private static mapCSESDifficulty(title: string): 'Easy' | 'Medium' | 'Hard' {
    if (title.includes('Easy') || title.includes('Basic')) return 'Easy';
    if (title.includes('Hard') || title.includes('Advanced')) return 'Hard';
    return 'Medium';
  }

  private static mapAtCoderDifficulty(contestName: string): 'Easy' | 'Medium' | 'Hard' {
    if (contestName.includes('ABC') || contestName.includes('Beginner')) return 'Easy';
    if (contestName.includes('ARC') || contestName.includes('Regular')) return 'Medium';
    return 'Hard';
  }

  private static mapLeetCodeDifficulty(difficulty: string): 'Easy' | 'Medium' | 'Hard' {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return 'Medium';
    }
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
}
