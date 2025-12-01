import mongoose from 'mongoose';
import User from '../src/models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const setAdminPoints = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Tìm user admin (có thể tìm theo email hoặc username)
    // Thử tìm admin theo role hoặc username
    const admin = await User.findOne({
      $or: [
        { role: 'admin' },
        { username: 'admin' },
        { email: 'admin@example.com' }
      ]
    });

    if (!admin) {
      console.log('❌ Không tìm thấy admin. Tạo admin mới...');
      
      // Tạo admin mới nếu chưa có
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // Sẽ được hash tự động
        role: 'admin',
        experience: 1000,
        rank: 'Expert',
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

      await newAdmin.save();
      console.log('✅ Đã tạo admin mới với 1000 điểm');
      console.log('   Username: admin');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
    } else {
      console.log(`✅ Tìm thấy admin: ${admin.username} (${admin.email})`);
      
      // Cập nhật điểm cho admin
      admin.experience = 1000;
      admin.role = 'admin';
      
      // Đảm bảo pvpStats tồn tại
      if (!admin.pvpStats) {
        admin.pvpStats = {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          averageCompletionTime: 0
        };
      }
      
      await admin.save();
      console.log('✅ Đã cập nhật điểm cho admin thành 1000');
    }

    console.log('\n📊 Thông tin admin:');
    const updatedAdmin = await User.findOne({ role: 'admin' });
    if (updatedAdmin) {
      console.log('   Username:', updatedAdmin.username);
      console.log('   Email:', updatedAdmin.email);
      console.log('   Experience (Điểm):', updatedAdmin.experience);
      console.log('   Role:', updatedAdmin.role);
      console.log('   Rank:', updatedAdmin.rank);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB');
  }
};

setAdminPoints();