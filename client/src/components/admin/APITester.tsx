import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

const APITester = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPI = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 Testing API from frontend...');

      // Step 1: Login
      console.log('1. Logging in...');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@bughunter.com',
          password: 'admin123'
        })
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (!loginData.success) {
        throw new Error(`Login failed: ${loginData.message}`);
      }

      const token = loginData.data.token;
      console.log('Token:', token.substring(0, 30) + '...');

      // Step 2: Get challenges
      console.log('2. Getting challenges...');
      const challengesResponse = await fetch(`${API_BASE_URL}/challenges/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const challengesData = await challengesResponse.json();
      console.log('Challenges response:', challengesData);

      if (challengesData.success) {
        setResult({
          success: true,
          totalChallenges: challengesData.data.challenges.length,
          challenges: challengesData.data.challenges
        });
      } else {
        throw new Error(`Failed to get challenges: ${challengesData.message}`);
      }

    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testWithStoredToken = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 Testing with stored token...');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found in localStorage');
      }

      console.log('Stored token:', token.substring(0, 30) + '...');

      const challengesResponse = await fetch(`${API_BASE_URL}/challenges/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const challengesData = await challengesResponse.json();
      console.log('Challenges response:', challengesData);

      if (challengesData.success) {
        setResult({
          success: true,
          totalChallenges: challengesData.data.challenges.length,
          challenges: challengesData.data.challenges
        });
      } else {
        throw new Error(`Failed to get challenges: ${challengesData.message}`);
      }

    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🧪 API Tester</CardTitle>
          <CardDescription>
            Test API endpoints directly from frontend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={testAPI} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test with Fresh Login'}
            </Button>
            <Button 
              onClick={testWithStoredToken} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test with Stored Token'}
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
                <div>
                  <h3 className="font-semibold">✅ API Test Successful!</h3>
                  <p><strong>Total challenges:</strong> {result.totalChallenges}</p>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Challenges:</h4>
                    <div className="max-h-60 overflow-y-auto">
                      {result.challenges.slice(0, 10).map((challenge: any, index: number) => (
                        <div key={challenge._id} className="text-sm border-b pb-1 mb-1">
                          <strong>{index + 1}. {challenge.title}</strong>
                          <br />
                          <span className="text-gray-600">
                            {challenge.language} - {challenge.difficulty} - Active: {challenge.isActive ? 'Yes' : 'No'}
                          </span>
                        </div>
                      ))}
                      {result.challenges.length > 10 && (
                        <p className="text-sm text-gray-500">... and {result.challenges.length - 10} more</p>
                      )}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default APITester;
