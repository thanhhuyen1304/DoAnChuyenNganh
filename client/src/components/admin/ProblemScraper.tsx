import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Download, Database, Globe } from 'lucide-react';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

interface ScrapeResult {
  success: boolean;
  message: string;
  data: {
    total?: number;
    cses?: number;
    atcoder?: number;
    leetcode?: number;
    count?: number;
  };
}

const ProblemScraper = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string>('');

  const refreshToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@bughunter.com',
          password: 'admin123'
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setError('');
        setResult({
          success: true,
          message: '✅ Đã refresh token thành công!',
          data: {}
        });
      } else {
        setError(`❌ Lỗi refresh token: ${data.message}`);
      }
    } catch (error) {
      setError(`❌ Lỗi kết nối: ${error}`);
    }
  };

  const handleScrape = async (source: string) => {
    setIsLoading(source);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      console.log('🔑 Token:', token.substring(0, 20) + '...');
      console.log('🌐 URL:', `${API_BASE_URL}/scraper/${source}`);

      const response = await fetch(`${API_BASE_URL}/scraper/${source}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.');
        } else if (response.status === 403) {
          throw new Error('Không có quyền admin. Vui lòng đăng nhập với tài khoản admin.');
        } else {
          throw new Error(data.message || `Lỗi ${response.status}: ${response.statusText}`);
        }
      }

      setResult(data);
    } catch (err) {
      console.error('❌ Scrape error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsLoading(null);
    }
  };

  const scrapeSources = [
    {
      id: 'cses',
      name: 'CSES Problem Set',
      description: 'Scrape từ CSES.fi - bộ bài tập thuật toán chất lượng cao',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'atcoder',
      name: 'AtCoder',
      description: 'Scrape từ AtCoder - nền tảng competitive programming',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'leetcode',
      name: 'LeetCode',
      description: 'Scrape từ LeetCode - bài tập phỏng vấn và thuật toán',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'all',
      name: 'Tất cả nguồn',
      description: 'Scrape từ tất cả các nguồn có sẵn',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Problem Scraper
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tự động lấy bài tập từ các nguồn online và thêm vào hệ thống
          </p>
        </div>
        <Button 
          onClick={refreshToken} 
          variant="outline" 
          size="sm"
          className="ml-4"
        >
          🔄 Refresh Token
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <AlertDescription>
            <strong>Thành công!</strong> {result.message}
            {result.data.total && (
              <div className="mt-2 text-sm">
                <p>Tổng: {result.data.total} bài</p>
                {result.data.cses && <p>CSES: {result.data.cses} bài</p>}
                {result.data.atcoder && <p>AtCoder: {result.data.atcoder} bài</p>}
                {result.data.leetcode && <p>LeetCode: {result.data.leetcode} bài</p>}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scrapeSources.map((source) => (
          <Card key={source.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {source.icon}
                {source.name}
              </CardTitle>
              <CardDescription>
                {source.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleScrape(source.id)}
                disabled={isLoading !== null}
                className={`w-full ${source.color} text-white`}
              >
                {isLoading === source.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang scrape...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Scrape {source.name}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ Lưu ý quan trọng:
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Scraping có thể mất vài phút tùy thuộc vào số lượng bài tập</li>
          <li>• Một số trang web có thể chặn requests quá nhiều</li>
          <li>• Chỉ scrape khi cần thiết để tránh làm quá tải server</li>
          <li>• Test cases sẽ được tạo tự động dựa trên mẫu</li>
        </ul>
      </div>
    </div>
  );
};

export default ProblemScraper;