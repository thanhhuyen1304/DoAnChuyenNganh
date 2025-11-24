import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

const SimpleScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleScrape = async () => {
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      // Log trạng thái trước khi gửi request
      console.log('🔍 Starting scrape operation...');
      console.log('Token:', token.substring(0, 20) + '...');

      const response = await fetch(`${API_BASE_URL}/scraper/cses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Log response status
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        if (data.success) {
          const newCount = data.data?.count || 0;
          setResult(
            `✅ Thành công!\n` +
            `📝 ${data.message}\n` +
            `🆕 Đã thêm ${newCount} bài tập mới\n` +
            `📊 Tổng số bài tập: ${data.data?.total || 'N/A'}`
          );
          console.log('✅ Scrape operation completed successfully', data);
        } else {
          throw new Error(data.message || 'Lỗi không xác định từ server');
        }
      } else {
        throw new Error(data.message || `Lỗi HTTP: ${response.status}`);
      }
    } catch (err: any) {
      console.error('❌ Scrape operation failed:', err);
      setError(
        err.message || 
        (err.response?.data?.message) || 
        'Có lỗi xảy ra khi scrape dữ liệu'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Simple Scraper Test</h2>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <AlertDescription>{result}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Scraper</CardTitle>
          <CardDescription>Test scraper với CSES</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleScrape} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Đang scrape...' : 'Scrape CSES'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleScraper;
