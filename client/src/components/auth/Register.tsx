import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../contexts/LanguageContext';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLanguage();

    const { username, email, password } = formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validation
            if (password.length < 6) {
                throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
            }

            if (username.length < 3) {
                throw new Error('Tên người dùng phải có ít nhất 3 ký tự');
            }
            
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            if (data.success) {
                // Lưu token vào localStorage
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
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
                <Label htmlFor="username">Tên người dùng</Label>
                <Input
                    type="text"
                    name="username"
                    value={username}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tên người dùng"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    required
                    placeholder="Nhập email của bạn"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    required
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                />
            </div>
            
            <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow"
                disabled={isLoading}
            >
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
                Đã có tài khoản?{' '}
                <a href="/login" className="text-primary hover:underline">
                    Đăng nhập
                </a>
            </div>
        </form>
    );
};

export default Register;