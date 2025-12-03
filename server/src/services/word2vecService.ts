import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import TrainingData from '../models/trainingData.model';

/**
 * Word2Vec Service để train và sử dụng Word2Vec model
 * Sử dụng Python Gensim để train, Node.js để sử dụng
 */
export class Word2VecService {
  private modelPath: string;
  private pythonScriptPath: string;
  private isModelReady: boolean = false;

  constructor() {
    // Đường dẫn đến model và scripts
    const serverRoot = path.resolve(__dirname, '../../');
    this.modelPath = path.join(serverRoot, 'models', 'word2vec.model');
    this.pythonScriptPath = path.join(serverRoot, 'scripts', 'word2vec_train.py');
    
    // Đảm bảo thư mục models tồn tại
    const modelsDir = path.join(serverRoot, 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
  }

  /**
   * Train Word2Vec model với training data từ database
   */
  async trainModel(): Promise<void> {
    try {
      console.log('[Word2Vec] Bắt đầu train model...');
      
      // Lấy tất cả training data từ database
      const trainingData = await TrainingData.find({ isActive: true }).lean();
      
      if (trainingData.length === 0) {
        console.warn('[Word2Vec] Không có training data để train');
        return;
      }

      console.log(`[Word2Vec] Tìm thấy ${trainingData.length} training data entries`);

      // Chuẩn bị dữ liệu để train
      const sentences: string[][] = [];
      
      trainingData.forEach(td => {
        // Thêm question
        const questionWords = this.preprocessVietnameseText(td.question);
        if (questionWords.length > 0) {
          sentences.push(questionWords);
        }

        // Thêm answer (chỉ lấy một phần để tránh quá dài)
        const answerWords = this.preprocessVietnameseText(td.answer.substring(0, 500));
        if (answerWords.length > 0) {
          sentences.push(answerWords);
        }

        // Thêm tags
        if (td.tags && td.tags.length > 0) {
          td.tags.forEach(tag => {
            const tagWords = this.preprocessVietnameseText(tag);
            if (tagWords.length > 0) {
              sentences.push(tagWords);
            }
          });
        }
      });

      if (sentences.length === 0) {
        console.warn('[Word2Vec] Không có sentences để train');
        return;
      }

      console.log(`[Word2Vec] Đã chuẩn bị ${sentences.length} sentences`);

      // Lưu dữ liệu vào file tạm để Python script đọc
      const tempDataPath = path.join(path.dirname(this.modelPath), 'training_data.json');
      fs.writeFileSync(tempDataPath, JSON.stringify(sentences, null, 2), 'utf-8');

      // Gọi Python script để train
      return new Promise((resolve, reject) => {
        // Set UTF-8 encoding for Python on Windows
        const env = { ...process.env };
        if (process.platform === 'win32') {
          env.PYTHONIOENCODING = 'utf-8';
        }

        const pythonProcess = spawn('python', [
          this.pythonScriptPath,
          '--data', tempDataPath,
          '--output', this.modelPath
        ], {
          env: env,
          shell: process.platform === 'win32'
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
          console.log('[Word2Vec Python]', data.toString().trim());
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error('[Word2Vec Python Error]', data.toString().trim());
        });

        pythonProcess.on('close', (code) => {
          // Xóa file tạm
          if (fs.existsSync(tempDataPath)) {
            fs.unlinkSync(tempDataPath);
          }

          if (code === 0) {
            console.log('[Word2Vec] ✅ Train model thành công!');
            this.isModelReady = true;
            resolve();
          } else {
            console.error(`[Word2Vec] ❌ Train model thất bại với code ${code}`);
            console.error('[Word2Vec] Error output:', errorOutput);
            reject(new Error(`Train model failed with code ${code}: ${errorOutput}`));
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('[Word2Vec] ❌ Không thể chạy Python script:', error);
          reject(new Error(`Cannot run Python script: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('[Word2Vec] ❌ Lỗi khi train model:', error);
      throw error;
    }
  }

  /**
   * Tìm training data tương tự sử dụng Word2Vec similarity
   */
  async findSimilarTrainingData(
    userMessage: string,
    limit: number = 3
  ): Promise<Array<{ trainingData: any; similarity: number }>> {
    try {
      // Kiểm tra model có tồn tại không
      if (!fs.existsSync(this.modelPath)) {
        console.warn('[Word2Vec] Model chưa được train, sử dụng keyword matching');
        return this.fallbackKeywordMatching(userMessage, limit);
      }

      // Preprocess user message
      const userWords = this.preprocessVietnameseText(userMessage);
      
      if (userWords.length === 0) {
        return this.fallbackKeywordMatching(userMessage, limit);
      }

      // Tính vector cho user message bằng cách gọi Python script
      const userVector = await this.getSentenceVector(userWords);
      
      if (!userVector || userVector.length === 0) {
        return this.fallbackKeywordMatching(userMessage, limit);
      }

      // Lấy tất cả training data
      const allTrainingData = await TrainingData.find({ isActive: true }).lean();

      // Tính similarity với từng training data
      const similarities: Array<{ trainingData: any; similarity: number }> = [];

      for (const td of allTrainingData) {
        // Tính vector cho question
        const questionWords = this.preprocessVietnameseText(td.question);
        if (questionWords.length === 0) continue;

        const questionVector = await this.getSentenceVector(questionWords);
        
        if (questionVector && questionVector.length > 0) {
          const similarity = this.cosineSimilarity(userVector, questionVector);
          similarities.push({
            trainingData: td,
            similarity
          });
        }
      }

      // Sắp xếp theo similarity và lấy top results
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      const topResults = similarities
        .slice(0, limit * 2) // Lấy nhiều hơn để filter
        .filter(item => item.similarity > 0.3) // Chỉ lấy similarity > 0.3
        .slice(0, limit);

      // Nếu không có kết quả nào, fallback về keyword matching
      if (topResults.length === 0) {
        return this.fallbackKeywordMatching(userMessage, limit);
      }

      // Increment usage count
      const ids = topResults.map(r => r.trainingData._id);
      await TrainingData.updateMany(
        { _id: { $in: ids } },
        { $inc: { usageCount: 1 } }
      );

      return topResults;
    } catch (error) {
      console.error('[Word2Vec] Lỗi khi tìm similar training data:', error);
      return this.fallbackKeywordMatching(userMessage, limit);
    }
  }

  /**
   * Tính vector cho một câu bằng cách gọi Python script
   */
  private async getSentenceVector(words: string[]): Promise<number[] | null> {
    try {
      const queryScriptPath = path.join(path.dirname(this.pythonScriptPath), 'word2vec_query.py');
      
      if (!fs.existsSync(queryScriptPath)) {
        console.warn('[Word2Vec] Query script không tồn tại');
        return null;
      }

      return new Promise((resolve, reject) => {
        // Set UTF-8 encoding for Python on Windows
        const env = { ...process.env };
        if (process.platform === 'win32') {
          env.PYTHONIOENCODING = 'utf-8';
        }

        // Prepare words argument - JSON string without shell escaping issues
        const wordsJson = JSON.stringify(words);
        
        const pythonProcess = spawn('python', [
          queryScriptPath,
          '--model', this.modelPath,
          '--words', wordsJson
        ], {
          env: env,
          shell: false, // Set to false để tránh shell quoting issues
          stdio: ['pipe', 'pipe', 'pipe'], // Explicitly set stdio
          timeout: 5000 // Timeout subprocess after 5 seconds
        });

        let output = '';
        let errorOutput = '';
        let completed = false;

        // Set timeout to kill process if it hangs
        const timeoutHandle = setTimeout(() => {
          if (!completed) {
            completed = true;
            pythonProcess.kill();
            console.error('[Word2Vec Query] Process timeout - took too long');
            resolve(null);
          }
        }, 5000);

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (completed) return; // Already handled by timeout
          completed = true;
          clearTimeout(timeoutHandle);

          if (code === 0 && output.trim()) {
            try {
              const cleanOutput = output.trim();
              // Kiểm tra output có hợp lệ không trước khi parse
              if (cleanOutput.startsWith('[')) {
                const vector = JSON.parse(cleanOutput);
                resolve(vector);
              } else {
                console.error('[Word2Vec] Output không phải JSON array:', cleanOutput);
                resolve(null);
              }
            } catch (e) {
              console.error('[Word2Vec] Lỗi parse vector:', e, 'Output:', output.trim());
              resolve(null);
            }
          } else if (code !== 0) {
            console.error(`[Word2Vec Query] Query script failed with code ${code}: ${errorOutput}`);
            resolve(null);
          } else {
            console.error('[Word2Vec] Không có output từ Python script');
            resolve(null);
          }
        });

        pythonProcess.on('error', (error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutHandle);
            console.error('[Word2Vec] Cannot run query script:', error);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('[Word2Vec] Lỗi khi tính vector:', error);
      return null;
    }
  }

  /**
   * Tính cosine similarity giữa 2 vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Preprocess Vietnamese text: tách từ, lowercase, loại bỏ stopwords
   */
  private preprocessVietnameseText(text: string): string[] {
    // Vietnamese stopwords
    const stopwords = new Set([
      'là', 'cái', 'tôi', 'bạn', 'có', 'không', 'gì', 'nào', 'được', 'cách', 'sao', 'làm',
      'hỏi', 'muốn', 'cần', 'nó', 'nên', 'thì', 'này', 'kia', 'ở', 'đó', 'đây', 'và', 'hay',
      'hay là', 'hoặc', 'nhưng', 'mà', 'vì', 'cho', 'để', 'nếu', 'khi', 'giống', 'như', 'cũng',
      'lại', 'chỉ', 'khoảng', 'từ', 'đến', 'với', 'trong', 'trên', 'dưới', 'sau', 'trước',
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'do', 'does'
    ]);

    // Loại bỏ dấu câu, chuyển lowercase, tách từ
    const words = text
      .toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1) // Loại bỏ từ quá ngắn
      .filter(word => !stopwords.has(word)); // Loại bỏ stopwords

    return words;
  }

  /**
   * Fallback về keyword matching nếu Word2Vec không khả dụng
   */
  private async fallbackKeywordMatching(
    userMessage: string,
    limit: number
  ): Promise<Array<{ trainingData: any; similarity: number }>> {
    const keywords = userMessage.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const query: any = {
      isActive: true,
      $or: [
        { question: { $regex: userMessage, $options: 'i' } },
        { answer: { $regex: userMessage, $options: 'i' } },
        { tags: { $in: keywords } },
      ],
    };

    const trainingData = await TrainingData.find(query)
      .sort({ priority: -1, usageCount: -1 })
      .limit(limit)
      .lean();

    return trainingData.map(td => ({
      trainingData: td,
      similarity: 0.5 // Default similarity cho keyword matching
    }));
  }

  /**
   * Kiểm tra model đã được train chưa
   */
  isModelTrained(): boolean {
    return fs.existsSync(this.modelPath);
  }
}

// Export singleton instance
export const word2vecService = new Word2VecService();

