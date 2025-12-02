import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import TrainingData from '../models/trainingData.model';

/**
 * Service để tự động sync dữ liệu từ MongoDB vào các file JSON
 * - training_data.json: Format database (objects)
 * - training_data_word2vec.json: Format Word2Vec (array of arrays)
 */
export class SyncTrainingDataService {
  private modelsDir: string;
  private trainingDataPath: string;
  private word2vecDataPath: string;
  private convertScriptPath: string;

  constructor() {
    const serverRoot = path.resolve(__dirname, '../../');
    this.modelsDir = path.join(serverRoot, 'models');
    this.trainingDataPath = path.join(this.modelsDir, 'training_data.json');
    this.word2vecDataPath = path.join(this.modelsDir, 'training_data_word2vec.json');
    this.convertScriptPath = path.join(serverRoot, 'scripts', 'convert_training_data.py');

    // Đảm bảo thư mục models tồn tại
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  /**
   * Sync dữ liệu từ MongoDB vào training_data.json
   */
  async syncFromMongoDB(): Promise<void> {
    try {
      console.log('[SyncTrainingData] Bắt đầu sync dữ liệu từ MongoDB...');

      // Lấy tất cả training data từ MongoDB (chỉ lấy isActive = true)
      const trainingData = await TrainingData.find({ isActive: true })
        .select('question answer category tags priority')
        .lean();

      console.log(`[SyncTrainingData] Tìm thấy ${trainingData.length} training data entries`);

      // Chuyển đổi sang format JSON (loại bỏ _id và các field không cần thiết)
      const jsonData = trainingData.map(item => ({
        question: item.question,
        answer: item.answer,
        category: item.category || 'general',
        tags: item.tags || [],
        priority: item.priority || 1,
      }));

      // Lưu vào file training_data.json
      fs.writeFileSync(
        this.trainingDataPath,
        JSON.stringify(jsonData, null, 2),
        'utf-8'
      );

      console.log(`[SyncTrainingData] ✅ Đã sync ${jsonData.length} entries vào ${this.trainingDataPath}`);

      // Tự động convert sang format Word2Vec
      await this.convertToWord2VecFormat();

    } catch (error) {
      console.error('[SyncTrainingData] ❌ Lỗi khi sync dữ liệu:', error);
      throw error;
    }
  }

  /**
   * Convert training_data.json sang training_data_word2vec.json
   */
  async convertToWord2VecFormat(): Promise<void> {
    try {
      // Kiểm tra file training_data.json có tồn tại không
      if (!fs.existsSync(this.trainingDataPath)) {
        console.warn('[SyncTrainingData] File training_data.json không tồn tại, bỏ qua convert');
        return;
      }

      // Kiểm tra script convert có tồn tại không
      if (!fs.existsSync(this.convertScriptPath)) {
        console.warn('[SyncTrainingData] Script convert_training_data.py không tồn tại, bỏ qua convert');
        return;
      }

      console.log('[SyncTrainingData] Bắt đầu convert sang format Word2Vec...');

      return new Promise((resolve, reject) => {
        // Set UTF-8 encoding for Python on Windows
        const env = { ...process.env };
        if (process.platform === 'win32') {
          env.PYTHONIOENCODING = 'utf-8';
        }

        const pythonProcess = spawn('python', [
          this.convertScriptPath,
          this.trainingDataPath,
          this.word2vecDataPath
        ], {
          env: env,
          shell: process.platform === 'win32' // Use shell on Windows for better encoding support
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
          console.log('[SyncTrainingData Convert]', data.toString().trim());
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error('[SyncTrainingData Convert Error]', data.toString().trim());
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            console.log('[SyncTrainingData] ✅ Đã convert thành công sang format Word2Vec');
            resolve();
          } else {
            console.error(`[SyncTrainingData] ❌ Convert thất bại với code ${code}`);
            console.error('[SyncTrainingData] Error output:', errorOutput);
            // Không reject để không làm gián đoạn quá trình sync
            // Chỉ log lỗi và tiếp tục
            resolve();
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('[SyncTrainingData] ❌ Không thể chạy Python script:', error);
          // Không reject để không làm gián đoạn quá trình sync
          resolve();
        });
      });
    } catch (error) {
      console.error('[SyncTrainingData] ❌ Lỗi khi convert sang Word2Vec format:', error);
      // Không throw error để không làm gián đoạn quá trình sync
    }
  }

  /**
   * Kiểm tra xem có cần sync không (so sánh số lượng entries)
   */
  async needsSync(): Promise<boolean> {
    try {
      // Đếm số lượng training data trong MongoDB
      const mongoCount = await TrainingData.countDocuments({ isActive: true });

      // Đếm số lượng trong file JSON (nếu tồn tại)
      if (fs.existsSync(this.trainingDataPath)) {
        const fileContent = fs.readFileSync(this.trainingDataPath, 'utf-8');
        const fileData = JSON.parse(fileContent);
        const fileCount = Array.isArray(fileData) ? fileData.length : 0;

        // Nếu số lượng khác nhau thì cần sync
        if (mongoCount !== fileCount) {
          console.log(`[SyncTrainingData] Cần sync: MongoDB có ${mongoCount} entries, file có ${fileCount} entries`);
          return true;
        }
      } else {
        // File không tồn tại thì cần sync
        console.log('[SyncTrainingData] File không tồn tại, cần sync');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SyncTrainingData] Lỗi khi kiểm tra cần sync:', error);
      // Nếu có lỗi thì nên sync để đảm bảo
      return true;
    }
  }

  /**
   * Sync nếu cần thiết (kiểm tra trước khi sync)
   */
  async syncIfNeeded(): Promise<void> {
    const needsSync = await this.needsSync();
    if (needsSync) {
      await this.syncFromMongoDB();
    } else {
      console.log('[SyncTrainingData] Không cần sync, dữ liệu đã đồng bộ');
    }
  }
}

// Export singleton instance
export const syncTrainingDataService = new SyncTrainingDataService();

