import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

const TokenDebugger = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const testToken = async () => {
    if (!token) {
      setTestResult('❌ Không có token');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(`✅ Token hợp lệ! User: ${data.data?.username || 'Unknown'}`);
      } else {
        setTestResult(`❌ Token không hợp lệ: ${data.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Lỗi kết nối: ${error}`);
    }
  };

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
        setToken(data.data.token);
        setUser(data.data.user);
        setTestResult('✅ Đã refresh token thành công!');
      } else {
        setTestResult(`❌ Lỗi refresh token: ${data.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Lỗi kết nối: ${error}`);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTestResult('🗑️ Đã xóa token');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Token Debugger</CardTitle>
          <CardDescription>
            Kiểm tra và debug token authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Token Status:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Token:</span>
                  <Badge variant={token ? "default" : "destructive"}>
                    {token ? "Có" : "Không có"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>User:</span>
                  <Badge variant={user ? "default" : "destructive"}>
                    {user ? user.username : "Không có"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Role:</span>
                  <Badge variant={user?.role === 'admin' ? "default" : "secondary"}>
                    {user?.role || "Unknown"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Token Preview:</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono break-all">
                {token ? `${token.substring(0, 50)}...` : 'Không có token'}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testToken} variant="outline">
              Test Token
            </Button>
            <Button onClick={refreshToken} variant="default">
              Refresh Token
            </Button>
            <Button onClick={clearToken} variant="destructive">
              Clear Token
            </Button>
          </div>

          {testResult && (
            <Alert>
              <AlertDescription>{testResult}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDebugger;
