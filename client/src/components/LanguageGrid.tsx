import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useLanguage } from "./contexts/LanguageContext";

const LanguageGrid = () => {
  const { t } = useLanguage();
  
  const languages = [
    { name: "JavaScript", icon: "JS", exercises: 120, color: "from-yellow-500 to-yellow-600" },
    { name: "Python", icon: "PY", exercises: 98, color: "from-blue-500 to-blue-600" },
    { name: "Java", icon: "JV", exercises: 85, color: "from-red-500 to-orange-600" },
    { name: "C++", icon: "C++", exercises: 76, color: "from-blue-600 to-purple-600" },
    { name: "C#", icon: "C#", exercises: 68, color: "from-purple-500 to-purple-600" },
    { name: "TypeScript", icon: "TS", exercises: 92, color: "from-blue-400 to-blue-500" },
  ];

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            {t("languages.title").split(" ")[0]}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("languages.title").split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("languages.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {languages.map((lang, index) => (
            <Card
              key={index}
              className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${lang.color} flex items-center justify-center font-code font-bold text-white text-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-glow`}>
                  {lang.icon}
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {lang.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {lang.exercises} {t("languages.exercises")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LanguageGrid;
