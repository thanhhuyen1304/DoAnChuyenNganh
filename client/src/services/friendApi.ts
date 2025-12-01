import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api/friends',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Friend {
  friendshipId: string;
  userId: string;
  username: string;
  avatar?: string;
  experience: number;
  pvpStats?: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
  };
  friendshipLevel: number;
  lastInteraction: string;
}

export interface FriendRequest {
  requestId: string;
  from: {
    userId: string;
    username: string;
    avatar?: string;
    experience: number;
  };
  requestedAt: string;
}

export interface OnlineUser {
  userId: string;
  username: string;
  avatar?: string;
  experience: number;
  pvpStats?: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
  };
}

class FriendApi {
  // Send friend request
  async sendFriendRequest(recipientId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/requests', { recipientId });
    return response.data;
  }

  // Accept friend request
  async acceptFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/requests/${requestId}/accept`);
    return response.data;
  }

  // Decline friend request
  async declineFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/requests/${requestId}/decline`);
    return response.data;
  }

  // Get pending friend requests
  async getPendingRequests(): Promise<{ success: boolean; data: FriendRequest[] }> {
    const response = await api.get('/requests/pending');
    return response.data;
  }

  // Get friends list
  async getFriendsList(): Promise<{ success: boolean; data: Friend[] }> {
    const response = await api.get('/list');
    return response.data;
  }

  // Remove friend
  async removeFriend(friendId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/${friendId}`);
    return response.data;
  }

  // Get online users (strangers)
  async getOnlineUsers(): Promise<{ success: boolean; data: OnlineUser[] }> {
    const response = await api.get('/online');
    return response.data;
  }
}

export default new FriendApi();