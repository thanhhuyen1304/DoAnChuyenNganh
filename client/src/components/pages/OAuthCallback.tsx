import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Bug } from 'lucide-react';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');

        if (!token || !userStr) {
            setError('Thiếu thông tin xác thực');
            setLoading(false);
            setTimeout(() => navigate('/login'), 3000);
            return;
        }

        try {
            // Parse user data from URL
            const userData = JSON.parse(decodeURIComponent(userStr));

            // Store token and user data in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirect based on role
            if (userData.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Error processing OAuth callback:', err);
            setError('Lỗi xử lý thông tin đăng nhập');
            setLoading(false);
            setTimeout(() => navigate('/login'), 3000);
        }
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6">
                        <div className="text-center mb-4">
                            <div className="flex justify-center mb-4">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 rounded-lg blur opacity-25"></div>
                                    <div className="relative flex items-center bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg">
                                        <Bug size={32} />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Đăng nhập thất bại
                            </h2>
                            <Alert variant="destructive" className="mt-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#FF007A] to-[#A259FF] rounded-lg blur opacity-25 animate-pulse"></div>
                                <div className="relative flex items-center bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white p-3 rounded-lg shadow-lg">
                                    <Bug size={32} className="animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF007A] to-[#A259FF] bg-clip-text text-transparent mb-2">
                            Đang đăng nhập...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Vui lòng đợi trong giây lát
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OAuthCallback;

