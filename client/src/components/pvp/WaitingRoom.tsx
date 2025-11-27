"use client"

import { useState, useEffect } from "react"
import { X, Users, Clock, Copy, Send, User, Settings, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/hooks/use-toast"

interface WaitingRoomProps {
  room: any
  currentUser: any
  onLeaveRoom: () => void
  onStartMatch: () => void
  onInviteFriend: (friendId: string) => void
}

export function WaitingRoom({ room, currentUser, onLeaveRoom, onStartMatch, onInviteFriend }: WaitingRoomProps) {
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState(0)
  const [copied, setCopied] = useState(false)

  // Simulate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    toast({
      title: "Đã sao chép",
      description: "Mã phòng đã được sao chép vào clipboard"
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInvite = () => {
    const inviteUrl = `${window.location.origin}/pvp/room/${room.id}`
    navigator.clipboard.writeText(inviteUrl)
    toast({
      title: "Đã sao chép link mời",
      description: "Gửi link này cho bạn bè để mời họ vào phòng"
    })
  }

  const isHost = room.hostId === currentUser?.id
  const canStart = room.participants && room.participants.length >= 2

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onLeaveRoom}>
              <X className="w-4 h-4 mr-2" />
              Rời phòng
            </Button>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <Badge variant="secondary" className={getDifficultyColor(room.settings?.difficulty)}>
              {room.settings?.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Cài đặt phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <p className="font-medium">{room.settings?.timeLimit} phút</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngôn ngữ</p>
                    <p className="font-medium">
                      {room.settings?.language === 'all' ? 'Tất cả' : room.settings?.language}
                    </p>
                  </div>
                </div>
                
                {room.settings?.isPrivate && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Phòng riêng tư</p>
                    <Badge variant="outline">Mật khẩu: {room.settings?.password}</Badge>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Mô tả</p>
                  <p className="text-sm">
                    {room.description || 'Không có mô tả'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Người chơi ({room.participants?.length || 0}/2)
                  </div>
                  {isHost && canStart && (
                    <Button onClick={onStartMatch} className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Bắt đầu trận
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {room.participants?.map((participant: any, index: number) => (
                    <div key={participant.userId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {participant.username}
                            {participant.userId === currentUser?.id && ' (Bạn)'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Rating: {participant.rating || 1200}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.isReady ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Sẵn sàng
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Đang chờ
                          </Badge>
                        )}
                        {participant.userId === room.hostId && (
                          <Badge variant="secondary">
                            Chủ phòng
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {room.participants?.length < 2 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Đang chờ người chơi...</p>
                      <p className="text-sm">
                        {isHost ? 'Mời bạn bè hoặc đợi người chơi khác tham gia' : 'Chủ phòng đang tìm đối thủ...'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat/Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCopyRoomCode}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Đã sao chép!' : 'Sao chép mã phòng'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleInvite}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Mời bạn bè
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Mã phòng:</h4>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono bg-background px-3 py-2 rounded border">
                      {room.id}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleCopyRoomCode}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Luật chơi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                    <span>Người hoàn thành tất cả test cases đầu tiên sẽ thắng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                    <span>Nếu hết thời gian, người qua nhiều test cases nhất sẽ thắng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0"></div>
                    <span>Người thắng nhận được XP thưởng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                    <span>Bài tập sẽ được chọn ngẫu nhiên từ database</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Số người chơi:</span>
                    <span className="font-medium">{room.participants?.length || 0}/2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Trạng thái:</span>
                    <span className="font-medium">
                      {canStart ? 'Đã sẵn sàng' : 'Đang chờ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Độ khó:</span>
                    <Badge className={getDifficultyColor(room.settings?.difficulty)}>
                      {room.settings?.difficulty}
                    </Badge>
                  </div>
                </div>

                {isHost && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Với tư cách chủ phòng, bạn có thể bắt đầu trận khi có đủ người chơi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}