import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

const API_BASE_URL = 'http://localhost:5000/api';

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

      const response = await fetch(`${API_BASE_URL}/scraper/cses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`Thành công: ${data.message}`);
      } else {
        setError(`Lỗi: ${data.message}`);
      }
    } catch (err) {
      setError(`Lỗi: ${err}`);
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
