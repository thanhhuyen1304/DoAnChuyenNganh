import axios from 'axios';
import { ExtractedKeywords, keywordExtractionService } from './keywordExtractionService';

type ContentType = 'article' | 'video' | 'doc' | 'tutorial';
type DurationFilter = 'short' | 'medium' | 'long';

export interface ExternalResource {
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  type: ContentType;
  language?: string;
  durationSeconds?: number;
  source: 'google' | 'youtube';
  qualityScore: number;
  publishedAt?: string;
  channelTitle?: string;
}

interface SuggestFilters {
  query?: string;
  context?: string;
  language?: string;
  difficulty?: string;
  types?: ContentType[];
  duration?: DurationFilter;
  limit?: number;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private defaultTtlMs: number) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs?: number) {
    const ttl = ttlMs || this.defaultTtlMs;
    this.store.set(key, { data, expiresAt: Date.now() + ttl });
  }
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || '';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const DEFAULT_TTL = Number(process.env.EXTERNAL_RESOURCE_CACHE_TTL || 900) * 1000;
const DEFAULT_LIMIT = Number(process.env.EXTERNAL_RESOURCE_LIMIT || 8);

class ExternalKnowledgeService {
  private cache = new InMemoryCache<ExternalResource[]>(DEFAULT_TTL);

  private buildSearchQuery(keywords: ExtractedKeywords, language?: string, custom?: string): string {
    if (custom && custom.trim().length > 3) return custom.trim();
    const parts = [
      ...keywords.rawKeywords.slice(0, 4),
      ...keywords.concepts.slice(0, 3),
      ...keywords.topics.slice(0, 3),
      ...keywords.errorTypes.slice(0, 2),
      language || keywords.languages[0],
    ].filter(Boolean);

    return Array.from(new Set(parts)).join(' ').trim();
  }

  private isoDurationToSeconds(duration: string): number {
    // Basic ISO 8601 duration parser for PT#H#M#S
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const [, h, m, s] = match;
    return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
  }

  private fitsDurationFilter(seconds: number | undefined, filter?: DurationFilter) {
    if (!seconds || !filter) return true;
    if (filter === 'short') return seconds <= 8 * 60;
    if (filter === 'medium') return seconds > 8 * 60 && seconds <= 25 * 60;
    return seconds > 25 * 60;
  }

  private computeScore(item: ExternalResource, filters: SuggestFilters) {
    let score = item.qualityScore || 1;

    if (filters.language && item.language && filters.language.toLowerCase() === item.language.toLowerCase()) {
      score += 2.5;
    }
    if (filters.types && filters.types.includes(item.type)) {
      score += 2;
    }
    if (filters.duration && this.fitsDurationFilter(item.durationSeconds, filters.duration)) {
      score += 1.5;
    }
    // Bonus for newer content
    if (item.publishedAt) {
      const ageDays = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 180) score += 1.2;
    }
    return score;
  }

  private async searchGoogle(query: string, filters: SuggestFilters): Promise<ExternalResource[]> {
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) return [];

    const cacheKey = `google:${query}:${(filters.language || '').toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const params: any = {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        num: Math.min(filters.limit || DEFAULT_LIMIT, 10),
        lr: filters.language ? `lang_${filters.language}` : undefined,
        safe: 'active',
      };

      const res = await axios.get('https://www.googleapis.com/customsearch/v1', { params, timeout: 5000 });
      const items = (res.data.items || []).map((item: any) => {
        const mimeType = (item.mime || '').toLowerCase();
        const type: ContentType =
          mimeType.includes('pdf') || mimeType.includes('doc') ? 'doc' : 'article';

        return {
          title: item.title,
          url: item.link,
          description: item.snippet,
          thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src,
          type,
          language: filters.language,
          source: 'google' as const,
          qualityScore: item.cacheId ? 3 : 1.5,
        };
      }) as ExternalResource[];

      this.cache.set(cacheKey, items);
      return items;
    } catch (error) {
      console.error('[ExternalKnowledgeService] Google search failed', error);
      return [];
    }
  }

  private async searchYouTube(query: string, filters: SuggestFilters): Promise<ExternalResource[]> {
    if (!YOUTUBE_API_KEY) return [];

    const cacheKey = `yt:${query}:${filters.duration || 'any'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: YOUTUBE_API_KEY,
          part: 'snippet',
          type: 'video',
          maxResults: Math.min(filters.limit || DEFAULT_LIMIT, 8),
          q: query,
          relevanceLanguage: filters.language,
          topicId: '/m/04rlf', // Education topic
          safeSearch: 'strict',
        },
        timeout: 5000,
      });

      const videoIds = (searchRes.data.items || []).map((item: any) => item.id.videoId).filter(Boolean);
      if (videoIds.length === 0) return [];

      const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          key: YOUTUBE_API_KEY,
          part: 'contentDetails,statistics,snippet',
          id: videoIds.join(','),
        },
        timeout: 5000,
      });

      const items = (statsRes.data.items || []).map((item: any) => {
        const durationSeconds = this.isoDurationToSeconds(item.contentDetails?.duration || '');
        const viewCount = Number(item.statistics?.viewCount || 0);
        const likeCount = Number(item.statistics?.likeCount || 0);
        const qualityScore = Math.log10(viewCount + 1) + Math.log(likeCount + 1);

        const resource: ExternalResource = {
          title: item.snippet?.title,
          url: `https://www.youtube.com/watch?v=${item.id}`,
          description: item.snippet?.description,
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
          type: 'video',
          language: filters.language || item.snippet?.defaultAudioLanguage,
          source: 'youtube',
          durationSeconds,
          qualityScore,
          publishedAt: item.snippet?.publishedAt,
          channelTitle: item.snippet?.channelTitle,
        };

        return resource;
      }) as ExternalResource[];

      this.cache.set(cacheKey, items);
      return items;
    } catch (error) {
      console.error('[ExternalKnowledgeService] YouTube search failed', error);
      return [];
    }
  }

  async suggest(filters: SuggestFilters): Promise<ExternalResource[]> {
    const limit = filters.limit || DEFAULT_LIMIT;
    const keywords = keywordExtractionService.extractKeywords(filters.context || filters.query || '');
    const query = this.buildSearchQuery(keywords, filters.language, filters.query);

    const cacheKey = `mix:${query}:${JSON.stringify({
      lang: filters.language,
      diff: filters.difficulty,
      types: filters.types,
      duration: filters.duration,
      limit,
    })}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const [googleItems, youtubeItems] = await Promise.all([
      this.searchGoogle(query, { ...filters, limit }),
      this.searchYouTube(query, { ...filters, limit }),
    ]);

    const merged = [...googleItems, ...youtubeItems]
      .filter((item) => {
        const typeOk = !filters.types || filters.types.includes(item.type);
        const durationOk = this.fitsDurationFilter(item.durationSeconds, filters.duration);
        return typeOk && durationOk;
      })
      .map((item) => ({
        ...item,
        qualityScore: this.computeScore(item, filters),
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, limit);

    this.cache.set(cacheKey, merged);
    return merged;
  }
}

export const externalKnowledgeService = new ExternalKnowledgeService();


