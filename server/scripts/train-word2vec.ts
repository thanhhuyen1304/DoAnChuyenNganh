#!/usr/bin/env ts-node
/**
 * Script để train Word2Vec model với training data từ database
 * 
 * Usage:
 *   npm run train-word2vec
 *   hoặc
 *   ts-node scripts/train-word2vec.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as path from 'path';
import { word2vecService } from '../src/services/word2vecService';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  try {
    console.log('[Word2Vec Train Script] Bắt đầu train Word2Vec model...');
    
    // Kết nối MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';
    console.log('[Word2Vec Train Script] Đang kết nối MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('[Word2Vec Train Script] ✅ Đã kết nối MongoDB');

    // Train model
    await word2vecService.trainModel();

    console.log('[Word2Vec Train Script] ✅ Hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('[Word2Vec Train Script] ❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Word2Vec Train Script] Đã ngắt kết nối MongoDB');
  }
}

// Run script
main();

