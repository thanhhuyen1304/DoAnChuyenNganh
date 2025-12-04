#!/usr/bin/env ts-node
/**
 * Import thêm training data cho chatbot từ file JSON ở project root:
 *   training-data-new-categories.json
 *
 * Cấu trúc mỗi phần tử trong file:
 * {
 *   "question": string,
 *   "answer": string,
 *   "category": string,
 *   "tags": string[],
 *   "priority": number
 * }
 *
 * Cách chạy:
 *   cd server
 *   npm run import-new-training-data
 *
 * Script sẽ:
 *   1. Đọc file JSON
 *   2. Với mỗi item, nếu câu hỏi (question) đã tồn tại thì bỏ qua
 *   3. Nếu chưa tồn tại thì tạo mới TrainingData
 *   4. Sau khi import xong sẽ tự động sync ra file models/training_data.json
 *      và convert sang training_data_word2vec.json (Word2Vec)
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import TrainingData from '../src/models/trainingData.model';
import { syncTrainingDataService } from '../src/services/syncTrainingDataService';

// Load environment variables từ server/.env
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
};

interface RawTrainingItem {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  priority?: number;
}

async function importNewTrainingData() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công\n');

    // Xác định đường dẫn file JSON ở project root
    const projectRoot = path.resolve(__dirname, '../..');
    const jsonPath = path.join(projectRoot, 'training-data-new-categories.json');

    console.log(`📄 Đang đọc file: ${jsonPath}`);

    if (!fs.existsSync(jsonPath)) {
      console.error('❌ Không tìm thấy file training-data-new-categories.json ở project root');
      process.exit(1);
    }

    const rawContent = fs.readFileSync(jsonPath, 'utf-8');
    let items: RawTrainingItem[];

    try {
      const parsed = JSON.parse(rawContent);
      if (!Array.isArray(parsed)) {
        console.error('❌ Dữ liệu JSON không phải là một mảng');
        process.exit(1);
      }
      items = parsed;
    } catch (e: any) {
      console.error('❌ Lỗi parse JSON:', e.message);
      process.exit(1);
    }

    console.log(`📚 Tìm thấy ${items.length} items trong file\n`);

    let created = 0;
    let skipped = 0;

    for (const item of items) {
      const question = item.question?.trim();
      const answer = item.answer?.trim();

      if (!question || !answer) {
        console.log('   ⚠️  Bỏ qua 1 item vì thiếu question/answer');
        skipped++;
        continue;
      }

      // Kiểm tra xem đã có training data với cùng câu hỏi chưa
      const existing = await TrainingData.findOne({ question }).lean();
      if (existing) {
        console.log(`   ⏭️  Đã tồn tại, bỏ qua: "${question.substring(0, 60)}..."`);
        skipped++;
        continue;
      }

      await TrainingData.create({
        question,
        answer,
        category: item.category || 'general',
        tags: Array.isArray(item.tags) ? item.tags : [],
        priority: typeof item.priority === 'number' ? item.priority : 1,
        isActive: true,
      });

      created++;
      console.log(`   ✅ Đã thêm: "${question.substring(0, 60)}..."`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 KẾT QUẢ IMPORT TRAINING DATA MỚI');
    console.log('='.repeat(70));
    console.log(`✅ Đã tạo mới: ${created} items`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} items (đã tồn tại hoặc không hợp lệ)`);
    const totalActive = await TrainingData.countDocuments({ isActive: true });
    console.log(`📚 Tổng số training data active trong DB: ${totalActive}`);
    console.log('='.repeat(70) + '\n');

    // Sau khi import xong, tự động sync ra file JSON + Word2Vec
    console.log('🔄 Đang sync training data ra file JSON & Word2Vec...');
    await syncTrainingDataService.syncFromMongoDB();
    console.log('✅ Đã sync training data thành công!');
  } catch (error: any) {
    console.error('❌ Lỗi khi import training data:', error.message || error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Đã ngắt kết nối MongoDB');
    }
  }
}

// Chạy script trực tiếp
if (require.main === module) {
  importNewTrainingData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default importNewTrainingData;


