import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Mail, Phone, Loader2 } from 'lucide-react';

import { getApiBase } from '../../lib/apiBase'
const API_BASE_URL = getApiBase();

interface ApiResponse {
  success: boolean;
  message: string;
  previewUrl?: string;
}

export default function RequestResetForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const trimmedInput = email.trim();
    if (!trimmedInput) {
      setError('Vui lòng nhập email');
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post<ApiResponse>(
        `${API_BASE_URL}/auth/request-reset`,
        { emailOrPhone: trimmedInput },
        {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      if (res.data.success) {
        setMessage(res.data.message || 'Mã xác thực đã được gửi!');
        if (res.data.previewUrl) setPreviewUrl(res.data.previewUrl);
        setTimeout(() => {
          navigate(`/verify-reset?emailOrPhone=${encodeURIComponent(trimmedInput)}`);
        }, res.data.previewUrl ? 3000 : 1500);
      } else {
        setError(res.data.message || 'Đã xảy ra lỗi. Vui lòng thử lại!');
      }
    } catch (err) {
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại!';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const status = err.response.status;
          const data = err.response.data;
          if (status === 429) errorMessage = data?.message || 'Bạn đã yêu cầu quá nhiều lần. Vui lòng đợi một chút rồi thử lại.';
          else if (status === 400) errorMessage = data?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
          else if (status === 500) errorMessage = data?.message || 'Lỗi server. Vui lòng thử lại sau.';
          else errorMessage = data?.message || `Lỗi: ${status}`;
        } else if (err.request) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else {
          errorMessage = 'Lỗi khi gửi yêu cầu. Vui lòng thử lại.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Chỉ nhận email, không còn số điện thoại

  return (
    <div className="space-y-4">
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

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className={`pl-9 text-sm bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 focus:ring-primary-500/50 focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
              disabled={isLoading}
            />
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
              Đang gửi...
            </>
          ) : (
            'Gửi mã xác thực'
          )}
        </Button>
      </form>
      
      {previewUrl && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertDescription>
            <p className="mb-2 text-sm font-medium">🔍 Xem email được gửi (development mode):</p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all text-xs"
            >
              {previewUrl}
            </a>
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center text-sm text-gray-700 dark:text-gray-200 pt-2">
        Nhớ mật khẩu?{' '}
        <a href="/login" className="text-gray-700 hover:text-white dark:text-gray-200 dark:hover:text-pink-600 font-medium hover:underline">
          Đăng nhập
        </a>
      </div>
    </div>
  );
}
