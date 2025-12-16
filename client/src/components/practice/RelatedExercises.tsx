import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Link2, RefreshCw, Sparkles, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { buildApi } from '@/lib/api';

interface RecommendationResponse {
  experienceLevel: string;
  errorSummary: {
    errorTypes: Record<string, number>;
    totalErrors: number;
  };
  challenges: any[];
  trainingData: any[];
  learningResources: any[];
  knowledgeGaps: string[];
}

interface Props {
  challengeId?: string | null;
  onNavigateChallenge?: (id: string) => void;
}

const RelatedExercises: React.FC<Props> = ({ challengeId, onNavigateChallenge }) => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResponse | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!challengeId) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(buildApi(`/recommendations/related?challengeId=${challengeId}`), {
        headers,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load recommendations');
      }
      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Cannot load recommendations');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // refresh after submission
  useEffect(() => {
    const handler = () => fetchRecommendations();
    window.addEventListener('submissionCompleted', handler);
    return () => window.removeEventListener('submissionCompleted', handler);
  }, [fetchRecommendations]);

  if (!challengeId) return null;

  return (
    <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/80 shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <CardTitle className="text-lg">
            {language === 'vi' ? 'Bài tập liên quan' : 'Related exercises'}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchRecommendations}
          title={language === 'vi' ? 'Làm mới' : 'Refresh'}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {language === 'vi' ? 'Đang tải gợi ý...' : 'Loading recommendations...'}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : data ? (
          <div className="space-y-4">
            {/* Challenges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Target className="w-4 h-4 text-primary-500" />
                {language === 'vi' ? 'Bài tập nên thử' : 'Challenges to try'}
              </div>
              {data.challenges.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {language === 'vi' ? 'Chưa có gợi ý phù hợp' : 'No relevant suggestions yet'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {data.challenges.map((ch) => (
                    <div
                      key={ch._id}
                      className="p-3 border rounded-lg bg-gray-50/80 dark:bg-gray-800/70 hover:border-primary-300 cursor-pointer transition-colors"
                      onClick={() => onNavigateChallenge?.(ch._id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                          {ch.title}
                        </p>
                        <Badge variant="outline" className="text-[11px]">
                          {ch.difficulty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ch.tags?.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                        {ch.language && (
                          <Badge variant="outline" className="text-[10px]">
                            {ch.language}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {language === 'vi'
              ? 'Chọn một bài tập để xem gợi ý liên quan'
              : 'Select a challenge to see related practice'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RelatedExercises;
