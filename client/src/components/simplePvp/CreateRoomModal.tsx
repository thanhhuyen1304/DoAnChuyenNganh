import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import simplePvpApi, { RoomSettings } from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';
import {
  Code2,
  Clock,
  Users,
  Lock,
  Globe,
  Zap,
  Award,
  Settings2
} from 'lucide-react';

interface CreateRoomModalProps {
  children: React.ReactNode;
  onRoomCreated?: (room: any) => void;
}

export function CreateRoomModal({ children, onRoomCreated }: CreateRoomModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [settings, setSettings] = useState<RoomSettings>({
    timeLimit: 15,
    difficulty: 'Medium',
    maxParticipants: 2,
  });

  // Danh sách ngôn ngữ lập trình
  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚡' },
    { value: 'csharp', label: 'C#', icon: '💜' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷' },
    { value: 'go', label: 'Go', icon: '🐹' },
    { value: 'rust', label: 'Rust', icon: '🦀' },
  ];

  const { success, error } = useToastActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      error('Lỗi', 'Bạn cần đăng nhập để tạo phòng');
      return;
    }
    
    if (!roomName.trim()) {
      error('Lỗi', 'Tên phòng không được để trống');
      return;
    }

    setIsLoading(true);
    try {
      const roomData = {
        roomName: roomName.trim(),
        settings: {
          ...settings,
          isPrivate,
          language,
        }
      };
      console.log('Creating room with:', roomData);
      const result = await simplePvpApi.createRoom(roomName.trim(), {
        ...settings,
        isPrivate,
        language,
      } as any);
      
      if (result.success) {
        success('Thành công', 'Phòng đã được tạo thành công!');
        setOpen(false);
        setRoomName('');
        setIsPrivate(false);
        setLanguage('javascript');
        setSettings({
          timeLimit: 15,
          difficulty: 'Medium',
          maxParticipants: 2,
        });
        
        if (onRoomCreated) {
          onRoomCreated(result.data);
        }
      }
    } catch (err: any) {
      console.error('Create room error:', err);
      if (err.response?.status === 401) {
        error('Lỗi', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        error('Lỗi', err.response?.data?.message || 'Không thể tạo phòng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto my-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎮 Tạo Phòng Thi Đấu Mới
          </DialogTitle>
          <DialogDescription>
            Tùy chỉnh cài đặt phòng để bắt đầu cuộc thi lập trình của bạn
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin cơ bản */}
          <Card className="p-4 border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName" className="text-base font-semibold flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Tên phòng
                </Label>
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ví dụ: Đấu trường lập trình..."
                  maxLength={50}
                  disabled={isLoading}
                  className="text-base border-2 focus:border-blue-500"
                />
                <p className="text-sm text-muted-foreground flex justify-between">
                  <span>Đặt tên dễ nhớ cho phòng của bạn</span>
                  <span className="font-medium">{roomName.length}/50</span>
                </p>
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  {isPrivate ? (
                    <Lock className="w-5 h-5 text-orange-500" />
                  ) : (
                    <Globe className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <Label htmlFor="privacy" className="text-base font-semibold cursor-pointer">
                      {isPrivate ? 'Phòng riêng tư' : 'Phòng công khai'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isPrivate ? 'Chỉ những người có mã mời mới vào được' : 'Mọi người đều có thể tham gia'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="privacy"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  disabled={isLoading}
                />
              </div>
            </div>
          </Card>

          {/* Ngôn ngữ lập trình */}
          <Card className="p-4 border-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4" />
              Ngôn ngữ lập trình
            </Label>
            <Select
              value={language}
              onValueChange={setLanguage}
              disabled={isLoading}
            >
              <SelectTrigger className="border-2 focus:border-purple-500">
                <SelectValue placeholder="Chọn ngôn ngữ" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.icon}</span>
                      <span className="font-medium">{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Tất cả thành viên sẽ code bằng ngôn ngữ này
            </p>
          </Card>

          {/* Cài đặt game */}
          <Card className="p-4 border-2 border-green-100 bg-gradient-to-br from-green-50/50 to-teal-50/50">
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" />
              Cài đặt trò chơi
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Độ khó */}
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4" />
                  Độ khó
                </Label>
                <Select
                  value={settings.difficulty}
                  onValueChange={(value: 'Easy' | 'Medium' | 'Hard') =>
                    setSettings({ ...settings, difficulty: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Chọn độ khó" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">Dễ</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Trung bình</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="Hard">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800 border-red-200">Khó</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Thời gian */}
              <div className="space-y-2">
                <Label htmlFor="timeLimit" className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  Thời gian
                </Label>
                <Select
                  value={settings.timeLimit.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, timeLimit: parseInt(value) })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Chọn thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">⚡ 10 phút</SelectItem>
                    <SelectItem value="15">🔥 15 phút</SelectItem>
                    <SelectItem value="20">💪 20 phút</SelectItem>
                    <SelectItem value="30">⏰ 30 phút</SelectItem>
                    <SelectItem value="45">📚 45 phút</SelectItem>
                    <SelectItem value="60">🎯 60 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Số người */}
              <div className="space-y-2">
                <Label htmlFor="maxParticipants" className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  Người chơi
                </Label>
                <Select
                  value={(settings.maxParticipants || 2).toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, maxParticipants: parseInt(value) })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Số người chơi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">👥 2 người</SelectItem>
                    <SelectItem value="4">👨‍👩‍👧‍👦 4 người</SelectItem>
                    <SelectItem value="6">🎭 6 người</SelectItem>
                    <SelectItem value="8">🎪 8 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Tóm tắt cài đặt */}
          <Card className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              📋 Tóm tắt cài đặt
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <div className="opacity-90 mb-1">🎯 Độ khó:</div>
                <div className="font-bold text-base">
                  {simplePvpApi.getDifficultyText(settings.difficulty)}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <div className="opacity-90 mb-1">⏱️ Thời gian:</div>
                <div className="font-bold text-base">
                  {simplePvpApi.formatTimeLimit(settings.timeLimit)}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <div className="opacity-90 mb-1">👥 Số người:</div>
                <div className="font-bold text-base">
                  {settings.maxParticipants || 2} người chơi
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <div className="opacity-90 mb-1">💻 Ngôn ngữ:</div>
                <div className="font-bold text-base">
                  {languages.find(l => l.value === language)?.label || 'JavaScript'}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 col-span-2">
                <div className="opacity-90 mb-1">🔒 Quyền truy cập:</div>
                <div className="font-bold text-base flex items-center gap-2">
                  {isPrivate ? (
                    <>
                      <Lock className="w-4 h-4" /> Phòng riêng tư
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" /> Phòng công khai
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-2"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Tạo phòng ngay
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
