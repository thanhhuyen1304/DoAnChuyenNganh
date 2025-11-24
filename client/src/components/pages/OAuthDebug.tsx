import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

const OAuthDebug = () => {
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState<string | null>(null);

    const testOAuthFlow = async (provider: string) => {
        setLoading(provider);
        try {
            const url = `${API_BASE_URL}/auth/${provider}`;
            setTestResults(prev => ({
                ...prev,
                [provider]: {
                    status: 'testing',
                    message: `Redirecting to ${url}...`,
                    url
                }
            }));

            // Try to redirect
            window.location.href = url;
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [provider]: {
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    error
                }
            }));
        } finally {
            setLoading(null);
        }
    };

    const testBackendConnection = async () => {
        setLoading('backend');
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'GET',
            });
            
            const data = await response.json();
            
            setTestResults(prev => ({
                ...prev,
                backend: {
                    status: response.ok ? 'success' : 'error',
                    message: response.ok ? 'Backend is running!' : data.message || 'Backend error',
                    statusCode: response.status,
                    data
                }
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                backend: {
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Cannot connect to backend',
                    error
                }
            }));
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>OAuth Debug Tool</CardTitle>
                        <CardDescription>
                            Test OAuth integration và kiểm tra backend connection
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <AlertDescription>
                                API Base URL: <code className="text-sm">{API_BASE_URL}</code>
                            </AlertDescription>
                        </Alert>

                        {/* Backend Test */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Backend Connection Test</h3>
                                <Button 
                                    onClick={testBackendConnection}
                                    disabled={loading === 'backend'}
                                    size="sm"
                                >
                                    {loading === 'backend' ? 'Testing...' : 'Test Connection'}
                                </Button>
                            </div>
                            {testResults.backend && (
                                <Alert variant={testResults.backend.status === 'success' ? 'default' : 'destructive'}>
                                    <AlertDescription>
                                        {testResults.backend.message}
                                        {testResults.backend.statusCode && (
                                            <Badge className="ml-2">{testResults.backend.statusCode}</Badge>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* OAuth Tests */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">OAuth Provider Tests</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {['google', 'github', 'facebook'].map(provider => (
                                    <Card key={provider} className="border">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium capitalize">{provider}</span>
                                                <Badge variant="outline">
                                                    {testResults[provider]?.status || 'not-tested'}
                                                </Badge>
                                            </div>
                                            <Button
                                                onClick={() => testOAuthFlow(provider)}
                                                disabled={loading === provider}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                {loading === provider ? 'Testing...' : `Test ${provider}`}
                                            </Button>
                                            {testResults[provider] && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {testResults[provider].message}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Test Results Summary */}
                        {Object.keys(testResults).length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">Test Results</h3>
                                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto">
                                    {JSON.stringify(testResults, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Click "Test Connection" để check backend có chạy không</li>
                            <li>Nếu backend OK, click "Test google" để test OAuth flow</li>
                            <li>Kiểm tra browser console (F12) để xem logs</li>
                            <li>Nếu có error, check lại:
                                <ul className="list-disc list-inside ml-4 mt-1">
                                    <li>Backend đang chạy ở port 5000?</li>
                                    <li>OAuth credentials đã đúng trong .env?</li>
                                    <li>Callback URL đã được add vào OAuth app settings?</li>
                                </ul>
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OAuthDebug;

