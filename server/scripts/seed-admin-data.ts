import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import User from '../src/models/user.model';
import Report from '../src/models/report.model';
import Feedback from '../src/models/feedback.model';
import Achievement from '../src/models/achievement.model';
import SystemSettings from '../src/models/systemSettings.model';

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/BugHunter';

// Sample achievements data
const sampleAchievements = [
  {
    name: 'First Challenge',
    description: 'Hoàn thành bài tập đầu tiên',
    icon: '🚀',
    type: 'challenge',
    condition: { type: 'complete_challenges', value: 1 },
    points: 10,
    badge: 'first-challenge',
    isActive: true,
  },
  {
    name: 'Challenge Master',
    description: 'Hoàn thành 10 bài tập',
    icon: '⭐',
    type: 'challenge',
    condition: { type: 'complete_challenges', value: 10 },
    points: 50,
    badge: 'challenge-master',
    isActive: true,
  },
  {
    name: 'Python Expert',
    description: 'Hoàn thành 5 bài tập Python',
    icon: '🐍',
    type: 'challenge',
    condition: { type: 'language_challenges', value: 5 },
    points: 30,
    badge: 'python-expert',
    isActive: true,
  },
  {
    name: 'JavaScript Ninja',
    description: 'Hoàn thành 5 bài tập JavaScript',
    icon: '🥋',
    type: 'challenge',
    condition: { type: 'language_challenges', value: 5 },
    points: 30,
    badge: 'javascript-ninja',
    isActive: true,
  },
  {
    name: '7-Day Streak',
    description: 'Hoàn thành bài tập 7 ngày liên tiếp',
    icon: '🔥',
    type: 'streak',
    condition: { type: 'streak_days', value: 7 },
    points: 40,
    badge: 'seven-day-streak',
    isActive: true,
  },
  {
    name: 'Point Collector',
    description: 'Tích lũy 100 điểm',
    icon: '💰',
    type: 'points',
    condition: { type: 'total_points', value: 100 },
    points: 25,
    badge: 'point-collector',
    isActive: true,
  },
  {
    name: 'Bug Hunter Legend',
    description: 'Đặc biệt cho những người đóng góp lớn',
    icon: '🦸',
    type: 'special',
    condition: { type: 'manual', value: 0 },
    points: 100,
    badge: 'bug-hunter-legend',
    isActive: true,
  },
];

// Sample system settings data
const sampleSystemSettings = [
  {
    key: 'APP_TITLE',
    value: 'BugHunter - Code Debugging Platform',
    type: 'string',
    description: 'Tiêu đề ứng dụng',
    category: 'general',
    isPublic: true,
  },
  {
    key: 'MAX_USERS',
    value: 10000,
    type: 'number',
    description: 'Số lượng user tối đa',
    category: 'user',
    isPublic: false,
  },
  {
    key: 'CHALLENGE_TIME_LIMIT',
    value: 3600,
    type: 'number',
    description: 'Giới hạn thời gian làm bài (giây)',
    category: 'challenge',
    isPublic: false,
  },
  {
    key: 'ENABLE_REGISTRATION',
    value: true,
    type: 'boolean',
    description: 'Cho phép đăng ký tài khoản mới',
    category: 'user',
    isPublic: true,
  },
  {
    key: 'MAINTENANCE_MODE',
    value: false,
    type: 'boolean',
    description: 'Bảo trì hệ thống',
    category: 'general',
    isPublic: true,
  },
  {
    key: 'POINTS_PER_CHALLENGE',
    value: 10,
    type: 'number',
    description: 'Điểm thưởng mặc định cho mỗi bài tập',
    category: 'challenge',
    isPublic: false,
  },
  {
    key: 'MIN_PASSWORD_LENGTH',
    value: 6,
    type: 'number',
    description: 'Độ dài mật khẩu tối thiểu',
    category: 'security',
    isPublic: false,
  },
  {
    key: 'EMAIL_VERIFICATION_REQUIRED',
    value: false,
    type: 'boolean',
    description: 'Bắt buộc xác thực email',
    category: 'security',
    isPublic: false,
  },
  {
    key: 'NOTIFICATION_SETTINGS',
    value: {
      email_on_feedback: true,
      email_on_report: true,
      email_on_achievement: true,
    },
    type: 'json',
    description: 'Cài đặt thông báo',
    category: 'notification',
    isPublic: false,
  },
];

async function seedAdminData() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công\n');

    // === ACHIEVEMENTS ===
    console.log('🏆 Đang tạo Achievements...');
    const existingAchievements = await Achievement.countDocuments();
    if (existingAchievements === 0) {
      const achievements = await Achievement.insertMany(sampleAchievements);
      console.log(`✅ Đã tạo ${achievements.length} achievements`);
      achievements.forEach(ach => {
        console.log(`   - ${ach.icon} ${ach.name} (${ach.points} points)`);
      });
    } else {
      console.log(`ℹ️  Đã có ${existingAchievements} achievements trong database`);
    }

    // === SYSTEM SETTINGS ===
    console.log('\n⚙️  Đang tạo System Settings...');
    const existingSettings = await SystemSettings.countDocuments();
    if (existingSettings === 0) {
      const settings = await SystemSettings.insertMany(sampleSystemSettings);
      console.log(`✅ Đã tạo ${settings.length} system settings`);
      settings.forEach(set => {
        console.log(`   - ${set.key} = ${set.value} (${set.category})`);
      });
    } else {
      console.log(`ℹ️  Đã có ${existingSettings} system settings trong database`);
    }

    // === SAMPLE REPORTS ===
    console.log('\n📋 Đang tạo Sample Reports...');
    const existingReports = await Report.countDocuments();
    if (existingReports === 0) {
      // Lấy 2 user bất kỳ để làm reporter và reported user
      const users = await User.find().limit(3);
      
      if (users.length >= 2) {
        const sampleReports = [
          {
            reporter: users[0]._id,
            reportedUser: users[1]._id,
            type: 'user',
            reason: 'Spam comments',
            description: 'User này liên tục đăng spam và các bình luận không phù hợp trong diễn đàn',
            status: 'pending',
          },
          {
            reporter: users[1]._id,
            reportedUser: users[2]._id,
            type: 'user',
            reason: 'Inappropriate behavior',
            description: 'Sử dụng ngôn ngữ x冒phạm trong các cuộc thảo luận',
            status: 'reviewing',
            adminNotes: 'Đang xem xét. Cần kiểm tra lịch sử bình luận.',
          },
          {
            reporter: users[2]._id,
            reportedUser: users[0]._id,
            type: 'user',
            reason: 'Cheating',
            description: 'Nghi ngờ user này sử dụng tool ngoài để giải quyết các challenge',
            status: 'resolved',
            adminNotes: 'Đã xác minh. User bị cảnh báo.',
          },
        ];

        const reports = await Report.insertMany(sampleReports);
        console.log(`✅ Đã tạo ${reports.length} sample reports`);
        reports.forEach(rep => {
          console.log(`   - [${rep.status}] ${rep.reason}`);
        });
      } else {
        console.log('⚠️  Không đủ user để tạo sample reports');
      }
    } else {
      console.log(`ℹ️  Đã có ${existingReports} reports trong database`);
    }

    // === SAMPLE FEEDBACK ===
    console.log('\n💬 Đang tạo Sample Feedback...');
    const existingFeedback = await Feedback.countDocuments();
    if (existingFeedback === 0) {
      const users = await User.find().limit(3);
      
      if (users.length >= 1) {
        const sampleFeedbacks = [
          {
            user: users[0]._id,
            type: 'feature',
            title: 'Thêm chế độ tối (Dark Mode)',
            content: 'Ứng dụng rất hay nhưng tôi muốn có chế độ tối để bảo vệ mắt khi code vào ban đêm',
            rating: 5,
            status: 'pending',
          },
          {
            user: users[1]._id,
            type: 'bug',
            title: 'Bug: Lỗi hiển thị khi filter challenges',
            content: 'Khi tôi filter challenges theo ngôn ngữ, giao diện đôi khi không cập nhật đúng',
            rating: 3,
            status: 'reviewing',
          },
          {
            user: users[2]._id,
            type: 'improvement',
            title: 'Cải thiện performance của editor',
            content: 'Editor có thể chậm khi code quá dài, cần optimize performance',
            rating: 4,
            status: 'in_progress',
            adminResponse: 'Đang làm việc trên việc tối ưu hóa editor. Dự kiến sẽ xong vào tháng sau.',
          },
          {
            user: users[0]._id,
            type: 'feature',
            title: 'Thêm tính năng share solution',
            content: 'Muốn có cách để chia sẻ giải pháp của mình với người khác',
            rating: 4,
            status: 'pending',
          },
        ];

        const feedbacks = await Feedback.insertMany(sampleFeedbacks);
        console.log(`✅ Đã tạo ${feedbacks.length} sample feedbacks`);
        feedbacks.forEach(fb => {
          console.log(`   - [${fb.status}] ${fb.type}: ${fb.title}`);
        });
      } else {
        console.log('⚠️  Không đủ user để tạo sample feedback');
      }
    } else {
      console.log(`ℹ️  Đã có ${existingFeedback} feedbacks trong database`);
    }

    // === STATISTICS ===
    console.log('\n📊 Thống kê database:');
    console.log(`   Achievements: ${await Achievement.countDocuments()}`);
    console.log(`   System Settings: ${await SystemSettings.countDocuments()}`);
    console.log(`   Reports: ${await Report.countDocuments()}`);
    console.log(`   Feedbacks: ${await Feedback.countDocuments()}`);

    console.log('\n🎉 Seed dữ liệu admin hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

// Chạy seed nếu file được gọi trực tiếp
if (require.main === module) {
  seedAdminData();
}

export default seedAdminData;
