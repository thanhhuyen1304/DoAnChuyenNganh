"use client"

import { useState } from "react"
import { X, Users, Clock, Code, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/hooks/use-toast"

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (roomData: any) => void
}

export function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const { toast } = useToast()
  const [roomName, setRoomName] = useState("")
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")
  const [timeLimit, setTimeLimit] = useState(10) // phút
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState("")
  const [language, setLanguage] = useState("all")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!roomName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên phòng",
        variant: "destructive"
      })
      return
    }

    if (isPrivate && !password.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu cho phòng riêng",
        variant: "destructive"
      })
      return
    }

    const roomData = {
      name: roomName.trim(),
      description: description.trim(),
      settings: {
        difficulty,
        timeLimit, // phút
        maxParticipants: 2, // Luôn là 2 cho 1vs1
        isPrivate,
        password: isPrivate ? password.trim() : undefined,
        language,
        mode: "1vs1" // Luôn là 1vs1
      }
    }

    onCreateRoom(roomData)
    onClose()
    
    // Reset form
    setRoomName("")
    setDescription("")
    setDifficulty("Medium")
    setTimeLimit(10)
    setIsPrivate(false)
    setPassword("")
    setLanguage("all")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Tạo Phòng Thi Đấu
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="roomName">Tên phòng *</Label>
            <Input
              id="roomName"
              placeholder="Nhập tên phòng..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={50}
              required
            />
            <p className="text-xs text-muted-foreground">
              {roomName.length}/50 ký tự
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả phòng (tùy chọn)</Label>
            <Input
              id="description"
              placeholder="Mô tả ngắn gọn về phòng của bạn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Độ khó bài tập</Label>
            <Select value={difficulty} onValueChange={(value: "Easy" | "Medium" | "Hard") => setDifficulty(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Dễ - 5-10 phút</span>
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Trung bình - 10-20 phút</span>
                  </div>
                </SelectItem>
                <SelectItem value="Hard">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Khó - 20-30 phút</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Hệ thống sẽ chọn ngẫu nhiên bài tập phù hợp với độ khó này
            </p>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Thời gian thi đấu: {timeLimit} phút
            </Label>
            <Slider
              value={[timeLimit]}
              onValueChange={(value) => setTimeLimit(value[0])}
              max={30}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 phút</span>
              <span>30 phút</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cả hai người chơi sẽ có cùng thời gian để hoàn thành bài tập
            </p>
          </div>

          {/* Language Restriction */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Giới hạn ngôn ngữ lập trình
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ngôn ngữ</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="c">C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Private Room */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="private" className="cursor-pointer">Phòng riêng tư</Label>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
            
            {isPrivate && (
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu phòng</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={20}
                />
              </div>
            )}
          </div>

          {/* Game Rules Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-sm">Luật chơi PvP</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Người hoàn thành tất cả test cases đầu tiên sẽ thắng</p>
              <p>• Nếu hết thời gian, người qua nhiều test cases nhất sẽ thắng</p>
              <p>• Người thắng nhận được XP thưởng dựa trên độ khó</p>
              <p>• Bài tập sẽ được chọn ngẫu nhiên từ database</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" className="min-w-32">
              Tạo phòng
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}