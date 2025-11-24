import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import TrainingData from '../src/models/trainingData.model';
import User from '../src/models/user.model';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Đọc sample training data
const sampleDataPath = path.join(__dirname, 'sample-training-data.json');
const sampleTrainingData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));

async function seedTrainingData() {
  try {
    // Lấy MongoDB URI
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    
    console.log('🔍 Đang kết nối MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    // Tìm admin user để làm createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    let createdBy = adminUser?._id;

    if (!adminUser) {
      console.log('⚠️  Không tìm thấy admin user, sẽ không set createdBy');
    } else {
      console.log(`👤 Sử dụng admin user: ${adminUser.email || adminUser.username}\n`);
    }

    // Kiểm tra training data hiện có
    const existingCount = await TrainingData.countDocuments();
    console.log(`📚 Training data hiện có: ${existingCount}`);

    if (existingCount > 0) {
      console.log('ℹ️  Database đã có training data');
      console.log('   Bạn có muốn thêm thêm training data mẫu không? (Chỉ thêm nếu chưa có)\n');
    }

    // Thêm training data
    console.log('📝 Đang thêm training data mẫu...');
    let addedCount = 0;
    let skippedCount = 0;

    for (const data of sampleTrainingData) {
      // Kiểm tra xem đã tồn tại chưa (theo question)
      const existing = await TrainingData.findOne({ 
        question: data.question 
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Tạo training data mới
      const trainingData = new TrainingData({
        question: data.question,
        answer: data.answer,
        category: data.category || 'general',
        tags: data.tags || [],
        priority: data.priority || 1,
        isActive: true,
        createdBy: createdBy,
      });

      await trainingData.save();
      addedCount++;
      console.log(`   ✅ Đã thêm: "${data.question.substring(0, 50)}${data.question.length > 50 ? '...' : ''}"`);
    }

    console.log(`\n📊 Kết quả:`);
    console.log(`   ✅ Đã thêm: ${addedCount} training data`);
    if (skippedCount > 0) {
      console.log(`   ⏭️  Đã bỏ qua (trùng): ${skippedCount} training data`);
    }

    // Hiển thị tổng số training data
    const totalCount = await TrainingData.countDocuments();
    const activeCount = await TrainingData.countDocuments({ isActive: true });
    
    console.log(`\n📈 Thống kê:`);
    console.log(`   Tổng số: ${totalCount}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Inactive: ${totalCount - activeCount}`);

    // Hiển thị categories
    const categories = await TrainingData.distinct('category');
    console.log(`\n🏷️  Categories: ${categories.join(', ')}`);

    console.log(`\n✅ Hoàn thành! Bây giờ bạn có thể chạy: npm run train-word2vec\n`);

  } catch (error: any) {
    console.error('❌ Lỗi khi seed training data:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Đã ngắt kết nối MongoDB');
    }
  }
}

// Run script
seedTrainingData();

