import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../contexts/LanguageContext';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại');
            }

            if (data.success) {
                // Lưu token vào localStorage
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // Redirect based on user role
                if (data.data.user.role === 'admin') {
                    window.location.href = '/admin/dashboard';
                } else {
                    window.location.href = '/dashboard';
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Nhập email của bạn"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Nhập mật khẩu của bạn"
                />
            </div>
            
            <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow"
                disabled={isLoading}
            >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{' '}
                <a href="/register" className="text-primary hover:underline">
                    Đăng ký ngay
                </a>
            </div>
        </form>
    );
};

export default Login;