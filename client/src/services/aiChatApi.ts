import { buildApi } from '../lib/api';

const getToken = () => {
  return localStorage.getItem('token');
};

export const aiChatAPI = {
  sendMessage: async (message: string) => {
    const token = getToken();
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    const response = await fetch(buildApi('/ai-chat/message'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  getChatHistory: async (limit: number = 50) => {
    const token = getToken();
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    const response = await fetch(buildApi(`/ai-chat/history?limit=${limit}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  clearHistory: async () => {
    const token = getToken();
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    const response = await fetch(buildApi('/ai-chat/history'), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
};

export default aiChatAPI;

