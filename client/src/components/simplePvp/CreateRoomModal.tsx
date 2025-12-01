import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import simplePvpApi, { RoomSettings } from '@/services/simplePvpApi';
import { useToastActions } from '@/components/ui/toast';

interface CreateRoomModalProps {
  children: React.ReactNode;
  onRoomCreated?: (room: any) => void;
}

export function CreateRoomModal({ children, onRoomCreated }: CreateRoomModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [settings, setSettings] = useState<RoomSettings>({
    timeLimit: 15,
    difficulty: 'Medium',
    maxParticipants: 2,
  });

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
      console.log('Creating room with:', { roomName: roomName.trim(), settings });
      const result = await simplePvpApi.createRoom(roomName.trim(), settings);
      
      if (result.success) {
        success('Thành công', 'Phòng đã được tạo thành công!');
        setOpen(false);
        setRoomName('');
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo Phòng Mới</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roomName">Tên phòng</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Nhập tên phòng..."
              maxLength={50}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {roomName.length}/50 ký tự
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Độ khó</Label>
              <Select
                value={settings.difficulty}
                onValueChange={(value: 'Easy' | 'Medium' | 'Hard') =>
                  setSettings({ ...settings, difficulty: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Dễ</Badge>
                      <span>Phù hợp người mới</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800">Trung bình</Badge>
                      <span>Thử thách vừa phải</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Hard">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">Khó</Badge>
                      <span>Dành cho chuyên gia</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimit">Thời gian</Label>
              <Select
                value={settings.timeLimit.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, timeLimit: parseInt(value) })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 phút</SelectItem>
                  <SelectItem value="15">15 phút</SelectItem>
                  <SelectItem value="20">20 phút</SelectItem>
                  <SelectItem value="30">30 phút</SelectItem>
                  <SelectItem value="45">45 phút</SelectItem>
                  <SelectItem value="60">60 phút</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Số người chơi</Label>
              <Select
                value={(settings.maxParticipants || 2).toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, maxParticipants: parseInt(value) })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Số người chơi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 người</SelectItem>
                  <SelectItem value="4">4 người</SelectItem>
                  <SelectItem value="6">6 người</SelectItem>
                  <SelectItem value="8">8 người</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Tóm tắt cài đặt</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Độ khó:</div>
              <div className={simplePvpApi.getDifficultyColor(settings.difficulty)}>
                {simplePvpApi.getDifficultyText(settings.difficulty)}
              </div>
              <div>Thời gian:</div>
              <div>{simplePvpApi.formatTimeLimit(settings.timeLimit)}</div>
              <div>Tối đa:</div>
              <div>{settings.maxParticipants || 2} người chơi</div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo phòng'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
