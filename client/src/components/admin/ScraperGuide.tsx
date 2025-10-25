import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Database, Globe, Code, Settings, Shield, Bug } from 'lucide-react';

const ScraperGuide = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📚 Hướng dẫn sử dụng Scraper
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tìm hiểu cách sử dụng hệ thống scraper và debug token
        </p>
      </div>

      {/* Token Debugger Explanation */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Shield className="h-5 w-5" />
            Debug Token - Dùng để làm gì?
          </CardTitle>
          <CardDescription>
            Tab "Debug Token" giúp bạn kiểm tra và khắc phục các vấn đề về xác thực
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🔍 Chức năng chính:</h4>
              <ul className="text-sm space-y-1">
                <li>• Kiểm tra token có hợp lệ không</li>
                <li>• Xem thông tin user hiện tại</li>
                <li>• Refresh token khi hết hạn</li>
                <li>• Clear token để đăng nhập lại</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🛠️ Khi nào sử dụng:</h4>
              <ul className="text-sm space-y-1">
                <li>• Scraper báo lỗi "Token không hợp lệ"</li>
                <li>• Không thể scrape được bài tập</li>
                <li>• Cần kiểm tra quyền admin</li>
                <li>• Debug các lỗi authentication</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>💡 Tip:</strong> Nếu scraper không hoạt động, hãy vào tab "Debug Token" trước để kiểm tra token và refresh nếu cần!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Scraper Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              CSES Problem Set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Thuật toán</Badge>
              <Badge variant="outline">Chất lượng cao</Badge>
              <p className="text-sm text-gray-600">
                Bộ bài tập từ Đại học Helsinki, phù hợp cho người mới học
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              AtCoder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Competitive Programming</Badge>
              <Badge variant="outline">Contest</Badge>
              <p className="text-sm text-gray-600">
                Nền tảng competitive programming hàng đầu Nhật Bản
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-orange-500" />
              LeetCode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Phỏng vấn</Badge>
              <Badge variant="outline">Data Structures</Badge>
              <p className="text-sm text-gray-600">
                Bài tập phỏng vấn và thuật toán phổ biến
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classification Settings */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Settings className="h-5 w-5" />
            Phân loại tự động
          </CardTitle>
          <CardDescription>
            Hệ thống sẽ tự động phân loại bài tập theo cài đặt của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🎯 Phân loại độ khó:</h4>
              <ul className="text-sm space-y-1">
                <li>• <Badge variant="outline" className="bg-green-100">Easy</Badge>: 10 điểm</li>
                <li>• <Badge variant="outline" className="bg-yellow-100">Medium</Badge>: 20 điểm</li>
                <li>• <Badge variant="outline" className="bg-red-100">Hard</Badge>: 30 điểm</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏷️ Danh mục:</h4>
              <ul className="text-sm space-y-1">
                <li>• <Badge variant="outline">Syntax</Badge>: Lỗi cú pháp</li>
                <li>• <Badge variant="outline">Logic</Badge>: Lỗi logic</li>
                <li>• <Badge variant="outline">Performance</Badge>: Hiệu suất</li>
                <li>• <Badge variant="outline">Security</Badge>: Bảo mật</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Quy trình sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold">Đăng nhập Admin</h4>
                <p className="text-sm text-gray-600">Sử dụng tài khoản admin@bughunter.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold">Kiểm tra Token</h4>
                <p className="text-sm text-gray-600">Vào tab "Debug Token" để đảm bảo token hợp lệ</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold">Cài đặt phân loại</h4>
                <p className="text-sm text-gray-600">Chọn ngôn ngữ, độ khó, danh mục và điểm số</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-semibold">Scrape bài tập</h4>
                <p className="text-sm text-gray-600">Click nút scrape từ nguồn mong muốn</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScraperGuide;
