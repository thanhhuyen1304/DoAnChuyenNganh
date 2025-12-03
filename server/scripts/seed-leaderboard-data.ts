import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model';
import Challenge from '../src/models/challenge.model';
import Submission from '../src/models/submission.model';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';

// Danh sách tên người dùng mẫu
const sampleUsernames = [
  'CodeMaster2024', 'BugHunter99', 'DevNinja', 'PythonPro', 'JSExpert',
  'AlgoGenius', 'DataWizard', 'FullStackDev', 'ReactFan', 'NodeMaster',
  'CppWarrior', 'JavaKing', 'RustLover', 'GoGuru', 'SwiftCoder',
  'KotlinDev', 'PHPMaster', 'RubyGems', 'ScalaExpert', 'ElixirPro',
  'HaskellHero', 'ClojureNinja', 'ErlangDev', 'FsharpFan', 'OCamlPro'
];

// Danh sách ranks
const ranks = ['Newbie', 'Junior', 'Intermediate', 'Senior', 'Expert'];

// Danh sách badges
const badgesByRank = {
  'Newbie': ['🌱'],
  'Junior': ['🌱', '⭐'],
  'Intermediate': ['🌱', '⭐', '🔥'],
  'Senior': ['🌱', '⭐', '🔥', '💎'],
  'Expert': ['🌱', '⭐', '🔥', '💎', '👑']
};

async function seedLeaderboardData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Lấy tất cả challenges
    const challenges = await Challenge.find({ isActive: true });
    if (challenges.length === 0) {
      console.log('❌ No challenges found. Please create challenges first.');
      process.exit(1);
    }
    console.log(`📚 Found ${challenges.length} challenges`);

    // Lấy admin user (để làm createdBy cho users mới)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('👥 Creating sample users...');
    const createdUsers = [];

    for (let i = 0; i < sampleUsernames.length; i++) {
      const username = sampleUsernames[i];
      
      // Kiểm tra xem user đã tồn tại chưa
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        console.log(`⏭️  User ${username} already exists, skipping...`);
        createdUsers.push(existingUser);
        continue;
      }

      // Random rank dựa trên vị trí (users đầu có rank cao hơn)
      const rankIndex = Math.min(Math.floor(i / 5), ranks.length - 1);
      const rank = ranks[rankIndex];
      
      // Random experience dựa trên rank
      const experienceByRank = {
        'Newbie': Math.floor(Math.random() * 500) + 100,
        'Junior': Math.floor(Math.random() * 1000) + 500,
        'Intermediate': Math.floor(Math.random() * 2000) + 1500,
        'Senior': Math.floor(Math.random() * 5000) + 3500,
        'Expert': Math.floor(Math.random() * 10000) + 8500
      };
      const experience = experienceByRank[rank as keyof typeof experienceByRank];

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      const user = new User({
        email: `${username.toLowerCase()}@example.com`,
        username: username,
        password: hashedPassword,
        rank: rank,
        experience: experience,
        badges: badgesByRank[rank as keyof typeof badgesByRank],
        favoriteLanguages: ['Python', 'JavaScript', 'Java'].slice(0, Math.floor(Math.random() * 3) + 1),
        rating: 1200 + Math.floor(Math.random() * 800), // PvP rating 1200-2000
        level: Math.floor(experience / 1000) + 1,
        pvpStats: {
          wins: Math.floor(Math.random() * 50),
          losses: Math.floor(Math.random() * 30),
          draws: Math.floor(Math.random() * 10),
          totalMatches: 0, // Will be calculated
          winRate: 0, // Will be calculated
          currentStreak: Math.floor(Math.random() * 5),
          bestStreak: Math.floor(Math.random() * 10) + 5,
          averageCompletionTime: Math.floor(Math.random() * 300) + 180
        }
      });

      // Calculate PvP stats
      user.pvpStats!.totalMatches = user.pvpStats!.wins + user.pvpStats!.losses + user.pvpStats!.draws;
      user.pvpStats!.winRate = user.pvpStats!.totalMatches > 0 
        ? Math.round((user.pvpStats!.wins / user.pvpStats!.totalMatches) * 100)
        : 0;

      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${username} (${rank}, ${experience} XP)`);
    }

    console.log(`\n📝 Creating submissions for users...`);
    let totalSubmissions = 0;

    for (const user of createdUsers) {
      // Số lượng submissions dựa trên rank
      const submissionCountByRank = {
        'Newbie': Math.floor(Math.random() * 5) + 1,
        'Junior': Math.floor(Math.random() * 10) + 5,
        'Intermediate': Math.floor(Math.random() * 20) + 10,
        'Senior': Math.floor(Math.random() * 30) + 20,
        'Expert': Math.floor(Math.random() * 40) + 30
      };
      
      const submissionCount = submissionCountByRank[user.rank as keyof typeof submissionCountByRank];
      
      // Random chọn challenges để submit
      const userChallenges = challenges
        .sort(() => 0.5 - Math.random())
        .slice(0, submissionCount);

      for (const challenge of userChallenges) {
        // Random score dựa trên rank (rank cao thì score cao hơn)
        const scoreByRank = {
          'Newbie': Math.floor(Math.random() * 40) + 40, // 40-80%
          'Junior': Math.floor(Math.random() * 30) + 60, // 60-90%
          'Intermediate': Math.floor(Math.random() * 25) + 70, // 70-95%
          'Senior': Math.floor(Math.random() * 20) + 80, // 80-100%
          'Expert': Math.floor(Math.random() * 15) + 85 // 85-100%
        };
        const score = scoreByRank[user.rank as keyof typeof scoreByRank];

        // Tạo execution results
        const executionResults = challenge.testCases.map((tc, idx) => {
          const passed = Math.random() * 100 < score; // Tỷ lệ pass dựa trên score
          return {
            testCaseIndex: idx,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: passed ? tc.expectedOutput : 'Wrong output',
            passed: passed,
            executionTime: Math.floor(Math.random() * 500) + 100,
            memoryUsed: Math.floor(Math.random() * 10000) + 5000,
            points: passed ? (tc.points || 10) : 0
          };
        });

        const totalPassed = executionResults.filter(r => r.passed).length;
        const totalTestCases = challenge.testCases.length;
        const actualScore = Math.round((totalPassed / totalTestCases) * 100);
        
        // Determine status based on score
        let status: 'Accepted' | 'Wrong Answer' | 'Runtime Error';
        if (actualScore === 100) {
          status = 'Accepted';
        } else if (actualScore > 0) {
          status = 'Wrong Answer';
        } else {
          status = 'Runtime Error';
        }

        const submission = new Submission({
          user: user._id,
          challenge: challenge._id,
          submittedCode: `// Sample code for ${challenge.title}\nfunction solution() {\n  // Implementation\n}`,
          language: challenge.language,
          status: status,
          score: actualScore,
          totalPoints: challenge.points,
          executionResults: executionResults,
          executionTime: Math.floor(Math.random() * 1000) + 500,
          memoryUsed: Math.floor(Math.random() * 50000) + 10000,
          submittedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random trong 30 ngày qua
        });

        await submission.save();
        totalSubmissions++;
      }

      console.log(`✅ Created ${submissionCount} submissions for ${user.username}`);
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users created: ${createdUsers.length}`);
    console.log(`   - Submissions created: ${totalSubmissions}`);
    console.log(`   - Challenges used: ${challenges.length}`);

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedLeaderboardData();