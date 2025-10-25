import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../contexts/LanguageContext';
// Import các icon cần thiết, tương tự Register
import { Bug, Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';

// Sử dụng cùng ảnh nền như Register
const decoImg = new URL('../images/1.jpg', import.meta.url).href;

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Giữ lại state này
    const { t } = useLanguage();
    useTheme(); // Giữ lại nếu cần theme context

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t('login.error') || 'Đăng nhập thất bại');
            }

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                if (data.data.user.role === 'admin') {
                    window.location.href = '/admin/dashboard';
                } else {
                    window.location.href = '/dashboard';
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('login.error') || 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // === BẮT ĐẦU: Cấu trúc layout giống Register ===
        <div className="w-full min-h-screen fixed inset-0 flex items-center justify-center py-12 px-4 bg-white/10 overflow-hidden">
            <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
                <div
                    className="fixed inset-0 z-0 bg-cover bg-center opacity-40 dark:opacity-30 filter blur-sm"
                    style={{ backgroundImage: `url(${decoImg})` }}
                />
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm" />
            </div>

            {/* Sử dụng cùng style Card như Register */}
            <Card className="w-full max-w-md relative overflow-hidden bg-white/10 shadow-2xl border border-white/90 dark:bg-gray-900/20 dark:border-gray-800/50 z-10 backdrop-blur-lg p-1">
                <CardContent className="p-5 bg-white/5 dark:bg-black/20 rounded-lg">
                    {/* Back Button (giống Register) */}
                    <div className="absolute left-4 top-4">
                        <a
                            href="/"
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/100 dark:bg-gray-800/40 dark:hover:bg-white/90 transition-all duration-200 group"
                            aria-label="Go back"
                        >
                            <ArrowLeft
                                size={20}
                                className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-600 transition-colors"
                            />
                        </a>
                    </div>

                    {/* Logo and Title (giống Register) */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#FF007A] to-[#A259FF] rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                                <div className="relative flex items-center bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white p-3 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <Bug size={32} className="animate-pulse" />
                                </div>
                            </div>
                        </div>
                        {/* Thay đổi Title và Subtitle cho phù hợp với Login */}
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF007A] to-[#A259FF] bg-clip-text text-transparent">
                            {t('login.title')} {/* Sử dụng key 'login.title' */}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {t('login.subtitle')} {/* Sử dụng key 'login.subtitle' */}
                        </p>
                    </div>

                    {/* Form (sử dụng style giống Register) */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {error && (
                            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Email Input (style giống Register) */}
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('login.email')}
                            </Label>
                            <div className="relative">
                                {/* Sử dụng icon Mail */}
                                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500`} />
                                <Input
                                    type="email"
                                    id="email" // Đổi id thành 'email'
                                    name="email" // Thêm name attribute nếu cần
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder={t('login.email.placeholder')}
                                    className={`pl-9 text-sm bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 focus:ring-primary-500/50 focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                                />
                            </div>
                            {/* Không cần hiển thị lỗi email riêng ở đây nếu chỉ có lỗi chung */}
                        </div>

                        {/* Password Input (style giống Register) */}
                        <div className="space-y-1">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('login.password')}
                            </Label>
                            <div className="relative">
                                {/* Sử dụng icon Lock */}
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500`} />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    id="password" // Đổi id thành 'password'
                                    name="password" // Thêm name attribute nếu cần
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder={t('login.password.placeholder')}
                                    className={`pl-9 pr-10 text-sm bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 focus:ring-primary-500/50 focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                                />
                                {/* Nút Show/Hide Password */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                             {/* Không cần hiển thị lỗi password riêng ở đây nếu chỉ có lỗi chung */}
                        </div>

                        {/* Submit Button (style giống Register) */}
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-white hover:shadow-lg hover:shadow-[#A259FF]/40 dark:hover:shadow-[#A259FF]/30 transition-all duration-300 transform hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? t('login.button.loading')
                                : t('login.button')
                            }
                        </Button>

                        {/* Link sang Register (style giống Register) */}
                        <div className="text-center text-sm text-gray-700 dark:text-gray-200 pt-2">
                            {t('login.register.text')}{' '}
                            <a href="/register" className="text-gray-700 hover:text-white dark:text-gray-200 dark:hover:text-pink-600 font-medium hover:underline">
                                {t('login.register.link')}
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
            {/* === KẾT THÚC: Cấu trúc layout giống Register === */}
        </div>
    );
};

export default Login;