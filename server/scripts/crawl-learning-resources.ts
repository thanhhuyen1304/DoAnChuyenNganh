#!/usr/bin/env ts-node
/**
 * Crawl/tải metadata tài nguyên học tập từ danh sách nguồn được whitelist
 * rồi lưu vào collection LearningResource (tránh trùng url).
 *
 * Cách chạy:
 *   cd server
 *   npm run crawl-learning-resources
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import LearningResource from '../src/models/learningResource.model';

const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';

type SourceItem = {
  url: string;
  errorTypes: string[];
  language?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  type?: 'article' | 'video' | 'exercise' | 'doc';
};

// Whitelist nguồn ngoài (có thể mở rộng thêm)
const sources: SourceItem[] = [
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Not_a_function',
    errorTypes: ['typeerror', 'runtime'],
    language: 'javascript',
    tags: ['function', 'runtime'],
    difficulty: 'beginner',
    type: 'doc',
  },
  {
    url: 'https://docs.python.org/3/tutorial/errors.html',
    errorTypes: ['syntax', 'exception'],
    language: 'python',
    tags: ['exception', 'syntax'],
    difficulty: 'beginner',
    type: 'doc',
  },
  {
    url: 'https://www.geeksforgeeks.org/runtime-error-in-java/',
    errorTypes: ['runtime'],
    language: 'java',
    tags: ['runtime'],
    difficulty: 'intermediate',
    type: 'article',
  },
  {
    url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    errorTypes: ['runtime'],
    language: 'javascript',
    tags: ['nodejs'],
    difficulty: 'beginner',
    type: 'article',
  },
];

async function fetchMetadata(url: string) {
  const res = await axios.get(url, { timeout: 8000 });
  const html = res.data as string;
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim() || url;
  const desc =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';
  return { title, description: desc };
}

async function upsertResource(item: SourceItem) {
  const existing = await LearningResource.findOne({ url: item.url });
  const meta = await fetchMetadata(item.url);
  const payload = {
    title: meta.title,
    url: item.url,
    type: item.type || 'article',
    language: item.language?.toLowerCase(),
    errorTypes: item.errorTypes.map((e) => e.toLowerCase()),
    tags: (item.tags || []).map((t) => t.toLowerCase()),
    difficulty: item.difficulty || 'beginner',
    qualityScore: existing?.qualityScore || 3,
    isActive: true,
  };

  if (existing) {
    await LearningResource.updateOne({ _id: existing._id }, { $set: payload });
    console.log(`🔁 Cập nhật: ${item.url}`);
  } else {
    await LearningResource.create(payload);
    console.log(`✅ Thêm mới: ${item.url}`);
  }
}

async function main() {
  try {
    console.log('🔌 Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối\n');

    for (const item of sources) {
      try {
        await upsertResource(item);
      } catch (e: any) {
        console.error(`❌ Lỗi với nguồn ${item.url}:`, e.message);
      }
    }
  } catch (e: any) {
    console.error('❌ Lỗi tổng:', e.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
