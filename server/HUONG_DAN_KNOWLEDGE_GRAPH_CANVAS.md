# 🕸️ Hướng Dẫn Triển Khai Knowledge Graph Canvas

## 📋 Tổng Quan

Knowledge Graph Canvas là một công cụ visualization để hiển thị mối quan hệ giữa các training data trong hệ thống. Nó giúp:
- **Visualize** cấu trúc dữ liệu training
- **Hiểu** mối quan hệ giữa các concepts
- **Tìm kiếm** và **navigate** dữ liệu dễ dàng
- **Phân tích** clusters và patterns

## 🎯 Kiến Trúc Tổng Quan

```
┌─────────────────┐
│  Training Data  │
│   (MongoDB)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Graph Builder  │
│   (Backend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Graph Data     │
│   (JSON API)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Canvas   │
│  (Frontend)     │
└─────────────────┘
```

## 📦 Bước 1: Cài Đặt Dependencies

### 1.1. Cài đặt thư viện visualization

```bash
cd client
npm install react-force-graph-2d react-force-graph-3d
# hoặc
npm install vis-network
# hoặc (nhẹ hơn)
npm install @react-vis-force/core
```

**Khuyến nghị:** Sử dụng `react-force-graph-2d` vì:
- ✅ Nhẹ, hiệu năng tốt
- ✅ Dễ customize
- ✅ Hỗ trợ tốt TypeScript
- ✅ Có thể chuyển sang 3D nếu cần

### 1.2. Cài đặt thêm utilities

```bash
npm install d3-force d3-selection d3-zoom
npm install @types/d3-force @types/d3-selection @types/d3-zoom
```

## 🏗️ Bước 2: Tạo Backend API

### 2.1. Tạo Service để Build Graph

Tạo file `server/src/services/knowledgeGraphService.ts`:

```typescript
import TrainingData from '../models/trainingData.model';
import { word2vecService } from './word2vecService';

export interface GraphNode {
  id: string;
  label: string;
  type: 'training_data' | 'category' | 'tag' | 'concept';
  data: any;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'category' | 'tag' | 'similar' | 'related';
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

    // 4. Tạo links giữa các training data tương tự (sử dụng Word2Vec)
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
    threshold: number = 0.6
  ): Promise<GraphLink[]> {
    const links: GraphLink[] = [];
    
    for (let i = 0; i < trainingData.length; i++) {
      for (let j = i + 1; j < trainingData.length; j++) {
        try {
          const td1 = trainingData[i];
          const td2 = trainingData[j];
          
          const similarResults = await word2vecService.findSimilarTrainingData(
            td1.question,
            1
          );
          
          const similar = similarResults.find(
            r => r.trainingData._id.toString() === td2._id.toString()
          );
          
          if (similar && similar.similarity >= threshold) {
            links.push({
              id: `similar_${td1._id}_${td2._id}`,
              source: `td_${td1._id}`,
              target: `td_${td2._id}`,
              type: 'similar',
              strength: similar.similarity,
              distance: 1 - similar.similarity, // Inverse of similarity
            });
          }
        } catch (error) {
          // Skip if error
          continue;
        }
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
}

export const knowledgeGraphService = new KnowledgeGraphService();
```

### 2.2. Tạo Controller

Tạo file `server/src/controllers/knowledgeGraph.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { knowledgeGraphService } from '../services/knowledgeGraphService';

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
}
```

### 2.3. Tạo Routes

Tạo file `server/src/routes/knowledgeGraph.routes.ts`:

```typescript
import express from 'express';
import { KnowledgeGraphController } from '../controllers/knowledgeGraph.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const knowledgeGraphController = new KnowledgeGraphController();

// Tất cả routes đều yêu cầu authentication
router.use(authenticateToken);

router.get('/', (req, res) => knowledgeGraphController.getGraph(req, res));
router.get('/stats', (req, res) => knowledgeGraphController.getGraphStats(req, res));

export default router;
```

### 2.4. Thêm vào app.ts

```typescript
import knowledgeGraphRoutes from './routes/knowledgeGraph.routes';

// ... trong app.use
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
```

## 🎨 Bước 3: Tạo Frontend Component

### 3.1. Cài đặt dependencies

```bash
cd client
npm install react-force-graph-2d
npm install d3-force
```

### 3.2. Tạo KnowledgeGraphCanvas Component

Tạo file `client/src/components/admin/KnowledgeGraphCanvas.tsx`:

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ZoomIn, ZoomOut, RotateCcw, Search, Filter, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { buildApi } from '@/lib/apiBase';

interface GraphNode {
  id: string;
  label: string;
  type: 'training_data' | 'category' | 'tag' | 'concept';
  data: any;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'category' | 'tag' | 'similar' | 'related';
  strength?: number;
  distance?: number;
}

interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

const KnowledgeGraphCanvas: React.FC = () => {
  const { language } = useLanguage();
  const fgRef = useRef<any>();
  const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  // Fetch graph data
  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(cat => params.append('categories', cat));
      }
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => params.append('tags', tag));
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${buildApi('/knowledge-graph')}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }

      const result = await response.json();
      if (result.success) {
        setGraph(result.data);
      } else {
        throw new Error(result.message || 'Failed to load graph');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading graph');
      console.error('Fetch graph error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategories, selectedTags]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNode(node);
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(1.5, 1000);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(0.75, 1000);
    }
  };

  const handleReset = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000);
    }
  };

  // Get available categories and tags
  const categories = Array.from(
    new Set(graph.nodes.filter(n => n.type === 'category').map(n => n.data.category))
  );
  const tags = Array.from(
    new Set(graph.nodes.filter(n => n.type === 'tag').map(n => n.data.tag))
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {language === 'vi' ? 'Đang tải graph...' : 'Loading graph...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'vi' ? 'Knowledge Graph Canvas' : 'Knowledge Graph Canvas'}
          </CardTitle>
          <CardDescription>
            {language === 'vi' 
              ? 'Visualize mối quan hệ giữa các training data'
              : 'Visualize relationships between training data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select
              value={selectedCategories[0] || ''}
              onValueChange={(value) => {
                if (value) {
                  setSelectedCategories([value]);
                } else {
                  setSelectedCategories([]);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'vi' ? 'Chọn category' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{language === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Graph Canvas */}
          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <ForceGraph2D
              ref={fgRef}
              graphData={graph}
              nodeLabel={(node: GraphNode) => {
                if (node.type === 'training_data') {
                  return `${node.label}\n\n${node.data.question}`;
                }
                return node.label;
              }}
              nodeColor={(node: GraphNode) => node.color || '#6B7280'}
              nodeVal={(node: GraphNode) => node.size || 10}
              linkColor={() => 'rgba(0, 0, 0, 0.2)'}
              linkWidth={(link: GraphLink) => {
                if (link.type === 'similar') return 2;
                return 1;
              }}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              cooldownTicks={100}
              onEngineStop={() => fgRef.current?.zoomToFit(400)}
            />
          </div>

          {/* Node Info Panel */}
          {selectedNode && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedNode.type === 'training_data' 
                      ? (language === 'vi' ? 'Chi tiết Training Data' : 'Training Data Details')
                      : selectedNode.label}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedNode(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedNode.type === 'training_data' && (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                        {language === 'vi' ? 'Câu hỏi:' : 'Question:'}
                      </p>
                      <p className="mt-1">{selectedNode.data.question}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                        {language === 'vi' ? 'Câu trả lời:' : 'Answer:'}
                      </p>
                      <p className="mt-1 text-sm">{selectedNode.data.answer.substring(0, 200)}...</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{selectedNode.data.category}</Badge>
                      {selectedNode.data.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      {language === 'vi' 
                        ? `Đã sử dụng: ${selectedNode.data.usageCount || 0} lần`
                        : `Used: ${selectedNode.data.usageCount || 0} times`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hover Tooltip */}
          {hoverNode && !selectedNode && (
            <div className="fixed bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 z-50 pointer-events-none">
              <p className="font-semibold text-sm">{hoverNode.label}</p>
              {hoverNode.type === 'training_data' && (
                <p className="text-xs text-gray-500 mt-1">
                  {hoverNode.data.category}
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeGraphCanvas;
```

### 3.3. Thêm vào Admin Dashboard

Trong `client/src/components/admin/AdminDashboard.tsx`:

```typescript
import KnowledgeGraphCanvas from './KnowledgeGraphCanvas';

// Thêm vào OTHER_TABS
const OTHER_TABS = [
  // ... existing tabs
  { 
    id: 'knowledge-graph', 
    icon: Network, // import Network from lucide-react
    label: { vi: 'Knowledge Graph', en: 'Knowledge Graph' }, 
    color: 'text-indigo-500' 
  },
];

// Trong render
{activeOtherTab === 'knowledge-graph' && <KnowledgeGraphCanvas />}
```

## 🎨 Bước 4: Customization & Styling

### 4.1. Custom Node Rendering

```typescript
// Trong KnowledgeGraphCanvas.tsx
nodeCanvasObject={(node: GraphNode, ctx: CanvasRenderingContext2D) => {
  const label = node.label;
  const fontSize = node.type === 'training_data' ? 12 : 10;
  ctx.font = `${fontSize}px Sans-Serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = node.color || '#6B7280';
  ctx.fillText(label, node.x!, node.y!);
}}
```

### 4.2. Custom Link Rendering

```typescript
linkCanvasObject={(link: GraphLink, ctx: CanvasRenderingContext2D) => {
  // Custom link rendering
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;
  
  ctx.beginPath();
  ctx.moveTo(source.x!, source.y!);
  ctx.lineTo(target.x!, target.y!);
  ctx.strokeStyle = link.type === 'similar' ? '#8B5CF6' : '#9CA3AF';
  ctx.lineWidth = link.type === 'similar' ? 2 : 1;
  ctx.stroke();
}}
```

## 🚀 Bước 5: Tính Năng Nâng Cao

### 5.1. Search & Highlight

```typescript
const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());

// Khi search, highlight nodes
useEffect(() => {
  if (searchTerm) {
    const matching = graph.nodes
      .filter(n => 
        n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.type === 'training_data' && 
         n.data.question.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(n => n.id);
    setHighlightNodes(new Set(matching));
  } else {
    setHighlightNodes(new Set());
  }
}, [searchTerm, graph]);
```

### 5.2. Export Graph

```typescript
const handleExport = () => {
  const dataStr = JSON.stringify(graph, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'knowledge-graph.json';
  link.click();
};
```

### 5.3. 3D Mode (Optional)

```typescript
import ForceGraph3D from 'react-force-graph-3d';

// Switch between 2D and 3D
const [is3D, setIs3D] = useState(false);

{is3D ? (
  <ForceGraph3D
    graphData={graph}
    // ... similar props
  />
) : (
  <ForceGraph2D
    graphData={graph}
    // ... props
  />
)}
```

## 📊 Bước 6: Testing

### 6.1. Test API

```bash
# Get graph
curl http://localhost:5000/api/knowledge-graph \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get filtered graph
curl "http://localhost:5000/api/knowledge-graph?categories=debugging&search=javascript" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6.2. Test Component

1. Mở Admin Dashboard
2. Click vào tab "Knowledge Graph"
3. Kiểm tra:
   - Graph hiển thị đúng
   - Nodes có màu sắc phù hợp
   - Click node hiển thị thông tin
   - Search hoạt động
   - Filter hoạt động
   - Zoom controls hoạt động

## 🎯 Checklist Hoàn Thành

- [ ] Cài đặt dependencies
- [ ] Tạo backend service
- [ ] Tạo backend controller
- [ ] Tạo backend routes
- [ ] Tạo frontend component
- [ ] Thêm vào Admin Dashboard
- [ ] Test API
- [ ] Test UI
- [ ] Customize styling
- [ ] Thêm tính năng nâng cao (optional)

## 📚 Tài Liệu Tham Khảo

- [react-force-graph-2d](https://github.com/vasturiano/react-force-graph)
- [D3 Force](https://github.com/d3/d3-force)
- [Knowledge Graph Best Practices](https://www.w3.org/TR/vocab-dcat/)

## 🐛 Troubleshooting

### Graph không hiển thị
- Kiểm tra API trả về đúng format
- Kiểm tra console logs
- Đảm bảo có training data trong database

### Performance chậm
- Giới hạn số lượng nodes (filter)
- Sử dụng pagination
- Optimize graph building

### Nodes không có màu
- Kiểm tra `getCategoryColor` function
- Đảm bảo category được set đúng

---

**Chúc bạn thành công! 🎉**

