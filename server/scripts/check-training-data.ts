import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as path from 'path';
import TrainingData from '../src/models/trainingData.model';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkTrainingData() {
  try {
    // Lấy MongoDB URI
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    
    console.log('🔍 Đang kết nối MongoDB...');
    console.log(`   URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Ẩn password nếu có
    
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    // Kiểm tra database và collections
    const dbName = mongoose.connection.db?.databaseName;
    console.log(`📊 Database: ${dbName}`);
    
    const collections = await mongoose.connection.db?.listCollections().toArray();
    const collectionNames = collections?.map(c => c.name) || [];
    console.log(`📁 Collections: ${collectionNames.join(', ')}\n`);

    // Đếm tổng số training data
    const totalTrainingData = await TrainingData.countDocuments();
    console.log(`📚 Tổng số training data: ${totalTrainingData}`);

    if (totalTrainingData === 0) {
      console.log('⚠️  CHÚ Ý: Không có training data nào trong database!');
      console.log('   Bạn cần thêm training data trước khi train Word2Vec model.');
      console.log('   Có thể thêm training data qua API hoặc MongoDB Compass.\n');
      return;
    }

    // Đếm training data đang active
    const activeTrainingData = await TrainingData.countDocuments({ isActive: true });
    const inactiveTrainingData = await TrainingData.countDocuments({ isActive: false });

    console.log(`\n📈 Thống kê:`);
    console.log(`   ✅ Active: ${activeTrainingData}`);
    console.log(`   ❌ Inactive: ${inactiveTrainingData}`);

    // Lấy một vài training data mẫu
    const sampleData = await TrainingData.find({ isActive: true })
      .select('question answer category tags priority usageCount')
      .sort({ priority: -1, usageCount: -1 })
      .limit(5)
      .lean();

    if (sampleData.length > 0) {
      console.log(`\n📋 Mẫu training data (${Math.min(5, sampleData.length)} mẫu đầu tiên):`);
      sampleData.forEach((data, index) => {
        console.log(`\n   ${index + 1}. Question: ${data.question.substring(0, 80)}${data.question.length > 80 ? '...' : ''}`);
        console.log(`      Answer: ${data.answer.substring(0, 80)}${data.answer.length > 80 ? '...' : ''}`);
        console.log(`      Category: ${data.category || 'N/A'}`);
        console.log(`      Tags: ${data.tags?.join(', ') || 'N/A'}`);
        console.log(`      Priority: ${data.priority || 1}`);
        console.log(`      Usage Count: ${data.usageCount || 0}`);
      });
    }

    // Kiểm tra categories
    const categories = await TrainingData.distinct('category');
    if (categories.length > 0) {
      console.log(`\n🏷️  Categories (${categories.length}): ${categories.join(', ')}`);
    }

    // Kiểm tra tags
    const allTags = await TrainingData.find({ isActive: true })
      .select('tags')
      .lean();
    
    const uniqueTags = new Set<string>();
    allTags.forEach(td => {
      if (td.tags && td.tags.length > 0) {
        td.tags.forEach(tag => uniqueTags.add(tag));
      }
    });

    if (uniqueTags.size > 0) {
      console.log(`\n🏷️  Unique Tags (${uniqueTags.size}): ${Array.from(uniqueTags).slice(0, 20).join(', ')}${uniqueTags.size > 20 ? '...' : ''}`);
    }

    console.log(`\n✅ Database và training data đã sẵn sàng!`);
    console.log(`   Bạn có thể chạy: npm run train-word2vec\n`);

  } catch (error: any) {
    console.error('❌ Lỗi khi kiểm tra database:', error.message);
    
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
      console.error('\n💡 Gợi ý:');
      console.error('   1. Kiểm tra MongoDB đã được khởi động chưa');
      console.error('   2. Kiểm tra MONGODB_URI trong file .env có đúng không');
      console.error('   3. Thử kết nối bằng MongoDB Compass');
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
checkTrainingData();

