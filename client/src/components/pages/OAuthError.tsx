import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Bug } from 'lucide-react';

const OAuthError = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const message = searchParams.get('message') || 'Đã xảy ra lỗi khi đăng nhập';

    useEffect(() => {
        // Auto redirect after 5 seconds
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 rounded-lg blur opacity-25"></div>
                                <div className="relative flex items-center bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg shadow-lg">
                                    <Bug size={32} />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Đăng nhập thất bại
                        </h2>
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-white"
                        >
                            Quay lại trang đăng nhập
                        </Button>
                        <p className="text-xs text-gray-500 mt-4">
                            Tự động chuyển hướng sau 5 giây...
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OAuthError;

