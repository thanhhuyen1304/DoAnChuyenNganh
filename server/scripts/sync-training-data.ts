#!/usr/bin/env ts-node
/**
 * Script để sync training data từ MongoDB vào file JSON
 * Có thể chạy độc lập hoặc được gọi từ các service khác
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { syncTrainingDataService } from '../src/services/syncTrainingDataService';

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter',
};

async function syncTrainingData() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    console.log('🔄 Bắt đầu sync training data...');
    await syncTrainingDataService.syncFromMongoDB();
    console.log('✅ Sync training data thành công!');

  } catch (error) {
    console.error('❌ Lỗi khi sync training data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

// Chạy script
if (require.main === module) {
  syncTrainingData();
}

export default syncTrainingData;

