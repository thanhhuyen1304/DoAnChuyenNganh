import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { Bug, Lock, Mail, User, Eye, EyeOff, ArrowLeft, Github } from 'lucide-react';
import { useTheme } from 'next-themes';

const decoImg = '/logo.jpg';

import { getApiBase } from '../../lib/apiBase';
const API_BASE_URL = getApiBase();

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        general: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { t } = useLanguage();
    useTheme();

    const { username, email, password, confirmPassword } = formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '', general: '' });
    };

    const validateForm = (): boolean => {
        let isValid = true;
        const newErrors = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            general: '',
        };

        if (username.length < 3) {
            newErrors.username = t('validation.username.minLength');
            isValid = false;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('validation.email.invalid');
            isValid = false;
        }

        if (password.length < 6) {
            newErrors.password = t('validation.password.minLength');
            isValid = false;
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = t('validation.confirmPassword.mismatch') || 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            general: '',
        });

        try {
            console.log('Sending registration request to:', `${API_BASE_URL}/auth/register`);
            console.log('With data:', formData);
            console.log('Attempting to register with:', formData);
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
            });
            console.log('Server response:', response);

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const serverErrors = {
                        username: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                        general: '',
                    };

                    // express-validator returns errors as array with { param, msg }
                    if (Array.isArray(data.errors)) {
                        data.errors.forEach((err: any) => {
                            const field = err.param || err.field || err.path || '';
                            const message = err.msg || err.message || '';
                            if (field && Object.prototype.hasOwnProperty.call(serverErrors, field)) {
                                serverErrors[field as keyof typeof serverErrors] = message;
                            } else if (message) {
                                serverErrors.general = message;
                            }
                        });
                    } else if (typeof data.errors === 'object') {
                        // generic object shape { field: message }
                        for (const key in data.errors) {
                            if (Object.prototype.hasOwnProperty.call(serverErrors, key)) {
                                serverErrors[key as keyof typeof serverErrors] = data.errors[key];
                            } else {
                                serverErrors.general = data.errors[key];
                            }
                        }
                    }

                    // If server didn't provide field-specific messages, use top-level message
                    if (!serverErrors.general && data.message) {
                        serverErrors.general = data.message;
                    }

                    setErrors(serverErrors);
                    console.error('Server validation errors:', data.errors);
                } else {
                    setErrors(prev => ({
                        ...prev,
                        general: data.message || t('register.error.generic'),
                    }));
                    console.error('Server error:', data.message);
                }
                throw new Error(data.message || t('register.error.generic'));
            }

            if (data.success) {
                // Hiển thị thông báo thành công
                setErrors(prev => ({
                    ...prev,
                    general: t('register.success') || 'Đăng ký thành công! Vui lòng đăng nhập.'
                }));
                
                // Đợi 2 giây trước khi chuyển hướng
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
        } catch (err) {
            if (!errors.general && !errors.email && !errors.password && !errors.username) {
                setErrors({
                    ...errors,
                    general: err instanceof Error ? err.message : t('register.error.generic'),
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen fixed inset-0 flex items-center justify-center py-12 px-4 bg-white/10 overflow-hidden">
            <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
                <div
                    className="fixed inset-0 z-0 bg-cover bg-center opacity-40 dark:opacity-30 filter blur-sm"
                    style={{ backgroundImage: `url(${decoImg})` }}
                />
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm" />
            </div>

            <Card className="w-full max-w-md relative overflow-hidden bg-white/10 shadow-2xl border border-white/90 dark:bg-gray-900/20 dark:border-gray-800/50 z-10 backdrop-blur-lg p-1">
                <CardContent className="p-5 bg-white/5 dark:bg-black/20 rounded-lg">
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

                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#FF007A] to-[#A259FF] rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                                <div className="relative flex items-center bg-gradient-to-r from-[#FF007A] via-[#C77DFF] to-[#A259FF] text-white p-3 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <Bug size={32} className="animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF007A] to-[#A259FF] bg-clip-text text-transparent">
                            {t('register.title')}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {t('register.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {errors.general && (
                            <Alert 
                                variant={errors.general.includes('thành công') ? "default" : "destructive"}
                                className={errors.general.includes('thành công')
                                    ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
                                    : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                                }
                            >
                                <AlertDescription>{errors.general}</AlertDescription>
                            </Alert>
                        )}

                        {/* Username */}
                        <div className="space-y-1">
                            <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('register.username')}
                            </Label>
                            <div className="relative">
                                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 size-4 ${errors.username ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                <Input
                                    type="text"
                                    name="username"
                                    value={username}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('register.username.placeholder')}
                                    className={`pl-9 text-sm bg-white/70 dark:bg-gray-800/60 border ${errors.username ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/50'} focus:ring-2`}
                                />
                            </div>
                            {errors.username && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.username}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('register.email')}
                            </Label>
                            <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 size-4 ${errors.email ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                <Input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('register.email.placeholder')}
                                    className={`pl-9 text-sm bg-white/70 dark:bg-gray-800/60 border ${errors.email ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/50'} focus:ring-2`}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('register.password')}
                            </Label>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 size-4 ${errors.password ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('register.password.placeholder')}
                                    className={`pl-9 pr-10 text-sm bg-white/70 dark:bg-gray-800/60 border ${errors.password ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/50'} focus:ring-2`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('register.confirmPassword')}
                            </Label>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 size-4 ${errors.confirmPassword ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('register.confirmPassword.placeholder')}
                                    className={`pl-9 text-sm bg-white/70 dark:bg-gray-800/60 border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/50'} focus:ring-2`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-white hover:shadow-lg hover:shadow-[#A259FF]/40 dark:hover:shadow-[#A259FF]/30 transition-all duration-300 transform hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? t('register.button.loading') : t('register.button')}
                        </Button>

                        {/* OAuth Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300 dark:border-gray-700"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white/10 dark:bg-gray-900/20 px-2 text-gray-600 dark:text-gray-400">
                                    hoặc đăng ký với
                                </span>
                            </div>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full bg-white/70 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-800/80"
                                onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
                            >
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Đăng ký với Google
                            </Button>

                            {/* <Button
                                type="button"
                                variant="outline"
                                className="w-full bg-white/70 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-800/80"
                                onClick={() => window.location.href = `${API_BASE_URL}/auth/github`}
                            >
                                <Github className="mr-2 h-5 w-5" />
                                Đăng ký với GitHub
                            </Button> */}

                            {/* Facebook OAuth - Temporarily disabled */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full bg-white/70 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-800/80"
                                onClick={() => window.location.href = `${API_BASE_URL}/auth/facebook`}
                            >
                                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Đăng ký với Facebook
                            </Button>
                        </div>

                        <div className="text-center text-sm text-gray-700 dark:text-gray-200 pt-2">
                            {t('register.text')}{' '}
                            <a href="/login" className="text-gray-700 hover:text-white dark:text-gray-200 dark:hover:text-pink-600 font-medium hover:underline">
                                {t('register.link')}
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;
