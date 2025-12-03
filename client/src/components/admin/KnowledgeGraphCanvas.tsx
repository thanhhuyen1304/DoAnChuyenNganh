import React, { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ZoomIn, ZoomOut, RotateCcw, Search, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase } from '@/lib/apiBase';

interface GraphNode {
  id: string;
  label: string;
  type: 'training_data' | 'category' | 'tag' | 'concept';
  data: any;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
  isRecommended?: boolean;
  isFocusCategory?: boolean;
  isFocusTag?: boolean;
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

interface ChallengeRecommendation {
  id: string;
  score: number;
  reasons: string[];
  data: {
    title: string;
    category: string;
    difficulty: string;
    tags?: string[];
    language?: string;
  };
}

interface TrainingDataRecommendation {
  id: string;
  score: number;
  reasons: string[];
  data: {
    question: string;
    answer: string;
    category?: string;
    tags?: string[];
  };
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

interface UserProfileSummary {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  focusCategories: string[];
  focusTags: string[];
  preferredLanguages: string[];
  totalAccepted: number;
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
  const [viewMode, setViewMode] = useState<'global' | 'personalized'>('global');
  const [profileSummary, setProfileSummary] = useState<UserProfileSummary | null>(null);
  const [challengeRecs, setChallengeRecs] = useState<ChallengeRecommendation[]>([]);
  const [trainingRecs, setTrainingRecs] = useState<TrainingDataRecommendation[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPathStep[]>([]);

  const fetchGraph = useCallback(
    async (mode: 'global' | 'personalized' = viewMode) => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');

        let endpoint = '/knowledge-graph';
        let query = '';

        if (mode === 'global') {
          const params = new URLSearchParams();
          if (searchTerm) params.append('search', searchTerm);
          if (selectedCategories.length > 0) {
            selectedCategories.forEach((cat) => params.append('categories', cat));
          }
          if (selectedTags.length > 0) {
            selectedTags.forEach((tag) => params.append('tags', tag));
          }
          const qs = params.toString();
          query = qs ? `?${qs}` : '';
        } else {
          endpoint = '/knowledge-graph/personalized';
        }

        const response = await fetch(`${getApiBase()}${endpoint}${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to load graph');
        }

        if (mode === 'personalized') {
          const data = result.data;
          setGraph(data.graph);
          setProfileSummary({
            experienceLevel: data.profile.experienceLevel,
            focusCategories: data.profile.focusCategories,
            focusTags: data.profile.focusTags,
            preferredLanguages: data.profile.preferredLanguages,
            totalAccepted: data.profile.totalAccepted,
          });
          setChallengeRecs(data.recommendations.challenges || []);
          setTrainingRecs(data.recommendations.trainingData || []);
          setLearningPath(data.learningPath || []);
        } else {
          setGraph(result.data);
          setProfileSummary(null);
          setChallengeRecs([]);
          setTrainingRecs([]);
          setLearningPath([]);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading graph');
        console.error('Fetch graph error:', err);
      } finally {
        setLoading(false);
      }
    },
    [viewMode, searchTerm, selectedCategories, selectedTags]
  );

  useEffect(() => {
    fetchGraph(viewMode);
  }, [fetchGraph, viewMode]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNode(node);
  }, []);

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

  const categories = Array.from(
    new Set(graph.nodes.filter((n) => n.type === 'category').map((n) => n.data.category))
  ).filter(cat => cat);
  const tags = Array.from(
    new Set(graph.nodes.filter((n) => n.type === 'tag').map((n) => n.data.tag))
  ).filter(tag => tag);

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
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button
              variant={viewMode === 'global' ? 'default' : 'outline'}
              onClick={() => setViewMode('global')}
            >
              🌐 {language === 'vi' ? 'Toàn bộ graph' : 'Global graph'}
            </Button>
            <Button
              variant={viewMode === 'personalized' ? 'default' : 'outline'}
              onClick={() => setViewMode('personalized')}
            >
              🧠 {language === 'vi' ? 'Cá nhân hoá' : 'Personalized'}
            </Button>
            {viewMode === 'personalized' && (
              <p className="text-sm text-muted-foreground">
                {language === 'vi'
                  ? 'Graph được highlight theo hồ sơ học tập của bạn'
                  : 'Graph is highlighted based on your learning profile'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={viewMode === 'personalized'}
                />
              </div>
            </div>

            <Select
              value={selectedCategories[0] || ''}
              onValueChange={(value) => {
                if (value && value !== 'all') {
                  setSelectedCategories([value]);
                } else {
                  setSelectedCategories([]);
                }
              }}
              disabled={viewMode === 'personalized'}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'vi' ? 'Chọn category' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900" style={{ height: '600px' }}>
            <ForceGraph2D
              ref={fgRef}
              graphData={graph}
              width={800}
              height={600}
              nodeLabel={(node: GraphNode) => {
                if (node.type === 'training_data') {
                  return `${node.label}\\n\\n${node.data.question}`;
                }
                return node.label;
              }}
              nodeColor={(node: GraphNode) => {
                if (viewMode === 'personalized') {
                  if (node.isRecommended) return '#F97316';
                  if (node.isFocusCategory) return '#6366F1';
                  if (node.isFocusTag) return '#0EA5E9';
                }
                return node.color || '#6B7280';
              }}
              nodeVal={(node: GraphNode) => {
                if (viewMode === 'personalized' && (node.isRecommended || node.isFocusCategory)) {
                  return (node.size || 10) + 4;
                }
                return node.size || 10;
              }}
              linkColor={() => 'rgba(0, 0, 0, 0.2)'}
              linkWidth={(link: GraphLink) => (link.type === 'similar' ? 2 : 1)}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              cooldownTicks={100}
              onEngineStop={() => fgRef.current?.zoomToFit(400)}
            />
          </div>

          {selectedNode && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedNode.type === 'training_data'
                      ? language === 'vi'
                        ? 'Chi tiết Training Data'
                        : 'Training Data Details'
                      : selectedNode.label}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
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
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
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

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {viewMode === 'personalized' && profileSummary && (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'vi' ? 'Hồ sơ học tập' : 'Learning profile'}</CardTitle>
                  <CardDescription>
                    {language === 'vi'
                      ? 'Thông tin tóm tắt dựa trên submissions của bạn'
                      : 'Summary based on your submissions'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{language === 'vi' ? 'Cấp độ:' : 'Level:'}</strong> {profileSummary.experienceLevel}
                    </p>
                    <p>
                      <strong>{language === 'vi' ? 'Ngôn ngữ:' : 'Languages:'}</strong>{' '}
                      {profileSummary.preferredLanguages.join(', ')}
                    </p>
                    <p>
                      <strong>{language === 'vi' ? 'Tổng chấp nhận:' : 'Total Accepted:'}</strong> {profileSummary.totalAccepted}
                    </p>
                    <div>
                      <strong>{language === 'vi' ? 'Chủ đề chính:' : 'Focus Categories:'}</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileSummary.focusCategories.map((cat) => (
                          <Badge key={cat}>{cat}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>{language === 'vi' ? 'Tags chính:' : 'Focus Tags:'}</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileSummary.focusTags.map((tag) => (
                          <Badge variant="secondary" key={tag}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === 'vi' ? 'Gợi ý Thử thách' : 'Challenge Recommendations'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {challengeRecs.length > 0 ? (
                    <ul className="space-y-2">
                      {challengeRecs.slice(0, 5).map((rec) => (
                        <li key={rec.id} className="text-sm p-2 border rounded bg-background">
                          <strong>{rec.data.title}</strong> ({rec.data.difficulty})
                          <p className="text-xs text-muted-foreground">{rec.reasons.join(', ')}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Không có gợi ý nào.' : 'No recommendations available.'}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === 'vi' ? 'Lộ trình học tập' : 'Learning Path'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {learningPath.length > 0 ? (
                    <ol className="space-y-2 list-decimal list-inside">
                      {learningPath.slice(0, 5).map((step) => (
                        <li key={step.step} className="text-sm">
                          <strong>{step.title}</strong>: {step.description}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Không có lộ trình học tập.' : 'No learning path available.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeGraphCanvas;
