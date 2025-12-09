import LearningResource, { ILearningResource, LearningDifficulty } from '../models/learningResource.model';

interface SuggestOptions {
  errorTypes: string[];
  languages?: string[];
  tags?: string[];
  level?: LearningDifficulty;
  limit?: number;
}

class LearningResourceService {
  /**
   * Gợi ý tài nguyên học tập dựa trên lỗi và ngôn ngữ
   */
  async suggestForErrors(options: SuggestOptions): Promise<ILearningResource[]> {
    const {
      errorTypes,
      languages = [],
      tags = [],
      level = 'beginner',
      limit = 6,
    } = options;

    if (!errorTypes || errorTypes.length === 0) {
      return [];
    }

    const normalizedErrors = errorTypes.map(e => e.toLowerCase());
    const normalizedLangs = languages.map(l => l.toLowerCase());
    const normalizedTags = tags.map(t => t.toLowerCase());

    const resources = await LearningResource.find({
      isActive: true,
      errorTypes: { $in: normalizedErrors },
    }).lean();

    const levelOrder: LearningDifficulty[] = ['beginner', 'intermediate', 'advanced'];
    const levelRank = (d?: LearningDifficulty) => {
      const idx = levelOrder.indexOf(d || 'beginner');
      return idx === -1 ? 0 : idx;
    };

    const targetRank = levelRank(level);

    const scored = resources.map((r) => {
      let score = r.qualityScore || 1;

      // Match error types (primary)
      const errorMatch = r.errorTypes.filter(e => normalizedErrors.includes(e)).length;
      score += errorMatch * 4;

      // Match language
      if (r.language && normalizedLangs.includes(r.language)) {
        score += 3;
      }

      // Match tags
      const tagMatch = (r.tags || []).filter(t => normalizedTags.includes(t)).length;
      score += tagMatch * 1.5;

      // Difficulty fit: ưu tiên gần trình độ hiện tại
      const diffRank = levelRank(r.difficulty as LearningDifficulty);
      const diffDelta = Math.abs(diffRank - targetRank);
      score += Math.max(0, 3 - diffDelta); // closer level gets higher score

      return { resource: r, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.resource);
  }
}

export const learningResourceService = new LearningResourceService();


