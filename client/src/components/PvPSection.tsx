import React from "react";
import { Button } from "@/components/ui/button";
import { Swords, Users, Trophy, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PvPSection() {
  const navigate = useNavigate();

  const stats = [
    { icon: Users, label: "Người chơi online", value: "1,234", color: "text-blue-500" },
    { icon: Swords, label: "Trận đấu hôm nay", value: "5,678", color: "text-green-500" },
    { icon: Trophy, label: "Giải thưởng tuần", value: "10", color: "text-yellow-500" },
  ];

  const features = [
    {
      title: "Thi Đấu 1vs1",
      description: "Thách đấu trực tiếp với các lập trình viên khác",
      icon: Swords,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Phòng Tùy Chỉnh",
      description: "Tạo phòng với quy định và đề bài riêng",
      icon: Users,
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Bảng Xếp Hạng",
      description: "Cạnh tranh và vươn tới top đầu",
      icon: Trophy,
      color: "bg-yellow-500/10 text-yellow-500",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Swords className="w-4 h-4" />
            <span className="text-sm font-semibold">Thi Đấu PvP</span>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Cạnh Tranh Đỉnh Cao
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thách đấu với các lập trình viên khác, nâng cao kỹ năng và giành giải thưởng
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 text-center"
            >
              <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Active Rooms Preview */}
        <div className="bg-card border border-border rounded-xl p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              Phòng Đang Chờ
            </h3>
            <Button 
              variant="outline" 
              onClick={() => navigate("/pvp")}
              className="gap-2"
            >
              Xem Tất Cả
              <TrendingUp className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { host: "CodeMaster", topic: "Dynamic Programming", difficulty: "Medium", players: "1/2" },
              { host: "AlgoNinja", topic: "Graph Theory", difficulty: "Hard", players: "1/2" },
              { host: "SyntaxKing", topic: "String Manipulation", difficulty: "Easy", players: "1/2" },
            ].map((room, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate("/pvp")}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${
                    room.difficulty === "Easy"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : room.difficulty === "Medium"
                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                    {room.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">{room.players}</span>
                </div>
                <div className="font-medium text-foreground mb-1">{room.host}'s Room</div>
                <div className="text-sm text-muted-foreground">{room.topic}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="gap-3 px-8 py-4 text-lg"
            onClick={() => navigate("/pvp")}
          >
            <Swords className="w-5 h-5" />
            Bắt Đầu Thi Đấu
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Hoặc <button 
              onClick={() => navigate("/pvp")} 
              className="text-primary hover:underline"
            >
              xem các phòng đang chờ
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}