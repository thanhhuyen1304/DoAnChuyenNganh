import React from "react";
import { Code2, Video, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useLanguage } from "./contexts/LanguageContext";

const Features = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: Code2,
      titleKey: "features.challenge.title",
      descKey: "features.challenge.desc",
      gradient: "from-primary to-primary-glow",
    },
    {
      icon: Video,
      titleKey: "features.learning.title",
      descKey: "features.learning.desc",
      gradient: "from-accent to-accent-glow",
    },
    {
      icon: TrendingUp,
      titleKey: "features.tracking.title",
      descKey: "features.tracking.desc",
      gradient: "from-primary to-accent",
    },
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            {t("features.title").split(" ")[0]}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("features.title").split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
