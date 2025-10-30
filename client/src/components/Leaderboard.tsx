import React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trophy, Award, Medal } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";

type Learner = {
  rank: number;
  username: string;
  avatar?: string;
  completedCount: number;
  totalPoints: number;
}

const Leaderboard: React.FC = () => {
  const { t } = useLanguage();
  const [learners, setLearners] = useState<Learner[]>([])

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    fetch(`${API_BASE}/api/leaderboard/top?limit=5`)
      .then((r) => r.json())
      .then((json) => {
        if (json && json.success && Array.isArray(json.data)) {
          setLearners(json.data.map((d: any) => ({
            rank: d.rank,
            username: d.username || `user-${d.userId}`,
            avatar: d.avatar || undefined,
            completedCount: d.completedCount || 0,
            totalPoints: d.totalPoints || 0
          })))
        }
      })
      .catch(() => {})
  }, [])

  const GradientTrophy = ({ className = 'h-6 w-6' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF007A" />
          <stop offset="100%" stopColor="#A259FF" />
        </linearGradient>
      </defs>
      <path d="M8 3h8v2a3 3 0 0 1-3 3H11A3 3 0 0 1 8 5V3z" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 7h12v2a6 6 0 0 1-6 6 6 6 0 0 1-6-6V7z" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 19h6v2H9v-2z" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <GradientTrophy className="h-6 w-6" />;
      case 2:
        return <Award className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-500" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <section className="w-full bg-gradient-to-br from-white via-[#FAF5FF] to-[#FFF4FA] dark:from-[#0E0A12] dark:via-[#14101D] dark:to-[#1A1623] relative overflow-hidden py-20" id="leaderboard">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 relative z-10">
            Top <span className="bg-gradient-to-r from-[#FF007A] to-[#A259FF] bg-clip-text text-transparent">Learners</span>
          </h2>
          <p className="text-xl text-black dark:text-white max-w-2xl mx-auto">{t("leaderboard.subtitle")}</p>
        </div>

        <Card className="max-w-4xl mx-auto bg-gradient-card border-border shadow-elegant animate-fade-in relative">
          <CardHeader>
            <CardTitle className="flex items-baseline gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              {t("leaderboard.heading")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {learners.map((learner, index) => (
              <div
                key={learner.rank}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:shadow-glow hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center w-12">{getRankIcon(learner.rank)}</div>

                <div className="text-4xl">{learner.avatar || '👤'}</div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{learner.username}</h3>
                  <Badge className={`bg-gradient-to-r from-primary to-secondary text-white border-0 mt-1`}>{learner.completedCount} completed</Badge>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">{learner.totalPoints.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{t("leaderboard.points")}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Leaderboard;
