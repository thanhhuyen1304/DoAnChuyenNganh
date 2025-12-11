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

    const normalizedErrors = (errorTypes || []).map(e => e.toLowerCase());
    const normalizedLangs = languages.map(l => l.toLowerCase());
    const normalizedTags = tags.map(t => t.toLowerCase());

    const query: any = { isActive: true };
    if (normalizedErrors.length > 0) {
      query.errorTypes = { $in: normalizedErrors };
    }
    const resources = await LearningResource.find(query).lean();

    const levelOrder: LearningDifficulty[] = ['beginner', 'intermediate', 'advanced'];
    const levelRank = (d?: LearningDifficulty) => {
      const idx = levelOrder.indexOf(d || 'beginner');
      return idx === -1 ? 0 : idx;
    };

    const targetRank = levelRank(level);

    const scored = resources.map((r) => {
      let score = r.qualityScore || 1;

      // Match error types (primary if có)
      const errorMatch = normalizedErrors.length > 0
        ? r.errorTypes.filter(e => normalizedErrors.includes(e)).length
        : 0;
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

    const ranked = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.resource);

    // Nếu không có error types và thiếu kết quả, fallback lấy top chất lượng theo lang/tag
    if (ranked.length === 0 && normalizedErrors.length === 0) {
      const fallback = await LearningResource.find({
        isActive: true,
        ...(normalizedLangs.length ? { language: { $in: normalizedLangs } } : {}),
        ...(normalizedTags.length ? { tags: { $in: normalizedTags } } : {}),
      })
        .sort({ qualityScore: -1 })
        .limit(limit)
        .lean();
      return fallback;
    }

    return ranked;
  }
}

export const learningResourceService = new LearningResourceService();


