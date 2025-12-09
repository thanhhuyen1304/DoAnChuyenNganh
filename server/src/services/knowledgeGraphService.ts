import TrainingData from '../models/trainingData.model';
import Challenge from '../models/challenge.model'; // Import Challenge model
import Submission from '../models/submission.model'; // Import Submission model
import { word2vecService } from './word2vecService';
import mongoose from 'mongoose';
import { learningResourceService } from './learningResourceService';
import { ILearningResource } from '../models/learningResource.model';

export interface GraphNode {
  id: string;
  label: string;
  type: 'training_data' | 'challenge' | 'category' | 'tag' | 'concept' | 'error'; // Add 'error' type
  data: any;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
  isRecommended?: boolean;
  isErrorRelated?: boolean;
  errorCount?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'category' | 'tag' | 'similar' | 'related' | 'error_related' | 'learning_path';
  strength?: number;
  distance?: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export class KnowledgeGraphService {
  /**
   * Build knowledge graph từ training data
   */
  async buildGraph(): Promise<KnowledgeGraph> {
    const trainingData = await TrainingData.find({ isActive: true }).lean();
    const challenges = await Challenge.find({ isActive: true }).lean(); // Fetch challenges

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // 1. Tạo nodes cho training data
    trainingData.forEach((td, index) => {
      const nodeId = `td_${td._id}`;
      const node: GraphNode = {
        id: nodeId,
        label: td.question.substring(0, 50) + '...',
        type: 'training_data',
        data: {
          _id: td._id.toString(),
          question: td.question,
          answer: td.answer,
          category: td.category,
          tags: td.tags,
          priority: td.priority,
          usageCount: td.usageCount || 0,
        },
        size: Math.max(5, Math.min(20, (td.usageCount || 0) / 10 + 5)),
        color: this.getCategoryColor(td.category || 'general'),
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // 2. Tạo nodes cho categories
      if (td.category) {
        const categoryId = `cat_${td.category}`;
        if (!nodeMap.has(categoryId)) {
          const categoryNode: GraphNode = {
            id: categoryId,
            label: td.category,
            type: 'category',
            data: { category: td.category },
            size: 15,
            color: this.getCategoryColor(td.category),
          };
          nodes.push(categoryNode);
          nodeMap.set(categoryId, categoryNode);
        }

        // Link training data với category
        links.push({
          id: `link_${nodeId}_${categoryId}`,
          source: nodeId,
          target: categoryId,
          type: 'category',
          strength: 0.5,
        });
      }

      // 3. Tạo nodes cho tags
      if (td.tags && td.tags.length > 0) {
        td.tags.forEach(tag => {
          const tagId = `tag_${tag}`;
          if (!nodeMap.has(tagId)) {
            const tagNode: GraphNode = {
              id: tagId,
              label: tag,
              type: 'tag',
              data: { tag },
              size: 10,
              color: '#9CA3AF',
            };
            nodes.push(tagNode);
            nodeMap.set(tagId, tagNode);
          }

          // Link training data với tag
          links.push({
            id: `link_${nodeId}_${tagId}`,
            source: nodeId,
            target: tagId,
            type: 'tag',
            strength: 0.3,
          });
        });
      }
    });

    // 4. Tạo nodes cho challenges
    challenges.forEach(ch => {
      const nodeId = `ch_${ch._id}`;
      const node: GraphNode = {
        id: nodeId,
        label: ch.title,
        type: 'challenge',
        data: {
          _id: ch._id.toString(),
          title: ch.title,
          difficulty: ch.difficulty,
          category: ch.category,
          tags: ch.tags,
        },
        size: 12, // Kích thước cố định cho challenge
        color: this.getDifficultyColor(ch.difficulty),
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);

      // Link challenge với category
      if (ch.category) {
        const categoryId = `cat_${ch.category}`;
        if (nodeMap.has(categoryId)) {
          links.push({
            id: `link_${nodeId}_${categoryId}`,
            source: nodeId,
            target: categoryId,
            type: 'category',
            strength: 0.6,
          });
        }
      }

      // Link challenge với tags
      if (ch.tags && ch.tags.length > 0) {
        ch.tags.forEach(tag => {
          const tagId = `tag_${tag}`;
          if (nodeMap.has(tagId)) {
            links.push({
              id: `link_${nodeId}_${tagId}`,
              source: nodeId,
              target: tagId,
              type: 'tag',
              strength: 0.4,
            });
          }
        });
      }
    });

    // 5. Tạo links giữa các training data tương tự (sử dụng Word2Vec)
    if (word2vecService.isModelTrained()) {
      const similarLinks = await this.findSimilarTrainingData(trainingData);
      links.push(...similarLinks);
    }

    return { nodes, links };
  }

  /**
   * Tìm training data tương tự và tạo links
   */
  private async findSimilarTrainingData(
    trainingData: any[],
    threshold: number = 0.6,
    perNodeLimit: number = 3
  ): Promise<GraphLink[]> {
    const links: GraphLink[] = [];
    const createdPairs = new Set<string>();

    for (const td of trainingData) {
      try {
        const similarResults = await word2vecService.findSimilarTrainingData(
          td.question,
          perNodeLimit
        );

        similarResults.forEach((result) => {
          const target = result.trainingData;
          const similarity = result.similarity ?? 0;
          if (!target?._id || similarity < threshold) {
            return;
          }

          const sourceId = `td_${td._id}`;
          const targetId = `td_${target._id}`;
          if (sourceId === targetId) {
            return;
          }

          const pairKey =
            sourceId < targetId ? `${sourceId}_${targetId}` : `${targetId}_${sourceId}`;
          if (createdPairs.has(pairKey)) {
            return;
          }

          createdPairs.add(pairKey);
          links.push({
            id: `similar_${pairKey}`,
            source: sourceId,
            target: targetId,
            type: 'similar',
            strength: similarity,
            distance: 1 - similarity,
          });
        });
      } catch (error) {
        continue;
      }
    }

    return links;
  }

  /**
   * Lấy màu theo category
   */
  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'debugging': '#EF4444',
      'react': '#61DAFB',
      'javascript': '#F7DF1E',
      'python': '#3776AB',
      'java': '#ED8B00',
      'general': '#6B7280',
      'bughunter': '#8B5CF6',
    };
    return colors[category.toLowerCase()] || '#6B7280';
  }

  /**
   * Lấy màu theo độ khó
   */
  private getDifficultyColor(difficulty: 'Easy' | 'Medium' | 'Hard'): string {
    const colors = {
      'Easy': '#22C55E',   // green-500
      'Medium': '#F59E0B', // amber-500
      'Hard': '#EF4444',   // red-500
    };
    return colors[difficulty] || '#6B7280';
  }

  /**
   * Filter graph theo category hoặc tag
   */
  async buildFilteredGraph(filters: {
    categories?: string[];
    tags?: string[];
    search?: string;
  }): Promise<KnowledgeGraph> {
    const fullGraph = await this.buildGraph();
    
    if (!filters.categories && !filters.tags && !filters.search) {
      return fullGraph;
    }

    const filteredNodes = new Set<string>();
    const filteredLinks: GraphLink[] = [];

    // Filter nodes
    fullGraph.nodes.forEach(node => {
      let include = true;

      if (filters.categories && filters.categories.length > 0) {
        if (node.type === 'category') {
          include = filters.categories.includes(node.data.category);
        } else if (node.type === 'training_data') {
          include = filters.categories.includes(node.data.category);
        } else {
          include = false;
        }
      }

      if (include && filters.tags && filters.tags.length > 0) {
        if (node.type === 'tag') {
          include = filters.tags.includes(node.data.tag);
        } else if (node.type === 'training_data') {
          include = node.data.tags?.some((tag: string) => filters.tags!.includes(tag));
        } else {
          include = false;
        }
      }

      if (include && filters.search) {
        const searchLower = filters.search.toLowerCase();
        include = 
          node.label.toLowerCase().includes(searchLower) ||
          (node.type === 'training_data' && 
           (node.data.question.toLowerCase().includes(searchLower) ||
            node.data.answer.toLowerCase().includes(searchLower)));
      }

      if (include) {
        filteredNodes.add(node.id);
      }
    });

    // Filter links (chỉ giữ links giữa các nodes được filter)
    fullGraph.links.forEach(link => {
      if (filteredNodes.has(link.source) && filteredNodes.has(link.target)) {
        filteredLinks.push(link);
      }
    });

    return {
      nodes: fullGraph.nodes.filter(n => filteredNodes.has(n.id)),
      links: filteredLinks,
    };
  }

  /**
   * Build knowledge graph dựa trên errors của user trong quá trình giải bài
   * Highlight các training data và challenges liên quan đến errors
   */
  async buildErrorBasedGraph(
    userId: string,
    challengeId?: string
  ): Promise<KnowledgeGraph & {
    errorSummary: {
      errorTypes: Record<string, number>;
      recentErrors: any[];
      recommendedTopics: string[];
    };
    recommendations: {
      trainingData: any[];
      challenges: any[];
    };
    learningResources: ILearningResource[];
    knowledgeGaps: string[];
  }> {
    const fullGraph = await this.buildGraph();
    
    // Lấy submissions gần đây của user
    const query: any = { user: new mongoose.Types.ObjectId(userId) };
    if (challengeId) {
      query.challenge = new mongoose.Types.ObjectId(challengeId);
    }

    const recentSubmissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(20)
      .populate('challenge')
      .lean();

    // Phân tích errors
    const errorTypes: Record<string, number> = {};
    const errorMessages: string[] = [];
    const relatedCategories: Set<string> = new Set();
    const relatedTags: Set<string> = new Set();
    const relatedLanguages: Set<string> = new Set();
    const challengeIds: Set<string> = new Set();
    let totalAccepted = 0;

    recentSubmissions.forEach(sub => {
      if (sub.status !== 'Accepted' && sub.aiAnalysis?.errorAnalyses) {
        sub.aiAnalysis.errorAnalyses.forEach((error: any) => {
          errorTypes[error.errorType] = (errorTypes[error.errorType] || 0) + 1;
          if (error.errorMessage) {
            errorMessages.push(error.errorMessage.toLowerCase());
          }
        });
      }

      // Thu thập categories và tags từ challenge đang làm
      if (sub.status === 'Accepted') {
        totalAccepted += 1;
      }

      if (sub.challenge && typeof sub.challenge === 'object') {
        const ch = sub.challenge as any;
        if (ch.category) relatedCategories.add(ch.category);
        if (ch.tags) ch.tags.forEach((tag: string) => relatedTags.add(tag));
        if (ch.language) relatedLanguages.add((ch.language as string).toLowerCase());
        challengeIds.add(ch._id.toString());
      }
    });

    // Tạo error nodes
    const errorNodes: GraphNode[] = [];
    Object.entries(errorTypes).forEach(([errorType, count]) => {
      errorNodes.push({
        id: `error_${errorType}`,
        label: `${errorType} Error (${count}x)`,
        type: 'error',
        data: {
          errorType,
          count,
        },
        size: Math.min(20, 10 + count * 2),
        color: '#EF4444', // Red for errors
      });
    });

    // Highlight và recommend nodes liên quan
    const recommendedNodeIds = new Set<string>();
    const errorRelatedNodeIds = new Set<string>();

    fullGraph.nodes.forEach(node => {
      // Highlight nodes liên quan đến errors
      if (node.type === 'training_data') {
        const td = node.data;
        const questionLower = (td.question || '').toLowerCase();
        const answerLower = (td.answer || '').toLowerCase();
        
        // Kiểm tra nếu training data liên quan đến error types
        Object.keys(errorTypes).forEach(errorType => {
          if (questionLower.includes(errorType) || answerLower.includes(errorType)) {
            errorRelatedNodeIds.add(node.id);
            recommendedNodeIds.add(node.id);
          }
        });

        // Kiểm tra categories và tags
        if (td.category && relatedCategories.has(td.category)) {
          recommendedNodeIds.add(node.id);
        }
        if (td.tags && td.tags.some((tag: string) => relatedTags.has(tag))) {
          recommendedNodeIds.add(node.id);
        }
      }

      // Highlight challenge đang làm
      if (node.type === 'challenge' && challengeIds.has(node.data._id)) {
        errorRelatedNodeIds.add(node.id);
        node.size = (node.size || 12) + 5;
      }
    });

    // Tạo links từ error nodes đến các training data liên quan
    const errorLinks: GraphLink[] = [];
    errorNodes.forEach(errorNode => {
      const errorType = errorNode.data.errorType;
      fullGraph.nodes.forEach(node => {
        if (recommendedNodeIds.has(node.id) && node.type === 'training_data') {
          const questionLower = (node.data.question || '').toLowerCase();
          if (questionLower.includes(errorType)) {
            errorLinks.push({
              id: `error_link_${errorNode.id}_${node.id}`,
              source: errorNode.id,
              target: node.id,
              type: 'error_related',
              strength: 0.8,
            });
          }
        }
      });
    });

    // Tìm training data recommendations dựa trên errors
    const recommendedTrainingData = await TrainingData.find({
      isActive: true,
      $or: [
        ...Array.from(relatedCategories).map(cat => ({ category: cat })),
        ...Array.from(relatedTags).map(tag => ({ tags: tag })),
      ],
    })
      .limit(10)
      .lean();

    // Tìm challenge recommendations
    const relatedChallenges = await Challenge.find({
      isActive: true,
      $or: [
        ...Array.from(relatedCategories).map(cat => ({ category: cat })),
        ...Array.from(relatedTags).map(tag => ({ tags: tag })),
      ],
    })
      .limit(10)
      .lean();

    // Cập nhật nodes với recommendations
    const updatedNodes = fullGraph.nodes.map(node => {
      if (recommendedNodeIds.has(node.id)) {
        return { ...node, isRecommended: true };
      }
      if (errorRelatedNodeIds.has(node.id)) {
        return { ...node, isErrorRelated: true };
      }
      return node;
    });

    const experienceLevel =
      totalAccepted < 5 ? 'beginner' : totalAccepted < 15 ? 'intermediate' : 'advanced';

    const learningResources = await learningResourceService.suggestForErrors({
      errorTypes: Object.keys(errorTypes),
      languages: Array.from(relatedLanguages),
      tags: Array.from(relatedTags),
      level: experienceLevel,
      limit: 8,
    });

    const targetDifficulties =
      experienceLevel === 'beginner'
        ? ['Easy']
        : experienceLevel === 'intermediate'
        ? ['Easy', 'Medium']
        : ['Medium', 'Hard'];

    const knowledgeGaps: string[] = [];
    Object.entries(errorTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([type, count]) => knowledgeGaps.push(`Thiếu kiến thức về lỗi ${type} (gặp ${count} lần)`));

    Array.from(relatedCategories)
      .slice(0, 2)
      .forEach(cat => knowledgeGaps.push(`Cần ôn thêm chủ đề ${cat}`));

    Array.from(relatedTags)
      .slice(0, 3)
      .forEach(tag => knowledgeGaps.push(`Rèn luyện thêm tag ${tag}`));

    // Tìm challenge recommendations phù hợp lỗi + độ khó
    const recommendedChallenges = await Challenge.find({
      isActive: true,
      difficulty: { $in: targetDifficulties },
      $or: [
        ...Array.from(relatedCategories).map(cat => ({ category: cat })),
        ...Array.from(relatedTags).map(tag => ({ tags: tag })),
      ],
    })
      .limit(5)
      .lean();

    return {
      nodes: [...updatedNodes, ...errorNodes],
      links: [...fullGraph.links, ...errorLinks],
      errorSummary: {
        errorTypes,
        recentErrors: recentSubmissions
          .filter(sub => sub.status !== 'Accepted')
          .slice(0, 5)
          .map(sub => ({
            challengeId: typeof sub.challenge === 'object' ? (sub.challenge as any)._id : sub.challenge,
            challengeTitle: typeof sub.challenge === 'object' ? (sub.challenge as any).title : 'Unknown',
            status: sub.status,
            errors: sub.aiAnalysis?.errorAnalyses || [],
            submittedAt: sub.submittedAt,
          })),
        recommendedTopics: Array.from(relatedCategories),
      },
      recommendations: {
        trainingData: recommendedTrainingData,
        challenges: recommendedChallenges,
      },
      learningResources,
      knowledgeGaps,
    };
  }

  /**
   * Tìm training data liên quan đến errors để gợi ý cho chatbot
   */
  async findTrainingDataForErrors(
    errorMessages: string[],
    errorTypes: string[],
    limit: number = 5
  ): Promise<any[]> {
    const allTrainingData = await TrainingData.find({ isActive: true }).lean();
    
    const scoredData = allTrainingData.map(td => {
      let score = 0;
      const questionLower = td.question.toLowerCase();
      const answerLower = td.answer.toLowerCase();

      // Tính điểm dựa trên error messages
      errorMessages.forEach(msg => {
        if (questionLower.includes(msg) || answerLower.includes(msg)) {
          score += 2;
        }
      });

      // Tính điểm dựa trên error types
      errorTypes.forEach(type => {
        if (questionLower.includes(type) || answerLower.includes(type)) {
          score += 3;
        }
      });

      return { trainingData: td, score };
    });

    // Sắp xếp theo điểm và trả về top results
    return scoredData
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.trainingData);
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
