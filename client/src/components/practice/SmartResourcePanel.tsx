import React, { useEffect, useMemo, useState } from 'react';
import { ExternalResource, fetchExternalResources, sendResourceFeedback } from '@/services/knowledgeResourceApi';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Globe2, Loader2, RefreshCw, Search, Star, ThumbsDown, ThumbsUp, Video, BookOpen, Clock3 } from 'lucide-react';

interface SmartResourcePanelProps {
  contextText?: string;
  language?: string;
  difficulty?: string;
}

const TYPE_OPTIONS = [
  { value: 'article', label: 'Bài viết' },
  { value: 'video', label: 'Video' },
  { value: 'doc', label: 'Tài liệu' },
  { value: 'tutorial', label: 'Tutorial' },
] as const;

export const SmartResourcePanel: React.FC<SmartResourcePanelProps> = ({ contextText = '', language, difficulty }) => {
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['article', 'video']);
  const [duration, setDuration] = useState<'short' | 'medium' | 'long' | undefined>(undefined);
  const [langFilter, setLangFilter] = useState<string | undefined>(language);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const token = useMemo(() => localStorage.getItem('token') || undefined, []);

  const loadResources = async () => {
    if (!contextText || contextText.trim().length < 10) {
      setResources([]);
      setError('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetchExternalResources(
        {
          context: contextText,
          language: langFilter,
          difficulty,
          types: selectedTypes,
          duration,
          limit: 8,
        },
        token
      );
      setResources(response.data || []);
      setWarnings(response.warnings || []);
      setLastFetchedAt(new Date());
    } catch (err: any) {
      setError(err.message || 'Không thể tải đề xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextText, langFilter, difficulty, duration, selectedTypes.join(',')]);

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const renderTypeIcon = (type: string) => {
    if (type === 'video') return <Video className="w-4 h-4" />;
    if (type === 'doc' || type === 'tutorial') return <BookOpen className="w-4 h-4" />;
    return <Globe2 className="w-4 h-4" />;
  };

  const handleFeedback = async (item: ExternalResource, rating: 'up' | 'down') => {
    try {
      await sendResourceFeedback(
        {
          url: item.url,
          title: item.title,
          rating,
          source: item.source,
          language: item.language,
        },
        token
      );
    } catch (err) {
      console.error('Feedback error', err);
    }
  };

  return (
    <Card className="border border-dashed border-primary/30 bg-white/80 dark:bg-gray-900/70 shadow-lg">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-primary-500" />
            Liên kết kiến thức thông minh
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={loadResources} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <Badge
              key={opt.value}
              variant={selectedTypes.includes(opt.value) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleType(opt.value)}
            >
              {renderTypeIcon(opt.value)} <span className="ml-1">{opt.label}</span>
            </Badge>
          ))}
          <Separator orientation="vertical" className="h-5" />
          <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Thời lượng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Ngắn (&lt;8')</SelectItem>
              <SelectItem value="medium">Vừa (8-25')</SelectItem>
              <SelectItem value="long">Dài (&gt;25')</SelectItem>
            </SelectContent>
          </Select>
          {/* Use a non-empty sentinel for the "default" option because
              Radix Select treats an empty string as the clear value and
              disallows passing an empty string to <Select.Item />. Map
              the sentinel back to `undefined` when updating state. */}
          <Select
            value={langFilter ?? '__default'}
            onValueChange={(v) => setLangFilter(v === '__default' ? undefined : v)}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder={language || 'Ngôn ngữ'} />
            </SelectTrigger>
            <SelectContent>
              {/* sentinel value for the default/clear option */}
              <SelectItem value="__default">Mặc định</SelectItem>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {warnings.length > 0 && (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            {warnings.map((w) => (
              <div key={w}>• {w}</div>
            ))}
          </div>
        )}
        {lastFetchedAt && (
          <p className="text-[11px] text-muted-foreground">
            Cập nhật: {lastFetchedAt.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang lấy đề xuất...
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có gợi ý. Hãy mở một thử thách hoặc nhập nhiều ngữ cảnh hơn.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {resources.map((item) => (
              <div key={item.url} className="border rounded-lg p-3 bg-white/70 dark:bg-gray-800/60 hover:shadow-sm transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {renderTypeIcon(item.type)}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm hover:underline line-clamp-2"
                    >
                      {item.title}
                    </a>
                  </div>
                  <Badge variant="secondary" className="text-[11px] capitalize">
                    {item.source}
                  </Badge>
                </div>
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="mt-2 rounded-md w-full h-28 object-cover"
                    loading="lazy"
                  />
                )}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{item.description}</p>
                )}
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  {item.language && (
                    <Badge variant="outline" className="text-[10px]">
                      <Globe2 className="w-3 h-3 mr-1" /> {item.language}
                    </Badge>
                  )}
                  {item.durationSeconds ? (
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                      <Clock3 className="w-3 h-3" />
                      {Math.round(item.durationSeconds / 60)} phút
                    </Badge>
                  ) : null}
                  {item.channelTitle && (
                    <Badge variant="secondary" className="text-[10px]">
                      {item.channelTitle}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-muted-foreground">
                      Điểm chất lượng: {item.qualityScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleFeedback(item, 'up')}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleFeedback(item, 'down')}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartResourcePanel;


