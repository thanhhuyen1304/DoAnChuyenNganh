import React from 'react';
import RequestResetForm from './RequestResetForm';
import { Card, CardContent } from '../ui/card';
import { Bug, ArrowLeft } from 'lucide-react';

// Sử dụng cùng ảnh nền như Login/Register
const decoImg = '/logo.jpg';

export default function ForgotPassword() {
  return (
    <div className="w-full min-h-screen fixed inset-0 flex items-center justify-center py-12 px-4 overflow-hidden">
      {/* Background is handled by BackgroundWrapper - only keep overlay decoration */}
      <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm" />
      </div>

      <Card className="w-full max-w-md relative overflow-hidden bg-white/10 shadow-2xl border border-white/90 dark:bg-gray-900/20 dark:border-gray-800/50 z-10 backdrop-blur-lg p-1">
        <CardContent className="p-5 bg-white/5 dark:bg-black/20 rounded-lg">
          {/* Back Button */}
          <div className="absolute left-4 top-4">
            <a
              href="/login"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/100 dark:bg-gray-800/40 dark:hover:bg-white/90 transition-all duration-200 group"
              aria-label="Quay lại đăng nhập"
            >
              <ArrowLeft
                size={20}
                className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-600 transition-colors"
              />
            </a>
          </div>

          {/* Logo and Title */}
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
              Quên mật khẩu
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Nhập email để nhận mã xác thực đặt lại mật khẩu
            </p>
          </div>

          <RequestResetForm />
        </CardContent>
      </Card>
    </div>
  );
}
