import { Request, Response } from 'express';
import TrainingData from '../models/trainingData.model';
import { syncTrainingDataService } from '../services/syncTrainingDataService';
import { word2vecService } from '../services/word2vecService';
import * as fs from 'fs';
import * as path from 'path';

export class TrainingDataController {
  // Get all training data (with pagination and filters)
  async getAllTrainingData(req: Request, res: Response): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      const category = req.query.category as string;
      const search = req.query.search as string;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      // Build query
      const query: any = {};
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive;
      if (search) {
        query.$or = [
          { question: { $regex: search, $options: 'i' } },
          { answer: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      const trainingData = await TrainingData.find(query)
        .sort({ priority: -1, usageCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username email')
        .lean();

      const total = await TrainingData.countDocuments(query);

      return res.json({
        success: true,
        data: {
          trainingData,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all training data error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Get training data by ID
  async getTrainingDataById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const trainingData = await TrainingData.findById(id)
        .populate('createdBy', 'username email')
        .lean();

      if (!trainingData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy training data',
        });
      }

      return res.json({
        success: true,
        data: trainingData,
      });
    } catch (error) {
      console.error('Get training data by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Create training data
  async createTrainingData(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      const { question, answer, category, tags, priority } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          message: 'Câu hỏi và câu trả lời là bắt buộc',
        });
      }

      const trainingData = await TrainingData.create({
        question: question.trim(),
        answer: answer.trim(),
        category: category || 'general',
        tags: tags || [],
        priority: priority || 1,
        createdBy: userId,
        isActive: true,
      });

      // Tự động sync vào file JSON
      syncTrainingDataService.syncFromMongoDB().catch(err => {
        console.error('[TrainingDataController] Lỗi khi sync sau khi tạo:', err);
      });

      return res.status(201).json({
        success: true,
        data: trainingData,
        message: 'Đã tạo training data thành công',
      });
    } catch (error) {
      console.error('Create training data error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Update training data
  async updateTrainingData(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { question, answer, category, tags, priority, isActive, rating } = req.body;

      const trainingData = await TrainingData.findById(id);

      if (!trainingData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy training data',
        });
      }

      if (question) trainingData.question = question.trim();
      if (answer) trainingData.answer = answer.trim();
      if (category) trainingData.category = category;
      if (tags) trainingData.tags = tags;
      if (priority !== undefined) trainingData.priority = priority;
      if (isActive !== undefined) trainingData.isActive = isActive;
      if (rating !== undefined) trainingData.rating = rating;

      await trainingData.save();

      // Tự động sync vào file JSON
      syncTrainingDataService.syncFromMongoDB().catch(err => {
        console.error('[TrainingDataController] Lỗi khi sync sau khi cập nhật:', err);
      });

      return res.json({
        success: true,
        data: trainingData,
        message: 'Đã cập nhật training data thành công',
      });
    } catch (error) {
      console.error('Update training data error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Delete training data
  async deleteTrainingData(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const trainingData = await TrainingData.findByIdAndDelete(id);

      if (!trainingData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy training data',
        });
      }

      // Tự động sync vào file JSON
      syncTrainingDataService.syncFromMongoDB().catch(err => {
        console.error('[TrainingDataController] Lỗi khi sync sau khi xóa:', err);
      });

      return res.json({
        success: true,
        message: 'Đã xóa training data thành công',
      });
    } catch (error) {
      console.error('Delete training data error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Get categories
  async getCategories(req: Request, res: Response): Promise<any> {
    try {
      const categories = await TrainingData.distinct('category', { isActive: true });
      return res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error('Get categories error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Bulk import training data
  async bulkImport(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      const { trainingData } = req.body; // Array of {question, answer, category, tags, priority}

      if (!Array.isArray(trainingData) || trainingData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
        });
      }

      const dataToInsert = trainingData.map((item: any) => ({
        question: item.question?.trim(),
        answer: item.answer?.trim(),
        category: item.category || 'general',
        tags: item.tags || [],
        priority: item.priority || 1,
        createdBy: userId,
        isActive: true,
      }));

      const result = await TrainingData.insertMany(dataToInsert);

      // Tự động sync vào file JSON
      syncTrainingDataService.syncFromMongoDB().catch(err => {
        console.error('[TrainingDataController] Lỗi khi sync sau khi bulk import:', err);
      });

      return res.json({
        success: true,
        data: {
          imported: result.length,
          trainingData: result,
        },
        message: `Đã import ${result.length} training data thành công`,
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Export training data
  async exportTrainingData(req: Request, res: Response): Promise<any> {
    try {
      const category = req.query.category as string;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : true;

      const query: any = {};
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive;

      const trainingData = await TrainingData.find(query)
        .select('question answer category tags priority')
        .lean();

      return res.json({
        success: true,
        data: trainingData,
      });
    } catch (error) {
      console.error('Export training data error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
      });
    }
  }

  // Extract training data from ChatHistory
  async extractFromChatHistory(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      
      // Import ChatHistory và User models
      const ChatHistory = (await import('../models/chatHistory.model')).default;
      const User = (await import('../models/user.model')).default;

      // Tìm admin user
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy admin user',
        });
      }

      // Lấy tất cả chat history có rating = 'good'
      const chatHistories = await ChatHistory.find({
        'messages.rating': 'good'
      })
        .sort({ updatedAt: -1 })
        .lean();

      if (chatHistories.length === 0) {
        return res.json({
          success: true,
          data: {
            extracted: 0,
            skipped: 0,
            candidates: [],
          },
          message: 'Không có chat history nào có rating tốt để extract',
        });
      }

      let extractedCount = 0;
      let skippedCount = 0;
      const candidates: any[] = [];

      // Extract các cặp question-answer
      for (const chat of chatHistories) {
        const messages = chat.messages || [];
        
        for (let i = 0; i < messages.length - 1; i++) {
          const userMessage = messages[i];
          const assistantMessage = messages[i + 1];

          if (
            userMessage.role === 'user' &&
            assistantMessage.role === 'assistant' &&
            assistantMessage.rating === 'good'
          ) {
            const question = userMessage.content.trim();
            const answer = assistantMessage.content.trim();

            // Bỏ qua nếu quá ngắn
            if (question.length < 10 || answer.length < 20) {
              skippedCount++;
              continue;
            }

            // Kiểm tra xem đã tồn tại chưa
            const existing = await TrainingData.findOne({
              question: question
            });

            if (existing) {
              skippedCount++;
              continue;
            }

            // Extract category và tags
            const category = this.extractCategory(question);
            const tags = this.extractTags(question, answer);

            // Thêm vào candidates (không lưu ngay, để admin review)
            candidates.push({
              question,
              answer,
              category,
              tags,
              priority: 5,
            });
          }
        }
      }

      // Lưu tất cả candidates vào database
      if (candidates.length > 0) {
        const dataToInsert = candidates.map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
          category: item.category || 'general',
          tags: item.tags || [],
          priority: item.priority || 5,
          createdBy: adminUser._id,
          isActive: true,
        }));

        const result = await TrainingData.insertMany(dataToInsert);
        extractedCount = result.length;

        // Tự động sync vào file JSON
        syncTrainingDataService.syncFromMongoDB().catch(err => {
          console.error('[TrainingDataController] Lỗi khi sync sau khi extract:', err);
        });
      }

      return res.json({
        success: true,
        data: {
          extracted: extractedCount,
          skipped: skippedCount,
          candidates: candidates.length,
        },
        message: `Đã extract ${extractedCount} training data từ ChatHistory`,
      });
    } catch (error: any) {
      console.error('Extract from chat history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message,
      });
    }
  }

  // Helper: Extract category from question
  private extractCategory(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('react') || lowerQuestion.includes('usestate') || lowerQuestion.includes('useeffect')) {
      return 'react';
    }
    if (lowerQuestion.includes('javascript') || lowerQuestion.includes('js')) {
      return 'javascript';
    }
    if (lowerQuestion.includes('debug') || lowerQuestion.includes('lỗi') || lowerQuestion.includes('error')) {
      return 'debugging';
    }
    if (lowerQuestion.includes('bughunter') || lowerQuestion.includes('submit')) {
      return 'bughunter';
    }
    
    return 'general';
  }

  // Helper: Extract tags from question and answer
  private extractTags(question: string, answer: string): string[] {
    const tags: Set<string> = new Set();
    const text = `${question} ${answer}`.toLowerCase();
    
    const keywords = [
      'javascript', 'react', 'node', 'python', 'java', 'typescript',
      'usestate', 'useeffect', 'hooks', 'async', 'await', 'promise',
      'debug', 'error', 'console', 'api', 'fetch', 'json',
      'array', 'object', 'function', 'component', 'state', 'props',
      'bughunter', 'submit', 'challenge', 'code', 'fix', 'bug'
    ];

    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.add(keyword);
      }
    });

    return Array.from(tags).slice(0, 10);
  }

  // Sync training data từ MongoDB vào file JSON (thủ công)
  async syncToFiles(req: Request, res: Response): Promise<any> {
    try {
      console.log('[TrainingDataController] Bắt đầu sync thủ công...');
      
      await syncTrainingDataService.syncFromMongoDB();

      return res.json({
        success: true,
        message: 'Đã sync training data vào file JSON thành công',
      });
    } catch (error: any) {
      console.error('[TrainingDataController] Lỗi khi sync:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi sync training data',
        error: error.message,
      });
    }
  }

  // Get training status (kiểm tra trạng thái training)
  async getTrainingStatus(req: Request, res: Response): Promise<any> {
    try {
      const serverRoot = path.resolve(__dirname, '../../');
      const modelsDir = path.join(serverRoot, 'models');
      const trainingDataPath = path.join(modelsDir, 'training_data.json');
      const word2vecDataPath = path.join(modelsDir, 'training_data_word2vec.json');
      const modelPath = path.join(modelsDir, 'word2vec.model');

      // Đếm training data trong MongoDB
      const mongoCount = await TrainingData.countDocuments({ isActive: true });
      const mongoTotal = await TrainingData.countDocuments();

      // Kiểm tra file JSON
      let jsonCount = 0;
      let word2vecCount = 0;
      let jsonExists = false;
      let word2vecExists = false;

      if (fs.existsSync(trainingDataPath)) {
        jsonExists = true;
        try {
          const fileContent = fs.readFileSync(trainingDataPath, 'utf-8');
          const fileData = JSON.parse(fileContent);
          jsonCount = Array.isArray(fileData) ? fileData.length : 0;
        } catch (e) {
          console.error('Lỗi đọc training_data.json:', e);
        }
      }

      if (fs.existsSync(word2vecDataPath)) {
        word2vecExists = true;
        try {
          const fileContent = fs.readFileSync(word2vecDataPath, 'utf-8');
          const fileData = JSON.parse(fileContent);
          word2vecCount = Array.isArray(fileData) ? fileData.length : 0;
        } catch (e) {
          console.error('Lỗi đọc training_data_word2vec.json:', e);
        }
      }

      // Kiểm tra Word2Vec model
      const modelExists = fs.existsSync(modelPath);
      const modelTrained = word2vecService.isModelTrained();

      // Kiểm tra sync status
      const needsSync = mongoCount !== jsonCount;

      // Lấy top training data được sử dụng nhiều nhất
      const topUsed = await TrainingData.find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(5)
        .select('question usageCount priority')
        .lean();

      return res.json({
        success: true,
        data: {
          mongodb: {
            total: mongoTotal,
            active: mongoCount,
            inactive: mongoTotal - mongoCount,
          },
          files: {
            trainingDataJson: {
              exists: jsonExists,
              count: jsonCount,
              path: trainingDataPath,
            },
            word2vecJson: {
              exists: word2vecExists,
              count: word2vecCount,
              path: word2vecDataPath,
            },
          },
          word2vec: {
            modelExists: modelExists,
            modelTrained: modelTrained,
            modelPath: modelPath,
          },
          sync: {
            needsSync: needsSync,
            synced: !needsSync,
            message: needsSync 
              ? `Cần sync: MongoDB có ${mongoCount} entries, file có ${jsonCount} entries`
              : 'Dữ liệu đã đồng bộ',
          },
          topUsed: topUsed,
          recommendations: {
            shouldTrain: !modelTrained && mongoCount >= 50,
            shouldSync: needsSync,
            shouldAddMore: mongoCount < 50,
          },
        },
      });
    } catch (error: any) {
      console.error('[TrainingDataController] Lỗi khi lấy trạng thái:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy trạng thái training',
        error: error.message,
      });
    }
  }
}

