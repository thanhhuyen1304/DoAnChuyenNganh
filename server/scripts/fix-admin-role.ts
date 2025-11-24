import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import User from '../src/models/user.model';

// Load .env file
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

// Environment configuration
const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bughunter.com',
};

async function fixAdminRole() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    console.log('👤 Đang tìm admin user...');
    const adminUser = await User.findOne({ email: ENV.ADMIN_EMAIL });
    
    if (!adminUser) {
      console.log('❌ Không tìm thấy admin user!');
      console.log(`   Email: ${ENV.ADMIN_EMAIL}`);
      console.log('💡 Hãy chạy: npm run setup-db');
      return;
    }

    console.log(`✅ Tìm thấy admin user: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role hiện tại: ${adminUser.role || 'undefined'}`);

    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('✅ Đã cập nhật role thành admin');
    } else {
      console.log('ℹ️  Admin user đã có role admin');
    }

    console.log('\n🎉 Hoàn tất!');
    console.log('📋 Thông tin admin:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Role: ${adminUser.role}`);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

// Chạy script
if (require.main === module) {
  fixAdminRole();
}

export default fixAdminRole;

