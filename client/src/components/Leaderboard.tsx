import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trophy, Award, Medal } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";

const Leaderboard = () => {
  const { t } = useLanguage();
  const topLearners = [
    { 
      rank: 1, 
      name: "Nguyễn Văn An", 
      avatar: "👨‍💻", 
      points: 2840, 
      badge: "Master Debugger",
      badgeColor: "from-yellow-500 to-yellow-600"
    },
    { 
      rank: 2, 
      name: "Trần Thị Bình", 
      avatar: "👩‍💻", 
      points: 2520, 
      badge: "Bug Hunter Pro",
      badgeColor: "from-gray-400 to-gray-500"
    },
    { 
      rank: 3, 
      name: "Lê Minh Châu", 
      avatar: "🧑‍💻", 
      points: 2380, 
      badge: "Debug Expert",
      badgeColor: "from-orange-500 to-orange-600"
    },
    { 
      rank: 4, 
      name: "Phạm Hoàng Dũng", 
      avatar: "👨‍💻", 
      points: 2150, 
      badge: "Code Warrior",
      badgeColor: "from-primary to-primary-glow"
    },
    { 
      rank: 5, 
      name: "Võ Thị Em", 
      avatar: "👩‍💻", 
      points: 2020, 
      badge: "Rising Star",
      badgeColor: "from-accent to-accent-glow"
    },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Award className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-500" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <section className="py-20 px-4" id="leaderboard">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            Top{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Learners
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("leaderboard.subtitle")}
          </p>
        </div>

        <Card className="max-w-4xl mx-auto bg-gradient-card border-border shadow-elegant animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              {t("leaderboard.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topLearners.map((learner, index) => (
              <div
                key={learner.rank}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:shadow-glow hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(learner.rank)}
                </div>

                <div className="text-4xl">{learner.avatar}</div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{learner.name}</h3>
                  <Badge 
                    className={`bg-gradient-to-r ${learner.badgeColor} text-white border-0 mt-1`}
                  >
                    {learner.badge}
                  </Badge>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {learner.points.toLocaleString()}
                  </div>
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
