import { buildApi } from '@/lib/apiBase';

export interface ExternalResource {
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  type: 'article' | 'video' | 'doc' | 'tutorial';
  language?: string;
  durationSeconds?: number;
  source: 'google' | 'youtube';
  qualityScore: number;
  publishedAt?: string;
  channelTitle?: string;
}

export interface SuggestParams {
  query?: string;
  context?: string;
  language?: string;
  difficulty?: string;
  types?: string[];
  duration?: 'short' | 'medium' | 'long';
  limit?: number;
}

export async function fetchExternalResources(params: SuggestParams, token?: string) {
  const url = new URL(buildApi('/external-resources/suggest'));
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      url.searchParams.append(key, value.join(','));
    } else {
      url.searchParams.append(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Không thể tải tài nguyên bên ngoài');
  }

  return data as { success: boolean; data: ExternalResource[]; warnings?: string[] };
}

export async function sendResourceFeedback(input: {
  url: string;
  title?: string;
  rating: 'up' | 'down';
  comment?: string;
  source?: string;
  language?: string;
}, token?: string) {
  const res = await fetch(buildApi('/external-resources/feedback'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Không thể gửi phản hồi');
  }
  return data;
}


