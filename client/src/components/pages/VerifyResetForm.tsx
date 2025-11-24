import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Mail, Phone, Lock, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

export default function VerifyResetForm() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const e = searchParams.get('emailOrPhone');
    if (e) setEmailOrPhone(decodeURIComponent(e));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-reset`, { 
        emailOrPhone, 
        code, 
        newPassword 
      });
      setMessage(res.data?.message || 'Đổi mật khẩu thành công!');
      // redirect to login after success
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = axios.isAxiosError(err) 
        ? err.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn!' 
        : 'Mã xác thực không hợp lệ hoặc đã hết hạn!';
      setError(msg as string);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmail = emailOrPhone.includes('@');

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Email/Phone Input */}
      <div className="space-y-1">
        <Label htmlFor="emailOrPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Email hoặc số điện thoại
        </Label>
        <div className="relative">
          {isEmail ? (
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          )}
          <Input
            type="text"
            id="emailOrPhone"
            value={emailOrPhone}
            onChange={e => setEmailOrPhone(e.target.value)}
            placeholder="Email hoặc số điện thoại"
            required
            className={`pl-9 text-sm bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 focus:ring-primary-500/50 focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Verification Code Input */}
      <div className="space-y-1">
        <Label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mã xác thực
        </Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            id="code"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Nhập mã 6 chữ số"
            required
            maxLength={6}
            className={`pl-9 text-sm bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 focus:ring-primary-500/50 focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-center tracking-widest text-lg font-semibold`}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* New Password Input */}
      <div className="space-y-1">
        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mật khẩu mới
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          <Input
            type={showPassword ? "text" : "password"}
            id="newPassword"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            required
            minLength={6}
            className={`pl-9 pr-10 text-sm bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 focus:ring-primary-500/50 focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-1">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Xác nhận mật khẩu
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            required
            minLength={6}
            className={`pl-9 pr-10 text-sm bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 focus:ring-primary-500/50 focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-white hover:shadow-lg hover:shadow-[#A259FF]/40 dark:hover:shadow-[#A259FF]/30 transition-all duration-300 transform hover:-translate-y-0.5"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          'Đổi mật khẩu'
        )}
      </Button>

      <div className="text-center text-sm text-gray-700 dark:text-gray-200 pt-2">
        Chưa nhận được mã?{' '}
        <a href="/forgot-password" className="text-gray-700 hover:text-white dark:text-gray-200 dark:hover:text-pink-600 font-medium hover:underline">
          Gửi lại mã
        </a>
      </div>
    </form>
  );
}
