#!/usr/bin/env ts-node
/**
 * Script để test chatbot và kiểm tra xem training data có được sử dụng không
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import TrainingData from '../src/models/trainingData.model';
import { word2vecService } from '../src/services/word2vecService';
import { syncTrainingDataService } from '../src/services/syncTrainingDataService';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
};

async function testChatbotTraining() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công\n');

    // 1. Kiểm tra Training Data trong MongoDB
    console.log('📊 1. KIỂM TRA TRAINING DATA TRONG MONGODB');
    console.log('='.repeat(50));
    const totalCount = await TrainingData.countDocuments();
    const activeCount = await TrainingData.countDocuments({ isActive: true });
    const inactiveCount = totalCount - activeCount;
    
    console.log(`   Tổng số training data: ${totalCount}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Inactive: ${inactiveCount}`);
    
    if (activeCount < 50) {
      console.log(`   ⚠️  Cảnh báo: Chỉ có ${activeCount} training data active. Khuyến nghị: ít nhất 50-100`);
    } else {
      console.log(`   ✅ Đủ training data (${activeCount} entries)`);
    }

    // Top 5 training data được sử dụng nhiều nhất
    const topUsed = await TrainingData.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('question usageCount priority')
      .lean();
    
    if (topUsed.length > 0) {
      console.log('\n   Top 5 training data được sử dụng nhiều nhất:');
      topUsed.forEach((td, index) => {
        console.log(`   ${index + 1}. "${td.question.substring(0, 50)}..." (${td.usageCount || 0} lần)`);
      });
    }

    // 2. Kiểm tra File JSON
    console.log('\n📁 2. KIỂM TRA FILE JSON');
    console.log('='.repeat(50));
    const serverRoot = path.resolve(__dirname, '..');
    const modelsDir = path.join(serverRoot, 'models');
    const trainingDataPath = path.join(modelsDir, 'training_data.json');
    const word2vecDataPath = path.join(modelsDir, 'training_data_word2vec.json');

    if (fs.existsSync(trainingDataPath)) {
      const fileContent = fs.readFileSync(trainingDataPath, 'utf-8');
      const fileData = JSON.parse(fileContent);
      const fileCount = Array.isArray(fileData) ? fileData.length : 0;
      console.log(`   training_data.json: ${fileCount} entries`);
      
      if (fileCount !== activeCount) {
        console.log(`   ⚠️  Không đồng bộ! MongoDB: ${activeCount}, File: ${fileCount}`);
        console.log(`   💡 Chạy: POST /api/training-data/sync để sync`);
      } else {
        console.log(`   ✅ Đồng bộ với MongoDB`);
      }
    } else {
      console.log(`   ❌ File training_data.json không tồn tại`);
      console.log(`   💡 Chạy: POST /api/training-data/sync để tạo file`);
    }

    if (fs.existsSync(word2vecDataPath)) {
      const fileContent = fs.readFileSync(word2vecDataPath, 'utf-8');
      const fileData = JSON.parse(fileContent);
      const word2vecCount = Array.isArray(fileData) ? fileData.length : 0;
      console.log(`   training_data_word2vec.json: ${word2vecCount} sentences`);
    } else {
      console.log(`   ❌ File training_data_word2vec.json không tồn tại`);
    }

    // 3. Kiểm tra Word2Vec Model
    console.log('\n🤖 3. KIỂM TRA WORD2VEC MODEL');
    console.log('='.repeat(50));
    const modelPath = path.join(modelsDir, 'word2vec.model');
    const modelExists = fs.existsSync(modelPath);
    const modelTrained = word2vecService.isModelTrained();

    if (modelExists) {
      const stats = fs.statSync(modelPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ Model đã được train`);
      console.log(`   📦 Kích thước: ${sizeMB} MB`);
      console.log(`   📍 Đường dẫn: ${modelPath}`);
    } else {
      console.log(`   ❌ Model chưa được train`);
      console.log(`   💡 Chạy: npm run train-word2vec để train model`);
    }

    // 4. Test tìm training data tương tự
    console.log('\n🔍 4. TEST TÌM TRAINING DATA TƯƠNG TỰ');
    console.log('='.repeat(50));
    const testMessages = [
      'Làm sao debug lỗi JavaScript?',
      'Cách sử dụng useState trong React?',
      'BugHunter là gì?',
    ];

    for (const testMessage of testMessages) {
      console.log(`\n   Câu hỏi test: "${testMessage}"`);
      
      if (modelTrained) {
        try {
          const similarResults = await word2vecService.findSimilarTrainingData(testMessage, 3);
          if (similarResults && similarResults.length > 0) {
            console.log(`   ✅ Word2Vec tìm thấy ${similarResults.length} kết quả:`);
            similarResults.forEach((result, index) => {
              const similarity = (result.similarity * 100).toFixed(1);
              console.log(`      ${index + 1}. Similarity: ${similarity}% - "${result.trainingData.question.substring(0, 60)}..."`);
            });
          } else {
            console.log(`   ⚠️  Word2Vec không tìm thấy kết quả, sẽ fallback về keyword matching`);
          }
        } catch (error: any) {
          console.log(`   ❌ Lỗi khi tìm: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  Model chưa được train, sẽ sử dụng keyword matching`);
        
        // Test keyword matching
        const keywords = testMessage.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        const query: any = {
          isActive: true,
          $or: [
            { question: { $regex: testMessage, $options: 'i' } },
            { answer: { $regex: testMessage, $options: 'i' } },
            { tags: { $in: keywords } },
          ],
        };
        
        const keywordResults = await TrainingData.find(query)
          .sort({ priority: -1, usageCount: -1 })
          .limit(3)
          .lean();
        
        if (keywordResults.length > 0) {
          console.log(`   ✅ Keyword matching tìm thấy ${keywordResults.length} kết quả`);
        } else {
          console.log(`   ❌ Không tìm thấy training data phù hợp`);
        }
      }
    }

    // 5. Tổng kết
    console.log('\n📋 5. TỔNG KẾT');
    console.log('='.repeat(50));
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (activeCount < 50) {
      issues.push(`Chỉ có ${activeCount} training data (khuyến nghị: 50-100)`);
      recommendations.push('Thêm thêm training data qua Admin Panel');
    }

    if (!modelTrained) {
      issues.push('Word2Vec model chưa được train');
      recommendations.push('Chạy: npm run train-word2vec');
    }

    if (!fs.existsSync(trainingDataPath) || !fs.existsSync(word2vecDataPath)) {
      issues.push('File JSON chưa được sync');
      recommendations.push('Chạy: POST /api/training-data/sync');
    }

    if (issues.length === 0) {
      console.log('   ✅ Tất cả đều OK! Chatbot đã sẵn sàng sử dụng Word2Vec.');
    } else {
      console.log('   ⚠️  Các vấn đề cần xử lý:');
      issues.forEach((issue, index) => {
        console.log(`      ${index + 1}. ${issue}`);
      });
      console.log('\n   💡 Khuyến nghị:');
      recommendations.forEach((rec, index) => {
        console.log(`      ${index + 1}. ${rec}`);
      });
    }

    console.log('\n✅ Hoàn thành kiểm tra!\n');

  } catch (error) {
    console.error('❌ Lỗi khi test:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

// Chạy script
if (require.main === module) {
  testChatbotTraining();
}

export default testChatbotTraining;

