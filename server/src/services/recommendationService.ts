import mongoose from 'mongoose';
import Challenge from '../models/challenge.model';
import TrainingData from '../models/trainingData.model';
import Submission from '../models/submission.model';
import RecommendationLog from '../models/recommendationLog.model';
import { learningResourceService } from './learningResourceService';

interface RecommendationParams {
  userId: string;
  challengeId?: string;
  limitChallenges?: number;
  limitTraining?: number;
  limitResources?: number;
}

export class RecommendationService {
  async getRelatedRecommendations({
    userId,
    challengeId,
    limitChallenges = 5,
    limitTraining = 5,
    limitResources = 8,
  }: RecommendationParams) {
    const currentChallenge = challengeId
      ? await Challenge.findById(challengeId).lean()
      : null;

    const query: any = { user: new mongoose.Types.ObjectId(userId) };
    if (challengeId) {
      query.challenge = new mongoose.Types.ObjectId(challengeId);
    }

    const recentSubmissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(20)
      .populate('challenge')
      .lean();

    const errorTypes: Record<string, number> = {};
    const errorMessages: string[] = [];
    const relatedCategories = new Set<string>();
    const relatedTags = new Set<string>();
    const relatedLanguages = new Set<string>();
    let totalAccepted = 0;

    if (currentChallenge) {
      if (currentChallenge.category) relatedCategories.add(currentChallenge.category);
      if (currentChallenge.tags) currentChallenge.tags.forEach((tag: string) => relatedTags.add(tag));
      if (currentChallenge.language) relatedLanguages.add(String(currentChallenge.language).toLowerCase());
    }

    recentSubmissions.forEach((sub) => {
      if (sub.status !== 'Accepted' && sub.aiAnalysis?.errorAnalyses) {
        sub.aiAnalysis.errorAnalyses.forEach((error: any) => {
          errorTypes[error.errorType] = (errorTypes[error.errorType] || 0) + 1;
          if (error.errorMessage) {
            errorMessages.push(String(error.errorMessage).toLowerCase());
          }
        });
      }
      if (sub.status === 'Accepted') totalAccepted += 1;

      if (sub.challenge && typeof sub.challenge === 'object') {
        const ch = sub.challenge as any;
        if (ch.category) relatedCategories.add(ch.category);
        if (ch.tags) ch.tags.forEach((tag: string) => relatedTags.add(tag));
        if (ch.language) relatedLanguages.add(String(ch.language).toLowerCase());
      }
    });

    const latestSubmission = recentSubmissions[0];
    const latestAccepted = latestSubmission?.status === 'Accepted';

    const experienceLevel =
      totalAccepted < 5 ? 'beginner' : totalAccepted < 15 ? 'intermediate' : 'advanced';

    // Nếu bài gần nhất Accepted, gợi ý tăng nhẹ độ khó
    const targetDifficulties =
      experienceLevel === 'beginner'
        ? (latestAccepted ? ['Medium', 'Easy'] : ['Easy'])
        : experienceLevel === 'intermediate'
        ? (latestAccepted ? ['Medium', 'Hard', 'Easy'] : ['Easy', 'Medium'])
        : (latestAccepted ? ['Hard', 'Medium'] : ['Medium', 'Hard']);

    // Fetch candidates
    const trainingDataCandidates = await TrainingData.find({ isActive: true, isPractice: true }).lean();
    const challengeCandidates = await Challenge.find({ isActive: true }).lean();

    // Score training data
    const scoredTraining = trainingDataCandidates
      .map((td) => {
        let score = 0;
        const q = (td.question || '').toLowerCase();
        const a = (td.answer || '').toLowerCase();

        Object.keys(errorTypes).forEach((et) => {
          if (q.includes(et.toLowerCase()) || a.includes(et.toLowerCase())) score += 3;
        });
        errorMessages.forEach((msg) => {
          if (q.includes(msg) || a.includes(msg)) score += 2;
        });
        if (td.category && relatedCategories.has(td.category)) score += 2;
        if (td.tags && td.tags.some((tag: string) => relatedTags.has(tag))) score += 2;
        if (latestAccepted) score += 0.5; // đẩy nhẹ bài luyện khi user vừa làm đúng

        return { td, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitTraining)
      .map((item) => item.td);

    // Score challenges
    const scoredChallenges = challengeCandidates
      .map((ch) => {
        let score = 0;
        const langMatch = currentChallenge?.language
          ? String(ch.language || '').toLowerCase() === String(currentChallenge.language).toLowerCase()
          : true;

        if (!langMatch) {
          return { ch, score: -Infinity };
        }

        if (targetDifficulties.includes(ch.difficulty)) score += 3;
        if (ch.category && relatedCategories.has(ch.category)) score += 2;
        if (ch.tags && ch.tags.some((tag: string) => relatedTags.has(tag))) score += 2;
        if (ch.language && relatedLanguages.has(String(ch.language).toLowerCase())) score += 1;

        // bonus if any tag matches errorType text
        Object.keys(errorTypes).forEach((et) => {
          if (ch.tags && ch.tags.some((tag: string) => tag.toLowerCase().includes(et.toLowerCase()))) {
            score += 1;
          }
        });

        // Nếu bài gần nhất Accepted, ưu tiên tăng nhẹ difficulty (đã được targetDifficulties phản ánh)
        if (latestAccepted && targetDifficulties[0] !== ch.difficulty && targetDifficulties.includes(ch.difficulty)) {
          score += 0.5;
        }
        return { ch, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitChallenges)
      .map((item) => item.ch);

    const knowledgeGaps: string[] = [];
    const errorRank = Object.entries(errorTypes).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const gapTemplates: Record<string, (count: number) => string> = {
      syntax: (c) => `Lỗi cú pháp (${c} lần): rà soát dấu, ngoặc, thụt dòng và khai báo.`,
      runtime: (c) => `Runtime (${c} lần): kiểm tra null/undefined, biên input, chia 0, truy cập mảng.`,
      typeerror: (c) => `Type/TypeError (${c} lần): sai kiểu dữ liệu, parse/convert trước khi dùng.`,
      nameerror: (c) => `Name/Reference (${c} lần): biến/hàm chưa khai báo hoặc sai scope.`,
      referenceerror: (c) => `Reference (${c} lần): biến ngoài scope hoặc import thiếu.`,
      logic: (c) => `Logic (${c} lần): xem lại điều kiện, vòng lặp và case biên.`,
      timeout: (c) => `Hiệu năng (${c} lần): cần tối ưu thuật toán/vòng lặp, xem độ phức tạp.`,
      memory: (c) => `Bộ nhớ (${c} lần): tránh mảng quá lớn, giải phóng biến trung gian.`,
    };

    if (errorRank.length > 0) {
      errorRank.forEach(([type, count]) => {
        const key = type.toLowerCase();
        if (gapTemplates[key]) {
          knowledgeGaps.push(gapTemplates[key](count));
        } else {
          knowledgeGaps.push(`Lỗi ${type} (${count} lần): cần rà soát lại đoạn gây lỗi.`);
        }
      });

      // Chèn 1–2 ví dụ lỗi cụ thể nếu có
      errorMessages.slice(0, 2).forEach((msg) => {
        const snippet = msg.length > 120 ? `${msg.slice(0, 117)}...` : msg;
        knowledgeGaps.push(`Ví dụ lỗi: ${snippet}`);
      });
    }

    const learningResources = await learningResourceService.suggestForErrors({
      errorTypes: Object.keys(errorTypes),
      languages: Array.from(relatedLanguages),
      tags: Array.from(relatedTags),
      level: experienceLevel,
      limit: limitResources,
    });

    // Lưu log
    await RecommendationLog.create({
      user: new mongoose.Types.ObjectId(userId),
      challenge: challengeId ? new mongoose.Types.ObjectId(challengeId) : undefined,
      suggestedChallenges: scoredChallenges.map((c) => c._id),
      suggestedTrainingData: scoredTraining.map((t) => t._id),
      suggestedResources: learningResources.map((r: any) => r.url).filter(Boolean),
    });

    return {
      experienceLevel,
      errorSummary: {
        errorTypes,
        totalErrors: Object.values(errorTypes).reduce((a, b) => a + b, 0),
      },
      challenges: scoredChallenges,
      trainingData: scoredTraining,
      learningResources,
      knowledgeGaps,
    };
  }
}

export const recommendationService = new RecommendationService();
