/**
 * Script test đơn giản cho Knowledge Graph
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import User from '../src/models/user.model';
import { knowledgeGraphService } from '../src/services/knowledgeGraphService';

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughunter';

async function testKnowledgeGraph() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công\n');

    // Tìm một admin user
    const admin = await User.findOne({ role: 'admin' }).lean() as any;
    if (!admin) {
      console.log('❌ Không tìm thấy admin user');
      process.exit(1);
    }

    console.log(`👤 Tìm thấy admin user: ${admin.email}`);
    console.log(`   ID: ${admin._id}`);

    // Test 1: Build full graph
    console.log('\n📊 Test 1: Xây dựng full knowledge graph...');
    try {
      const fullGraph = await knowledgeGraphService.buildGraph();
      console.log(`✅ Full graph: ${fullGraph.nodes.length} nodes, ${fullGraph.links.length} links`);
    } catch (error: any) {
      console.error(`❌ Lỗi buildGraph:`, error.message);
    }

    // Test 2: Build error-based graph
    console.log('\n📊 Test 2: Xây dựng error-based graph...');
    try {
      const errorGraph = await knowledgeGraphService.buildErrorBasedGraph(admin._id.toString());
      console.log(`✅ Error graph: ${errorGraph.nodes.length} nodes, ${errorGraph.links.length} links`);
      console.log(`   Error types: ${Object.keys(errorGraph.errorSummary.errorTypes).length}`);
    } catch (error: any) {
      console.error(`❌ Lỗi buildErrorBasedGraph:`, error.message);
      console.error(`   Stack:`, error.stack);
    }

    console.log('\n✅ Test hoàn tất');

  } catch (error: any) {
    console.error('❌ Lỗi chung:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

// Run test
testKnowledgeGraph().catch(error => {
  console.error('❌ Lỗi chưa được catch:', error);
  process.exit(1);
});
