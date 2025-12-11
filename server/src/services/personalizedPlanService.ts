import mongoose from 'mongoose';
import Submission from '../models/submission.model';
import Challenge, { IChallenge } from '../models/challenge.model';
import TrainingData, { ITrainingData } from '../models/trainingData.model';
import { knowledgeGraphService, KnowledgeGraph, GraphNode } from './knowledgeGraphService';
import { LanguagePreference } from '../models/languagePreference.model';
import User from '../models/user.model';
import { learningResourceService } from './learningResourceService';
import { ILearningResource } from '../models/learningResource.model';

const CATEGORY_ORDER = ['Syntax', 'Logic', 'Performance', 'Security'];
const DIFFICULTY_ORDER: Array<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];

interface UserProfile {
  userId: string;
  totalSubmissions: number;
  totalAccepted: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguages: string[]; // From submissions (behavior-based)
  favoriteLanguages: string[]; // From user preferences (explicit)
  combinedLanguages: string[]; // Combined and prioritized
  categoryStats: Record<string, number>; // Success stats
  difficultyStats: Record<string, number>;
  tagStats: Record<string, number>; // Success stats
  errorTypeStats: Record<string, number>; // Tracks types of errors (logic, syntax)
  weaknessCategoryStats: Record<string, number>; // Tracks categories where errors occur
  weaknessTagStats: Record<string, number>; // Tracks tags where errors occur
  focusCategories: string[];
  focusTags: string[];
  completedChallenges: string[];
  recentChallenges: Array<{
    id: string;
    title: string;
    category: string;
    difficulty: string;
    completedAt: Date;
  }>;
  // ML-based features
  languageProficiency: Record<string, number>; // 0-1 score per language
  categoryProficiency: Record<string, number>; // 0-1 score per category
  difficultyProgression: Record<string, number>; // Success rate per difficulty
  learningVelocity: number; // Challenges completed per time period
  errorPatterns: Record<string, number>; // Common error patterns
}

interface Recommendation<T> {
  id: string;
  type: 'challenge' | 'training_data';
  score: number;
  reasons: string[];
  data: T;
}

interface LearningPathStep {
  step: number;
  type: 'training' | 'challenge';
  title: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  description: string;
  resources?: string[];
}

interface PersonalizedPlan {
  profile: UserProfile;
  recommendations: {
    challenges: Recommendation<IChallenge>[];
    trainingData: Recommendation<ITrainingData>[];
    learningResources: ILearningResource[];
  };
  learningPath: LearningPathStep[];
  graph: KnowledgeGraph;
}

class PersonalizedPlanService {
  async buildPlan(userId: string): Promise<PersonalizedPlan> {
    const profile = await this.buildUserProfile(userId);

    const [challengeRecs, trainingDataRecs, baseGraph, resourceRecs] = await Promise.all([
      this.recommendChallenges(profile, 5),
      this.recommendTrainingData(profile, 5),
      knowledgeGraphService.buildGraph(),
      learningResourceService.suggestForErrors({
        errorTypes: Object.keys(profile.errorTypeStats || {}),
        languages: profile.combinedLanguages,
        tags: profile.focusTags,
        level: profile.experienceLevel,
        limit: 8,
      }),
    ]);

    const learningPath = this.buildLearningPath(profile, challengeRecs, trainingDataRecs, resourceRecs);
    const graph = this.applyRecommendationsToGraph(baseGraph, profile, trainingDataRecs);

    return {
      profile,
      recommendations: {
        challenges: challengeRecs,
        trainingData: trainingDataRecs,
        learningResources: resourceRecs,
      },
      learningPath,
      graph,
    };
  }

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get favorite languages from database (user preferences)
    const languagePreference = await LanguagePreference.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      type: 'language_preference'
    }).lean();

    // Fallback to User model if not found in LanguagePreference
    let favoriteLanguages: string[] = [];
    if (languagePreference && languagePreference.languages) {
      favoriteLanguages = languagePreference.languages;
    } else {
      const user = await User.findById(userId).select('favoriteLanguages').lean();
      if (user && user.favoriteLanguages) {
        favoriteLanguages = user.favoriteLanguages;
      }
    }

    const submissions = await Submission.find({
      user: new mongoose.Types.ObjectId(userId),
    })
      .sort({ submittedAt: -1 })
      .limit(200)
      .populate('challenge', 'title category tags difficulty language createdAt')
      .lean();

    const categoryStats: Record<string, number> = {};
    const difficultyStats: Record<string, number> = {};
    const tagStats: Record<string, number> = {};
    const languageStats: Record<string, number> = {};
    const languageAttempts: Record<string, number> = {}; // Total attempts per language
    const languageSuccess: Record<string, number> = {}; // Success count per language
    const categoryAttempts: Record<string, number> = {}; // Total attempts per category
    const categorySuccess: Record<string, number> = {}; // Success count per category
    const difficultyAttempts: Record<string, number> = {}; // Total attempts per difficulty
    const difficultySuccess: Record<string, number> = {}; // Success count per difficulty
    const completedChallenges: string[] = [];
    const recentChallenges: UserProfile['recentChallenges'] = [];
    const errorTypeStats: Record<string, number> = {};
    const weaknessCategoryStats: Record<string, number> = {};
    const weaknessTagStats: Record<string, number> = {};
    const errorPatterns: Record<string, number> = {};
    let totalAccepted = 0;
    const firstSubmissionDate = submissions.length > 0 ? submissions[submissions.length - 1].submittedAt : new Date();
    const lastSubmissionDate = submissions.length > 0 ? submissions[0].submittedAt : new Date();
    const timeSpanDays = Math.max(1, (lastSubmissionDate.getTime() - firstSubmissionDate.getTime()) / (1000 * 60 * 60 * 24));

    CATEGORY_ORDER.forEach((cat) => {
      categoryStats[cat] = 0;
      categoryAttempts[cat] = 0;
      categorySuccess[cat] = 0;
    });
    DIFFICULTY_ORDER.forEach((diff) => {
      difficultyStats[diff] = 0;
      difficultyAttempts[diff] = 0;
      difficultySuccess[diff] = 0;
    });

    submissions.forEach((submission) => {
      const challenge: any = submission.challenge;
      if (!challenge) return;

      const isAccepted = submission.status === 'Accepted';
      
      // Track attempts and successes
      languageAttempts[challenge.language] = (languageAttempts[challenge.language] || 0) + 1;
      categoryAttempts[challenge.category] = (categoryAttempts[challenge.category] || 0) + 1;
      difficultyAttempts[challenge.difficulty] = (difficultyAttempts[challenge.difficulty] || 0) + 1;

      if (isAccepted) {
        totalAccepted++;
        languageSuccess[challenge.language] = (languageSuccess[challenge.language] || 0) + 1;
        categorySuccess[challenge.category] = (categorySuccess[challenge.category] || 0) + 1;
        difficultySuccess[challenge.difficulty] = (difficultySuccess[challenge.difficulty] || 0) + 1;
        
        const challengeId = challenge._id.toString();
        if (!completedChallenges.includes(challengeId)) {
          completedChallenges.push(challengeId);
        }

        categoryStats[challenge.category] = (categoryStats[challenge.category] || 0) + 1;
        difficultyStats[challenge.difficulty] = (difficultyStats[challenge.difficulty] || 0) + 1;
        languageStats[challenge.language] = (languageStats[challenge.language] || 0) + 1;

        (challenge.tags || []).forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase();
          tagStats[normalizedTag] = (tagStats[normalizedTag] || 0) + 1;
        });

        if (recentChallenges.length < 5) {
          recentChallenges.push({
            id: challengeId,
            title: challenge.title,
            category: challenge.category,
            difficulty: challenge.difficulty,
            completedAt: submission.submittedAt || new Date(),
          });
        }
      } else if (submission.aiAnalysis && submission.aiAnalysis.errorAnalyses) {
        submission.aiAnalysis.errorAnalyses.forEach(error => {
          errorTypeStats[error.errorType] = (errorTypeStats[error.errorType] || 0) + 1;
          
          // Track error patterns
          const pattern = `${challenge.language}-${error.errorType}`;
          errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
          
          if (challenge.category) {
            weaknessCategoryStats[challenge.category] = (weaknessCategoryStats[challenge.category] || 0) + 1;
          }
          (challenge.tags || []).forEach((tag: string) => {
            const normalizedTag = tag.toLowerCase();
            weaknessTagStats[normalizedTag] = (weaknessTagStats[normalizedTag] || 0) + 1;
          });
        });
      }
    });

    const experienceLevel =
      totalAccepted < 5 ? 'beginner' : totalAccepted < 15 ? 'intermediate' : 'advanced';

    // Preferred languages from behavior (submissions)
    const preferredLanguages = Object.entries(languageStats)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    // Combine favoriteLanguages (explicit) with preferredLanguages (behavior)
    // Priority: favoriteLanguages > preferredLanguages
    const combinedLanguages = [
      ...favoriteLanguages, // Explicit preferences first
      ...preferredLanguages.filter(lang => !favoriteLanguages.includes(lang)) // Then behavior-based
    ].slice(0, 5); // Limit to top 5

    // Calculate ML-based proficiency scores
    const languageProficiency: Record<string, number> = {};
    Object.keys(languageAttempts).forEach(lang => {
      const attempts = languageAttempts[lang] || 1;
      const successes = languageSuccess[lang] || 0;
      languageProficiency[lang] = Math.min(1, successes / attempts);
    });

    const categoryProficiency: Record<string, number> = {};
    Object.keys(categoryAttempts).forEach(cat => {
      const attempts = categoryAttempts[cat] || 1;
      const successes = categorySuccess[cat] || 0;
      categoryProficiency[cat] = Math.min(1, successes / attempts);
    });

    const difficultyProgression: Record<string, number> = {};
    Object.keys(difficultyAttempts).forEach(diff => {
      const attempts = difficultyAttempts[diff] || 1;
      const successes = difficultySuccess[diff] || 0;
      difficultyProgression[diff] = Math.min(1, successes / attempts);
    });

    // Learning velocity: challenges completed per day
    const learningVelocity = timeSpanDays > 0 ? totalAccepted / timeSpanDays : 0;

    const focusCategories = this.pickFocusCategories(categoryStats, weaknessCategoryStats);
    const focusTags = this.pickFocusTags(tagStats, weaknessTagStats);

    return {
      userId,
      totalSubmissions: submissions.length,
      totalAccepted,
      experienceLevel,
      preferredLanguages,
      favoriteLanguages,
      combinedLanguages,
      categoryStats,
      difficultyStats,
      tagStats,
      errorTypeStats,
      weaknessCategoryStats,
      weaknessTagStats,
      focusCategories,
      focusTags,
      completedChallenges,
      recentChallenges,
      // ML-based features
      languageProficiency,
      categoryProficiency,
      difficultyProgression,
      learningVelocity,
      errorPatterns,
    };
  }

  private pickFocusCategories(
    successStats: Record<string, number>,
    errorStats: Record<string, number>
  ): string[] {
    const weaknessScores: Record<string, number> = {};

    CATEGORY_ORDER.forEach(cat => {
      const errors = errorStats[cat] || 0;
      const successes = successStats[cat] || 0;
      if (errors > 0) {
        // Điểm yếu = (số lỗi * 2) - số thành công. Lỗi được coi trọng hơn.
        weaknessScores[cat] = (errors * 2) - successes;
      } else {
        // Phạt nặng những category không có lỗi để ưu tiên những category có lỗi
        weaknessScores[cat] = -successes - 100;
      }
    });

    const sorted = CATEGORY_ORDER.slice().sort((a, b) => (weaknessScores[b] || -Infinity) - (weaknessScores[a] || -Infinity));
    return sorted.slice(0, 2);
  }

  private pickFocusTags(
    successStats: Record<string, number>,
    errorStats: Record<string, number>
  ): string[] {
    const allTags = Array.from(new Set([...Object.keys(successStats), ...Object.keys(errorStats)]));
    const weaknessScores: Record<string, number> = {};

    allTags.forEach(tag => {
      const errors = errorStats[tag] || 0;
      const successes = successStats[tag] || 0;
      if (errors > 0) {
        weaknessScores[tag] = (errors * 2) - successes;
      }
    });

    return Object.entries(weaknessScores)
      .sort((a, b) => b[1] - a[1]) // Sắp xếp theo điểm yếu từ cao đến thấp
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  private getTargetDifficulty(experience: UserProfile['experienceLevel']): number {
    switch (experience) {
      case 'beginner':
        return 0.2;
      case 'intermediate':
        return 0.5;
      default:
        return 0.8;
    }
  }

  private difficultyToValue(difficulty: 'Easy' | 'Medium' | 'Hard'): number {
    return difficulty === 'Easy' ? 0 : difficulty === 'Medium' ? 0.5 : 1;
  }

  private async recommendChallenges(
    profile: UserProfile,
    limit: number
  ): Promise<Recommendation<IChallenge>[]> {
    const excludeIds = profile.completedChallenges.map((id) => new mongoose.Types.ObjectId(id));

    const query: any = {
      isActive: true,
      _id: { $nin: excludeIds },
    };

    if (profile.focusCategories.length > 0) {
      query.category = { $in: profile.focusCategories };
    }

    let challenges = await Challenge.find(query)
      .limit(80)
      .sort({ createdAt: -1 })
      .lean();

    if (challenges.length < limit) {
      const fallback = await Challenge.find({
        isActive: true,
        _id: { $nin: excludeIds },
      })
        .limit(80)
        .lean();
      challenges = Array.from(new Set([...challenges, ...fallback]));
    }

    const targetDifficulty = this.getTargetDifficulty(profile.experienceLevel);

    const scored = challenges.map((challenge: any) => {
      const reasons: string[] = [];
      let score = 0;

      if (profile.focusCategories.includes(challenge.category)) {
        score += 0.35;
        reasons.push('Tập trung vào category cần cải thiện');
      } else {
        score += 0.2;
      }

      // ML-based language scoring: prioritize favoriteLanguages > preferredLanguages
      if (profile.favoriteLanguages.includes(challenge.language)) {
        score += 0.35; // Highest priority for explicit preferences
        reasons.push('Ngôn ngữ yêu thích của bạn');
        
        // Bonus for proficiency in favorite language
        const proficiency = profile.languageProficiency[challenge.language] || 0;
        if (proficiency > 0.7) {
          score += 0.1;
          reasons.push('Bạn đã thành thạo ngôn ngữ này');
        }
      } else if (profile.preferredLanguages.includes(challenge.language)) {
        score += 0.2;
        reasons.push('Phù hợp ngôn ngữ bạn quen thuộc');
      } else if (profile.combinedLanguages.length === 0) {
        // If no language preference, give default score
        score += 0.1;
      } else {
        // Penalty for languages not in preferences
        score += 0.05;
      }

      const diffScore =
        1 - Math.min(1, Math.abs(this.difficultyToValue(challenge.difficulty) - targetDifficulty) * 1.5);
      score += diffScore * 0.2;

      const tagMatches = (challenge.tags || []).filter((tag: string) =>
        profile.focusTags.includes(tag.toLowerCase())
      );
      if (tagMatches.length > 0) {
        score += 0.15;
        reasons.push(`Liên quan tới tags: ${tagMatches.slice(0, 3).join(', ')}`);
      } else {
        score += 0.05;
      }

      const freshnessScore =
        challenge.updatedAt instanceof Date
          ? Math.max(0.1, 1 - (Date.now() - challenge.updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 90))
          : 0.3;
      score += freshnessScore * 0.1;

      // ML-based: Category proficiency bonus
      const categoryProf = profile.categoryProficiency[challenge.category] || 0;
      if (categoryProf > 0.5 && categoryProf < 0.8) {
        score += 0.1; // Sweet spot: not too easy, not too hard
        reasons.push('Phù hợp với trình độ category của bạn');
      }

      // ML-based: Difficulty progression
      const diffProf = profile.difficultyProgression[challenge.difficulty] || 0;
      if (diffProf > 0.6 && diffProf < 0.9) {
        score += 0.08; // Optimal difficulty for learning
        reasons.push('Độ khó phù hợp để cải thiện');
      }

      // ML-based: Learning velocity consideration
      if (profile.learningVelocity > 0.5) {
        score += 0.05; // Reward active learners with newer challenges
      }

      return {
        id: challenge._id.toString(),
        type: 'challenge' as const,
        score,
        reasons,
        data: challenge,
      };
    });

    // Apply collaborative filtering boost (if similar users exist)
    const boosted = await this.applyCollaborativeFiltering(scored, profile, limit);
    
    return boosted.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * ML-based Collaborative Filtering: Find challenges liked by similar users
   */
  private async applyCollaborativeFiltering(
    recommendations: Recommendation<IChallenge>[],
    profile: UserProfile,
    limit: number
  ): Promise<Recommendation<IChallenge>[]> {
    try {
      // Find users with similar language preferences and experience level
      const similarUsers = await Submission.aggregate([
        {
          $match: {
            status: 'Accepted',
            user: { $ne: new mongoose.Types.ObjectId(profile.userId) },
          },
        },
        {
          $lookup: {
            from: 'challenges',
            localField: 'challenge',
            foreignField: '_id',
            as: 'challengeData',
          },
        },
        {
          $unwind: '$challengeData',
        },
        {
          $match: {
            'challengeData.language': { $in: profile.combinedLanguages.length > 0 ? profile.combinedLanguages : ['Python', 'JavaScript'] },
            'challengeData.category': { $in: profile.focusCategories.length > 0 ? profile.focusCategories : CATEGORY_ORDER },
          },
        },
        {
          $group: {
            _id: '$challenge',
            userCount: { $sum: 1 },
            avgScore: { $avg: '$score' },
          },
        },
        {
          $sort: { userCount: -1, avgScore: -1 },
        },
        {
          $limit: 20,
        },
      ]);

      const popularChallengeIds = new Set(
        similarUsers.map((item: any) => item._id.toString())
      );

      // Boost score for challenges popular among similar users
      return recommendations.map((rec) => {
        if (popularChallengeIds.has(rec.id)) {
          rec.score += 0.15;
          rec.reasons.push('Được nhiều người dùng tương tự yêu thích');
        }
        return rec;
      });
    } catch (error) {
      console.error('[Personalized Plan] Collaborative filtering error:', error);
      return recommendations; // Return original if error
    }
  }

  private async recommendTrainingData(
    profile: UserProfile,
    limit: number
  ): Promise<Recommendation<ITrainingData>[]> {
    const query: any = { isActive: true };
    if (profile.focusCategories.length > 0) {
      query.category = { $in: profile.focusCategories };
    }

    let trainingData = await TrainingData.find(query).limit(80).lean();

    if (trainingData.length < limit) {
      const fallback = await TrainingData.find({ isActive: true }).limit(80).lean();
      trainingData = Array.from(new Set([...trainingData, ...fallback]));
    }

    const scored = trainingData.map((item) => {
      const reasons: string[] = [];
      let score = 0;

      if (profile.focusCategories.includes(item.category || '')) {
        score += 0.5;
        reasons.push('Hỗ trợ category cần luyện tập');
      }

      const tagMatches = (item.tags || []).filter((tag: string) =>
        profile.focusTags.includes(tag.toLowerCase())
      );
      if (tagMatches.length > 0) {
        score += 0.3;
        reasons.push(`Trùng tags quan tâm: ${tagMatches.slice(0, 3).join(', ')}`);
      } else {
        score += 0.1;
      }

      score += (item.priority || 1) * 0.05;

      return {
        id: (item._id as unknown as mongoose.Types.ObjectId).toString(),
        type: 'training_data' as const,
        score,
        reasons,
        data: item,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private buildLearningPath(
    profile: UserProfile,
    challengeRecs: Recommendation<IChallenge>[],
    trainingDataRecs: Recommendation<ITrainingData>[],
    resourceRecs: ILearningResource[]
  ): LearningPathStep[] {
    const steps: LearningPathStep[] = [];
    let step = 1;

    const byCategory = new Map<string, { training?: Recommendation<ITrainingData>; challenge?: Recommendation<IChallenge> }>();

    profile.focusCategories.forEach((category) => {
      byCategory.set(category, {});
    });

    trainingDataRecs.forEach((rec) => {
      const category = rec.data.category || 'general';
      const group = byCategory.get(category) || {};
      if (!group.training) {
        group.training = rec;
      }
      byCategory.set(category, group);
    });

    challengeRecs.forEach((rec) => {
      const category = rec.data.category || 'general';
      const group = byCategory.get(category) || {};
      if (!group.challenge) {
        group.challenge = rec;
      }
      byCategory.set(category, group);
    });

    byCategory.forEach((group, category) => {
      if (group.training) {
        steps.push({
          step: step++,
          type: 'training',
          title: group.training.data.question,
          category,
          tags: group.training.data.tags,
          description: 'Ôn lại kiến thức qua training data gợi ý.',
          resources: group.training.reasons,
        });
      }
      if (group.challenge) {
        steps.push({
          step: step++,
          type: 'challenge',
          title: group.challenge.data.title,
          category,
          difficulty: group.challenge.data.difficulty,
          tags: group.challenge.data.tags,
          description: 'Áp dụng kiến thức với bài tập phù hợp.',
          resources: group.challenge.reasons,
        });
      }
    });

    // Thêm bước tài nguyên ngoài hệ thống (article/video/exercise) dựa trên lỗi
    resourceRecs.slice(0, 3).forEach((res) => {
      steps.push({
        step: step++,
        type: 'training',
        title: res.title,
        category: res.category || 'general',
        tags: res.tags,
        description: `Tài nguyên ${res.type} - phù hợp lỗi ${res.errorTypes.join(', ')}`,
        resources: [res.url],
      });
    });

    return steps;
  }

  private applyRecommendationsToGraph(
    graph: KnowledgeGraph,
    profile: UserProfile,
    trainingRecs: Recommendation<ITrainingData>[]
  ): KnowledgeGraph {
    const trainingIds = new Set(trainingRecs.map((rec) => rec.id));
    const focusCategoryIds = new Set(
      profile.focusCategories.map((category) => `cat_${category}`)
    );
    const focusTags = new Set(profile.focusTags);

    const nodes = graph.nodes.map((node) => {
      const updated: GraphNode & {
        isRecommended?: boolean;
        isFocusCategory?: boolean;
        isFocusTag?: boolean;
      } = { ...node };

      if (node.type === 'training_data' && node.data?._id) {
        if (trainingIds.has(node.data._id.toString())) {
          updated.isRecommended = true;
          updated.color = '#F97316';
          updated.size = (node.size || 10) + 6;
        }
      }

      if (node.type === 'category' && focusCategoryIds.has(node.id)) {
        updated.isFocusCategory = true;
        updated.color = '#6366F1';
        updated.size = (node.size || 15) + 4;
      }

      if (node.type === 'tag' && node.data?.tag) {
        if (focusTags.has(node.data.tag.toLowerCase())) {
          updated.isFocusTag = true;
          updated.color = '#0EA5E9';
          updated.size = (node.size || 10) + 3;
        }
      }

      return updated;
    });

    return { ...graph, nodes };
  }
}

export const personalizedPlanService = new PersonalizedPlanService();

