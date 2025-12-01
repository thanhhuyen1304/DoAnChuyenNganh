import mongoose from 'mongoose';
import User from '../src/models/user.model';
import Room from '../src/models/room.model';
import Match from '../src/models/match.model';
import Friend from '../src/models/friend.model';

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com',
  PORT: process.env.PORT || 5000
};

async function setupPvPDatabaseSimple() {
  try {
    console.log('🔌 Đang kết nối MongoDB cho PvP setup...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Get or create admin user
    console.log('👤 Đang kiểm tra admin user...');
    let adminUser = await User.findOne({ email: ENV.ADMIN_EMAIL });
    
    if (!adminUser) {
      console.log('👤 Đang tạo admin user...');
      adminUser = new User({
        email: ENV.ADMIN_EMAIL,
        username: 'admin',
        password: 'admin123',
        favoriteLanguages: ['Python', 'JavaScript', 'Java'],
        experience: 1000,
        rank: 'Expert',
        badges: ['admin', 'founder'],
        rating: 1500,
        level: 10,
        role: 'admin',
        pvpStats: {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          averageCompletionTime: 0
        }
      });
      
      await adminUser.save();
      console.log('✅ Admin user đã được tạo');
    } else {
      console.log('ℹ️  Admin user đã tồn tại');
    }

    // Create sample room
    console.log('🏠 Đang tạo sample PvP room...');
    const roomCount = await Room.countDocuments();
    
    if (roomCount === 0) {
      const sampleRoom = new Room({
        name: "CodeMaster's Arena",
        description: "Phòng luyện tập cho lập trình viên intermediate",
        hostId: adminUser._id,
        hostUsername: adminUser.username,
        participants: [{
          userId: adminUser._id,
          username: adminUser.username,
          rating: adminUser.rating || 1200,
          joinedAt: new Date(),
          isReady: false
        }],
        settings: {
          mode: '1vs1',
          difficulty: 'medium',
          timeLimit: 30,
          language: 'any',
          isPrivate: false,
          maxParticipants: 2,
          autoStart: false,
          allowSpectators: true
        },
        status: 'waiting',
        currentRound: 1,
        totalRounds: 1,
        problems: [],
        results: []
      });
      
      await sampleRoom.save();
      console.log('✅ Đã tạo sample room: CodeMaster\'s Arena');
    } else {
      console.log(`ℹ️  Đã có ${roomCount} rooms trong database`);
    }

    // Create sample match
    console.log('⚔️ Đang tạo sample PvP match...');
    const matchCount = await Match.countDocuments();
    
    if (matchCount === 0) {
      const rooms = await Room.find();
      if (rooms.length > 0) {
        const sampleMatch = new Match({
          roomId: rooms[0]._id,
          roomName: rooms[0].name,
          participants: rooms[0].participants.map(p => ({
            userId: p.userId,
            username: p.username,
            rating: p.rating,
            ratingChange: 0,
            finalScore: 0,
            completionTime: 0,
            submissions: 0,
            rank: 0
          })),
          settings: {
            mode: rooms[0].settings.mode,
            difficulty: rooms[0].settings.difficulty,
            timeLimit: rooms[0].settings.timeLimit,
            language: rooms[0].settings.language
          },
          problems: [],
          status: 'completed',
          winner: rooms[0].participants[0]?.userId,
          winnerUsername: rooms[0].participants[0]?.username,
          duration: 1800,
          startedAt: new Date(Date.now() - 1800 * 1000),
          completedAt: new Date()
        });
        
        await sampleMatch.save();
        console.log('✅ Đã tạo sample match');
      }
    } else {
      console.log(`ℹ️  Đã có ${matchCount} matches trong database`);
    }

    // Create sample friend request
    console.log('🤝 Đang tạo sample friend request...');
    const friendRequestCount = await Friend.countDocuments();
    
    if (friendRequestCount === 0) {
      // Create test users first
      let testUser1 = await User.findOne({ username: 'testuser1' });
      let testUser2 = await User.findOne({ username: 'testuser2' });
      
      if (!testUser1) {
        testUser1 = new User({
          email: 'testuser1@bughunter.com',
          username: 'testuser1',
          password: 'test123',
          favoriteLanguages: ['Python', 'JavaScript'],
          experience: 500,
          rank: 'Intermediate',
          badges: ['tester'],
          rating: 1300,
          level: 5,
          role: 'user',
          pvpStats: {
            wins: 5,
            losses: 3,
            draws: 0,
            totalMatches: 8,
            winRate: 62.5,
            currentStreak: 2,
            bestStreak: 3,
            averageCompletionTime: 1200
          }
        });
        await testUser1.save();
        console.log('✅ Đã tạo testuser1');
      }
      
      if (!testUser2) {
        testUser2 = new User({
          email: 'testuser2@bughunter.com',
          username: 'testuser2',
          password: 'test123',
          favoriteLanguages: ['Python', 'JavaScript'],
          experience: 300,
          rank: 'Junior',
          badges: ['tester'],
          rating: 1250,
          level: 3,
          role: 'user',
          pvpStats: {
            wins: 3,
            losses: 5,
            draws: 0,
            totalMatches: 8,
            winRate: 37.5,
            currentStreak: 1,
            bestStreak: 2,
            averageCompletionTime: 1500
          }
        });
        await testUser2.save();
        console.log('✅ Đã tạo testuser2');
      }
      
      const sampleFriendRequest = new Friend({
        requesterId: testUser1._id,
        recipientId: testUser2._id,
        requesterUsername: testUser1.username,
        recipientUsername: testUser2.username,
        status: 'pending',
        requestedAt: new Date()
      });
      
      await sampleFriendRequest.save();
      console.log('✅ Đã tạo sample friend request: testuser1 -> testuser2');
    } else {
      console.log(`ℹ️  Đã có ${friendRequestCount} friend requests trong database`);
    }

    // Display final statistics
    console.log('\n📊 Thống kê PvP Database sau setup:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Rooms: ${await Room.countDocuments()}`);
    console.log(`   Matches: ${await Match.countDocuments()}`);
    console.log(`   Friend Requests: ${await Friend.countDocuments()}`);
    console.log(`   Accepted Friendships: ${await Friend.countDocuments({ status: 'accepted' })}`);

    console.log('\n🎉 PvP Database setup hoàn tất!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log(`   Admin: ${ENV.ADMIN_EMAIL} / admin123`);
    console.log(`   Test User 1: testuser1@bughunter.com / test123`);
    console.log(`   Test User 2: testuser2@bughunter.com / test123`);
    
    console.log('\n🔗 Test URLs:');
    console.log(`   Frontend: http://localhost:3000`);
    console.log(`   Backend: http://localhost:${ENV.PORT}`);
    console.log(`   Login: http://localhost:${ENV.PORT}/api/auth/login`);

    console.log('\n⚠️  Lưu ý:');
    console.log('   - Test users được tạo để test chức năng PvP');
    console.log('   - Admin user: admin@bughunter.com / admin123');
    console.log('   - Hãy thay đổi mật khẩu mặc định trong production!');

  } catch (error) {
    console.error('❌ Lỗi setup PvP database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

// Chạy setup nếu file được gọi trực tiếp
if (require.main === module) {
  setupPvPDatabaseSimple();
}

export default setupPvPDatabaseSimple;