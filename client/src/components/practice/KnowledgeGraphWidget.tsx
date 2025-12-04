import React, { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCircle, TrendingUp, BookOpen, X, Minimize2, Maximize2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase } from '@/lib/apiBase';

interface GraphNode {
  id: string;
  label: string;
  type: 'training_data' | 'challenge' | 'category' | 'tag' | 'concept' | 'error';
  data: any;
  size?: number;
  color?: string;
  isRecommended?: boolean;
  isErrorRelated?: boolean;
  errorCount?: number;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'category' | 'tag' | 'similar' | 'related' | 'error_related' | 'learning_path';
  strength?: number;
}

interface KnowledgeGraphWidgetProps {
  challengeId?: string | null;
  compact?: boolean;
}

const KnowledgeGraphWidget: React.FC<KnowledgeGraphWidgetProps> = ({ 
  challengeId,
  compact = true 
}) => {
  const { language } = useLanguage();
  const fgRef = useRef<any>();
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ 
    nodes: [], 
    links: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [errorSummary, setErrorSummary] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const queryParams = new URLSearchParams();
      if (challengeId) {
        queryParams.append('challengeId', challengeId);
      }

      const response = await fetch(
        `${getApiBase()}/knowledge-graph/error-based?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to load graph');
      }

      setGraph({
        nodes: result.data.nodes || [],
        links: result.data.links || [],
      });
      setErrorSummary(result.data.errorSummary || null);
      setRecommendations(result.data.recommendations || null);
    } catch (err: any) {
      setError(err.message || 'Error loading graph');
      console.error('Fetch graph error:', err);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Lắng nghe event submissionCompleted để tự động refresh graph
  useEffect(() => {
    const handleSubmissionCompleted = () => {
      fetchGraph();
    };

    window.addEventListener('submissionCompleted', handleSubmissionCompleted);
    return () => {
      window.removeEventListener('submissionCompleted', handleSubmissionCompleted);
    };
  }, [fetchGraph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    // Navigate hoặc hiển thị chi tiết
    if (node.type === 'challenge' && node.data._id) {
      // Có thể navigate đến challenge detail
      console.log('Navigate to challenge:', node.data._id);
    }
  }, []);

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 z-50 w-64 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {language === 'vi' ? 'Knowledge Graph' : 'Knowledge Graph'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {errorSummary && (
            <div className="text-xs text-muted-foreground">
              {language === 'vi' 
                ? `${Object.keys(errorSummary.errorTypes || {}).length} loại lỗi phát hiện`
                : `${Object.keys(errorSummary.errorTypes || {}).length} error types detected`}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const height = isExpanded ? 500 : compact ? 300 : 400;

  return (
    <Card className={`${compact ? 'fixed bottom-4 right-4 z-50 w-96 shadow-lg' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {language === 'vi' ? 'Lộ trình học tập' : 'Learning Path'}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'vi' 
                ? 'Đồ thị gợi ý dựa trên lỗi của bạn'
                : 'Graph suggestions based on your errors'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-xs text-muted-foreground">
                {language === 'vi' ? 'Đang tải...' : 'Loading...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Error Summary */}
            {errorSummary && errorSummary.errorTypes && Object.keys(errorSummary.errorTypes).length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                    {language === 'vi' ? 'Lỗi phát hiện:' : 'Errors detected:'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(errorSummary.errorTypes).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Graph Visualization */}
            <div 
              className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
              style={{ height: `${height}px` }}
            >
              <ForceGraph2D
                ref={fgRef}
                graphData={graph}
                width={compact ? 360 : 800}
                height={height}
                nodeLabel={(node: GraphNode) => {
                  if (node.type === 'error') {
                    return `${node.label}\n\nClick để xem chi tiết`;
                  }
                  if (node.type === 'training_data') {
                    return `${node.label}\n\n${node.data.question?.substring(0, 100)}...`;
                  }
                  return node.label;
                }}
                nodeColor={(node: GraphNode) => {
                  if (node.isErrorRelated) return '#EF4444';
                  if (node.isRecommended) return '#F97316';
                  if (node.type === 'error') return '#DC2626';
                  return node.color || '#6B7280';
                }}
                nodeVal={(node: GraphNode) => {
                  if (node.isRecommended || node.isErrorRelated) {
                    return (node.size || 10) + 3;
                  }
                  return node.size || 10;
                }}
                linkColor={(link: GraphLink) => {
                  if (link.type === 'error_related') return '#EF4444';
                  return 'rgba(0, 0, 0, 0.2)';
                }}
                linkWidth={(link: GraphLink) => {
                  if (link.type === 'error_related') return 2;
                  return 1;
                }}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                onEngineStop={() => fgRef.current?.zoomToFit(400)}
              />
            </div>

            {/* Recommendations */}
            {recommendations && (
              <div className="space-y-2">
                {recommendations.trainingData && recommendations.trainingData.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {language === 'vi' ? 'Tài liệu gợi ý:' : 'Recommended resources:'}
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {recommendations.trainingData.slice(0, 3).map((td: any) => (
                        <div
                          key={td._id}
                          className="text-xs p-2 bg-background border rounded cursor-pointer hover:bg-accent"
                          onClick={() => {
                            // Có thể mở modal hoặc navigate
                            console.log('Open training data:', td._id);
                          }}
                        >
                          <p className="font-medium truncate">{td.question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.challenges && recommendations.challenges.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">
                      {language === 'vi' ? 'Bài tập gợi ý:' : 'Recommended challenges:'}
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {recommendations.challenges.slice(0, 2).map((ch: any) => (
                        <div
                          key={ch._id}
                          className="text-xs p-2 bg-background border rounded cursor-pointer hover:bg-accent"
                        >
                          <p className="font-medium truncate">{ch.title}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {ch.difficulty}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowledgeGraphWidget;