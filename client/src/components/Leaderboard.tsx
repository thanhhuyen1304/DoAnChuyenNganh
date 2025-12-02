import React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trophy, Award, Medal } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { getApiBase } from '../lib/apiBase'

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
    const API_BASE = getApiBase()
    fetch(`${API_BASE}/leaderboard/top?limit=5`)
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
    <section className="py-24 bg-gradient-to-br from-white via-[#FAF5FF] to-[#FFF4FA] dark:from-[#0E0A12] dark:via-[#14101D] dark:to-[#1A1623] relative overflow-hidden" id="leaderboard">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF007A]/10 dark:bg-[#A259FF]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#A259FF]/10 dark:bg-[#FF007A]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl animate-pulse"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">Learners</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">{t("leaderboard.subtitle")}</p>
        </div>

        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-[#FFE6F0] via-[#F2E8FF] to-[#E6F0FF] dark:from-[#1A1520] dark:via-[#1E162A] dark:to-[#151627] rounded-2xl shadow-[0_0_30px_rgba(162,89,255,0.25)] border border-[#A259FF]/30 relative overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF007A] to-[#A259FF] flex items-center justify-center text-white shadow-lg">
                <Trophy className="h-6 w-6" />
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
                {t("leaderboard.heading")}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-8 pt-0">
            {learners.map((learner, index) => (
              <div
                key={learner.rank}
                className={`flex items-center gap-6 p-6 rounded-2xl bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-transparent hover:border-[#A259FF]/30 hover:shadow-[0_0_25px_rgba(162,89,255,0.2)] transition-all duration-500 transform hover:-translate-y-1 relative overflow-hidden group`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF007A] to-[#A259FF] opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                
                <div className="flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-md relative z-10">
                  {getRankIcon(learner.rank)}
                </div>

                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-md text-2xl">
                  {learner.avatar || '👤'}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{learner.username}</h3>
                  <Badge className="bg-gradient-to-r from-[#FF007A] to-[#A259FF] text-white border-0 px-3 py-1 text-sm font-medium">
                    {learner.completedCount} completed
                  </Badge>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
                    {learner.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("leaderboard.points")}</div>
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
