import { Request, Response } from 'express';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import { personalizedPlanService } from '../services/personalizedPlanService';
import { IUser } from '../models/user.model';

interface AuthenticatedRequest extends Request {
  user?: IUser & { id: string; email: string; role?: string };
}

export class KnowledgeGraphController {
  /**
   * Lấy knowledge graph đầy đủ
   */
  async getGraph(req: Request, res: Response): Promise<any> {
    try {
      const { categories, tags, search } = req.query;

      const filters: any = {};
      if (categories) {
        filters.categories = Array.isArray(categories) 
          ? categories 
          : [categories];
      }
      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : [tags];
      }
      if (search) {
        filters.search = search as string;
      }

      const graph = await knowledgeGraphService.buildFilteredGraph(filters);

      return res.json({
        success: true,
        data: graph,
      });
    } catch (error: any) {
      console.error('Get knowledge graph error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy knowledge graph',
        error: error.message,
      });
    }
  }

  /**
   * Lấy thống kê graph
   */
  async getGraphStats(req: Request, res: Response): Promise<any> {
    try {
      const graph = await knowledgeGraphService.buildGraph();
      
      const stats = {
        totalNodes: graph.nodes.length,
        totalLinks: graph.links.length,
        nodesByType: graph.nodes.reduce((acc, node) => {
          acc[node.type] = (acc[node.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        linksByType: graph.links.reduce((acc, link) => {
          acc[link.type] = (acc[link.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get graph stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê graph',
        error: error.message,
      });
    }
  }

  /**
   * Lấy personalized knowledge graph + recommendations
   */
  async getPersonalizedGraph(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Bạn cần đăng nhập để sử dụng tính năng này',
        });
      }

      const plan = await personalizedPlanService.buildPlan(req.user.id);

      return res.json({
        success: true,
        data: plan,
      });
    } catch (error: any) {
      console.error('Get personalized graph error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo personalized graph',
        error: error.message,
      });
    }
  }

  /**
   * Lấy knowledge graph dựa trên errors của user (cho trang Practice)
   */
  async getErrorBasedGraph(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Bạn cần đăng nhập để sử dụng tính năng này',
        });
      }

      const { challengeId } = req.query;
      const graphData = await knowledgeGraphService.buildErrorBasedGraph(
        req.user.id,
        challengeId as string | undefined
      );

      return res.json({
        success: true,
        data: graphData,
      });
    } catch (error: any) {
      console.error('Get error-based graph error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy error-based graph',
        error: error.message,
      });
    }
  }

  /**
   * Tìm training data liên quan đến errors (cho chatbot)
   */
  async findTrainingDataForErrors(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { errorMessages, errorTypes } = req.body;
      
      if (!errorMessages || !Array.isArray(errorMessages)) {
        return res.status(400).json({
          success: false,
          message: 'errorMessages phải là một mảng',
        });
      }

      const errorTypesArray = errorTypes && Array.isArray(errorTypes) ? errorTypes : [];
      const trainingData = await knowledgeGraphService.findTrainingDataForErrors(
        errorMessages,
        errorTypesArray,
        5
      );

      return res.json({
        success: true,
        data: trainingData,
      });
    } catch (error: any) {
      console.error('Find training data for errors error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm training data',
        error: error.message,
      });
    }
  }
}
